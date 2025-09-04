import HelpRequest from "../models/help.model.js";
import User from "../models/user.model.js";
import responseHandler from "../handlers/response.handler.js";
import { 
    validateHelpRequest, 
    sanitizeHelpInput, 
    validateBusinessRules,
    canUserViewTicket,
    canUserUpdateTicket 
} from "../validations/help.validation.js";
import sanitizeHtml from "sanitize-html";


const calculateResponseTime = (createdAt, respondedAt) => {
    if (!respondedAt || !createdAt) return null;
    return Math.floor((respondedAt - createdAt) / (1000 * 60 * 60)); // in hours
};

const getTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) ago`;
    if (hours > 0) return `${hours} hour(s) ago`;
    return "Just now";
};

const getPriorityScore = (priorityLevel) => {
    const priorities = {"Low ": 1, "Medium": 2, "High": 3, "Urgent": 4};
    return priorities[priorityLevel] || 1;
};

const getStatusColor = (status) => {
    const colors = {
        "Open": "#dc3545",  // Red
        "In Progress": "#ffc107",  // Yellow
        "Resolved": "#28a745",  // Green
        "Closed": "#6c757d"  // Grey
    };
    return colors[status] || "#6c757d"; // Default to Grey
};


const formatTicketForDisplay = (ticket) => ({
    ...ticket.toObject(),
    responseTime: calculateResponseTime(ticket.createdAt, ticket.respondedAt),
    timeAgo: getTimeAgo(ticket.createdAt),
    priorityScore: getPriorityScore(ticket.priorityLevel),
    statusColor: getStatusColor(ticket.status),
    ticketInfo: {
        number: ticket.ticketNumber,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priorityLevel,
        timeAgo: getTimeAgo(ticket.createdAt)
    }
});


export const createHelpRequest = async (req, res) => {
    try {
        const userId = req.user ? req.user._id : null;
        const hasUser = Boolean(userId);

        const {isValid, errors, data} = validateHelpRequest(req.body, hasUser);
        if (!isValid) {
            return responseHandler.badRequest(res, errors.join(" "));
        }

        const sanitizedData = sanitizeHelpInput(data);

        const businessErrors = validateBusinessRules(sanitizedData, req.user);
        if (businessErrors.length > 0) {
            return responseHandler.badRequest(res, businessErrors.join(", "));
        }

        const helpRequestData = {
            ...sanitizedData,
            userAgent: req.headers['user-agent'] || 'Unknown',
            ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        };

        if (userId) {
            helpRequestData.user = userId;
        } else{
            helpRequestData.guestName = sanitizedData.guestName;
            helpRequestData.guestEmail = sanitizedData.guestEmail;
        }

        const HelpRequest = await HelpRequest.create(helpRequestData);

        return responseHandler.created(res, {
            success: true,
            data: {
                ticketNumber: HelpRequest.ticketNumber,
                status: HelpRequest.status,
                message: `Help request submitted successfully! Ticket #${HelpRequest.ticketNumber}`
            }
        });
    } catch (error) {
        console.error("Error creating help request:", error);
        return responseHandler.internalServerError(res, 
            "An error occurred while submitting your help request. Please try again later.");
    }
};

export const getHelpRequests = async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        if (!isAdmin) {
            return responseHandler.forbidden(res, "Access denied.");
        }

        const {status, priorityLevel, issueCategory, page = 1, limit = 20, search, sortBy = 'createdAt'} = req.query;

        //Build query object
        const query = {};
        if (status) query.status = status;
        if (priorityLevel) query.priorityLevel = priorityLevel;
        if (issueCategory) query.issueCategory = issueCategory;
        if (search) {
            query.$or = [
                {subject: {$regex: search, $options: 'i'}},
                {guestName: {$regex: search, $options: 'i'}},
                {guestEmail: {$regex: search, $options: 'i'}},
                {ticketNumber: {$regex: search, $options: 'i'}}
            ];
        }

        const lim = Math.min(Math.max(Number(limit) || 20, 1), 100);
        const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;

        if (sortBy === 'priority') {
            const tickets = await HelpRequest.find(query)
                .populate("user", "firstName lastName email userName avatarUrl")
                .populate("respondedBy", "firstName lastName userName")
                .lean();

            const sortedTickets = tickets
                .map(ticket => ({...ticket, priorityScore: getPriorityScore(ticket.priorityLevel) }))
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .slice(skip, skip + lim)
                .map(formatTicketForDisplay);
            
            const total = await HelpRequest.countDocuments(query);
            return responseHandler.ok(res, {
                items: sortedTickets,
                total,
                page: Number(page),
                limit: lim,
            });
        }

        const sortOptions = {};
        sortOptions[sortBy] = -1; // Descending order

        const [items, total] = await Promise.all([HelpRequest.find(query)
            .populate("user", "firstName lastName email userName avatarUrl")
            .populate("respondedBy", "firstName lastName userName")
            .sort(sortOptions)
            .skip(skip)
            .limit(lim)
            .lean(),
            HelpRequest.countDocuments(query)
        ]);

        const formattedItems = items.map(formatTicketForDisplay);

        return responseHandler.ok(res, {
            items: formattedItems,
            total,
            page: Number(page),
            limit: lim,
        });
    } catch (error) {
        console.error("Error fetching help requests:", error);
        return responseHandler.internalServerError(res, 
            "An error occurred while fetching help requests.");
    }
};

export const getMyHelpResquests = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return responseHandler.unauthorized(res, 
                "Please log in to view your help requests.");
        }

        const {page = 1, limit = 20} = req.query;
        const lim = Math.min(Math.max(Number(limit) || 10, 1), 50);
        const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;

        const [items, total] = await Promise.all([
            HelpRequest.find({user:userId})
                .populate("respondedBy", "firstName lastName userName")
                .sort({createdAt: -1})
                .skip(skip)
                .limit(lim)
                .lean(),
            HelpRequest.countDocuments({user:userId})
        ]);

        const formattedItems = items.map(formatTicketForDisplay);

        return responseHandler.ok(res, {
            items:formattedItems,
            total, 
            page: Number(page),
            limit: lim,
        });
    } catch (error) {
        console.error("getMyHelpRequests error: ", error);
        return responseHandler.error(res, 
            "Failed to fetch your help requests."
        );
    }
};

export const getHelpRequestById = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user?.id || req.user?._id;
        const isAdmin = req.user?.role === 'admin';

        if (!id) {
            return responseHandler.badRequest(res, "Ticket ID is required.");
        }
        
        const helpRequest = await HelpRequest.findById(id)
            .populate("user", "firstName lastName email userName avatarUrl")
            .populate("respondedBy", "firstName lastName userName")
            .lean();

        if (!helpRequest) {
            return responseHandler.notFound(res, "Help request not found.");
        }

        if (!canUserViewTicket(helpRequest, userId, isAdmin)) {
            return responseHandler.forbidden(res, 
                "You do not have permission to view this ticket.");
        }

        const formattedTicket = formatTicketForDisplay(helpRequest);

        return responseHandler.ok(res, formattedTicket);
    } catch (error) {
        console.error("Error fetching help request by ID:", error);
        return responseHandler.internalServerError(res, 
            "An error occurred while fetching the help request.");
    }
};

export const updateHelpRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const {status, adminResponse} = req.body;
        const userId = req.user?.id || req.user?._id;
        const isAdmin = req.user?.role === 'admin';

        if (!id) {
            return responseHandler.badRequest(res, "Ticket ID is required.");
        }

        const helpRequest = await HelpRequest.findById(id);
        if (!helpRequest) {
            return responseHandler.notFound(res, "Help request not found.");
        }

        if (!canUserUpdateTicket(helpRequest, userId, isAdmin)) {
            return responseHandler.forbidden(res, 
                "You do not have permission to update this ticket.");
        }

        if (status) {
            const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
            if (!validStatuses.includes(status)) {
                return responseHandler.badRequest(res, "Invalid status value.");
            }
            helpRequest.status = status;
        }

        if (adminResponse !== undefined && isAdmin) {
            helpRequest.adminResponse = sanitizeHtml(adminResponse.trim(), {
                allowedTags: ['p', 'br', 'strong', 'em'], allowedAttributes: {}
            });
            helpRequest.respondedBy = userId;
            helpRequest.respondedAt = new Date();
        }

        await helpRequest.save();

        const updatedTicket = await HelpRequest.findById(id)
            .populate("user", "firstName lastName email")
            .populate("respondedBy", "firstName lastName userName")
            .lean();
        
        const formattedTicket = formatTicketForDisplay(updatedTicket);

        return responseHandler.ok(res, {
            sucess: true,
            data: formattedTicket,
            message: "Help request updated successfully."
        });
    } catch (error) {
        console.error("Error updating help request:", error);
        return responseHandler.internalServerError(res, 
            "An error occurred while updating the help request.");
    }  
}; 

export const getHelpRequestByTicket = async (req, res) => {
    try {
        const {ticketNumber} = req.params;
        const {email} = req.query;

        if (!ticketNumber || !email) {
            return responseHandler.badRequest(res, "Ticket number and email are required.");
        }

        const helpRequest = await HelpRequest.findOne({
            ticketNumber,
            $or: [
                {guestEmail: email.trim().toLowerCase()},
                {user: { $ne: null }}
            ]
        })
        .populate("user", "email firstName lastName")
        .select('-userAgent -ipAddress')
        .lean();

        if (!helpRequest) {
            return responseHandler.notFound(res, "Help request not found.");
        }

        if (helpRequest.user && helpRequest.user.email !== email.toLowerCase().trim()) {
            return responseHandler.notFound(res, 
                "Help request not found or email doesn't match.");
        }

        const formattedTicket = formatTicketForDisplay(helpRequest);

        return responseHandler.ok(res. formattedTicket);
    } catch (error) {
        console.error("Error fetching help request by ticket number:", error);
        return responseHandler.internalServerError(res, 
            "An error occurred while fetching the help request.");
    }
};