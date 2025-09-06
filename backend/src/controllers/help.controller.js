import mongoose from "mongoose";
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
    if (!date) return "Unknown";
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day(s) ago`;
    if (hours > 0) return `${hours} hour(s) ago`;
    return "Just now";
};

const getPriorityScore = (priorityLevel) => {
    const priorities = {"Low": 1, "Medium": 2, "High": 3, "Urgent": 4};
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


const formatTicketForDisplay = (ticket) => {
    if (!ticket) return null;
    const ticketObj = ticket.toObject ? ticket.toObject() : ticket;
    return {
        ...ticketObj,
        responseTime: calculateResponseTime(ticketObj.createdAt, ticketObj.respondedAt),
        timeAgo: getTimeAgo(ticketObj.createdAt),
        priorityScore: getPriorityScore(ticketObj.priorityLevel),
        statusColor: getStatusColor(ticketObj.status),
        ticketInfo: {
            number: ticketObj.ticketNumber,
            subject: ticketObj.subject,
            status: ticketObj.status,
            priority: ticketObj.priorityLevel,
            timeAgo: getTimeAgo(ticketObj.createdAt)
        }
    };
};

const isUserAdmin = (user) => {
    return Boolean(
        user?.role === 'admin' ||
        user?.isAdmin === true ||
        user?.permissions?.includes('admin')
    );
};

const isValidObjectId = (id) => {
    return id && mongoose.Types.ObjectId.isValid(id);
};

const normalizeEmail = (email) => {
    return email?.toLowerCase()?.trim();
};

export const createHelpRequest = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const hasUser = Boolean(userId);

        const {isValid, errors, data} = validateHelpRequest(req.body, hasUser);
        if (!isValid) {
            return responseHandler.badRequest(res, errors.join(", "));
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

        const helpRequestInstance = await HelpRequest.create(helpRequestData);

        return responseHandler.created(res, {
            success: true,
            data: {
                ticketNumber: helpRequestInstance.ticketNumber,
                status: helpRequestInstance.status,
                message: `Help request submitted successfully! Ticket #${helpRequestInstance.ticketNumber}`
            }
        });
    } catch (error) {
        console.error("Error creating help request:", error);

        if (error.code === 11000) {
            return responseHandler.badRequest(res, "Duplicate ticket number. Please try again.");
        }
        return responseHandler.error(res, 
            "An error occurred while submitting your help request. Please try again later.");
    }
};

export const getHelpRequests = async (req, res) => {
    try {
        const isAdmin = isUserAdmin(req.user);
        if (!isAdmin) {
            return responseHandler.forbidden(res, "Access denied.");
        }

        const {status, priorityLevel, issueCategory, page = 1, limit = 20, search, sortBy = 'createdAt'} = req.query;

        //Build query object
        const query = {};

        const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
        const validPriorities = ["Low", "Medium", "High", "Urgent"];
        const validCategories = [
            "Account Issues", "Booking Problems", "Payment Issues",
            "Technical Support", "Course Related", "Mentor Issues",
            "General Inquiry", "Bug Report", "Feature Request", "Other"
        ];
        
        if (status && validStatuses.includes(status)) query.status = status;
        if (priorityLevel && validPriorities.includes(priorityLevel)) query.priorityLevel = priorityLevel;
        if (issueCategory && validCategories.includes(issueCategory)) query.issueCategory = issueCategory;
        
        if (search && search.trim()) {
            const searchTerm = search.trim();
            query.$or = [
                {subject: {$regex: searchTerm, $options: 'i'}},
                {guestName: {$regex: searchTerm, $options: 'i'}},
                {guestEmail: {$regex: searchTerm, $options: 'i'}},
                {ticketNumber: {$regex: searchTerm, $options: 'i'}}
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

        const validSortFields = ['createdAt', 'updatedAt', 'status', 'priorityLevel', 'subject'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const sortOptions = {};
        sortOptions[sortField] = -1;

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
        return responseHandler.error(res, 
            "An error occurred while fetching help requests.");
    }
};

export const getMyHelpRequests = async (req, res) => {
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
        const isAdmin = isUserAdmin(req.user);

        if (!isValidObjectId(id)) {
            return responseHandler.badRequest(res, "Invalid ticket ID format.");
        }
        
        const helpRequestInstance = await HelpRequest.findById(id)
            .populate("user", "firstName lastName email userName avatarUrl")
            .populate("respondedBy", "firstName lastName userName")
            .lean();

        if (!helpRequestInstance) {
            return responseHandler.notFound(res, "Help request not found.");
        }

        if (!canUserViewTicket(helpRequestInstance, userId, isAdmin)) {
            return responseHandler.forbidden(res, 
                "You do not have permission to view this ticket.");
        }

        const formattedTicket = formatTicketForDisplay(helpRequestInstance);

        return responseHandler.ok(res, formattedTicket);
    } catch (error) {
        console.error("Error fetching help request by ID:", error);
        return responseHandler.error(res, 
            "An error occurred while fetching the help request.");
    }
};

export const updateHelpRequest = async (req, res) => {
    try {
        const {id} = req.params;
        const {status, adminResponse} = req.body;
        const userId = req.user?.id || req.user?._id;
        const isAdmin = isUserAdmin(req.user);

        if (!isValidObjectId(id)) {
            return responseHandler.badRequest(res, "Invalid ticket ID format.");
        }

        const helpRequestInstance = await HelpRequest.findById(id);
        if (!helpRequestInstance) {
            return responseHandler.notFound(res, "Help request not found.");
        }

        if (!canUserUpdateTicket(helpRequestInstance, userId, isAdmin)) {
            return responseHandler.forbidden(res, 
                "You do not have permission to update this ticket.");
        }

        if (status) {
            const validStatuses = ["Open", "In Progress", "Resolved", "Closed"];
            if (!validStatuses.includes(status)) {
                return responseHandler.badRequest(res, "Invalid status value.");
            }
            helpRequestInstance.status = status;
        }

        if (adminResponse !== undefined && isAdmin) {
            if (typeof adminResponse !== 'string') {
                return responseHandler.badRequest(res, 
                    "Admin response must be a string.");
            }

            helpRequestInstance.adminResponse = sanitizeHtml(adminResponse.trim(), {
                allowedTags: ['p', 'br', 'strong', 'em'], allowedAttributes: {}
            });
            helpRequestInstance.respondedBy = userId;
            helpRequestInstance.respondedAt = new Date();
        }

        await helpRequestInstance.save();

        const updatedTicket = await HelpRequest.findById(id)
            .populate("user", "firstName lastName email")
            .populate("respondedBy", "firstName lastName userName")
            .lean();
        
        const formattedTicket = formatTicketForDisplay(updatedTicket);

        return responseHandler.ok(res, {
            success: true,
            data: formattedTicket,
            message: "Help request updated successfully."
        });
    } catch (error) {
        console.error("Error updating help request:", error);
        return responseHandler.error(res, 
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

        const normalizedEmail = normalizeEmail(email);
        if (!normalizedEmail) {
            return responseHandler.badRequest(res, "Invalid email format.");
        }

        const helpRequestInstance = await HelpRequest.findOne({
            ticketNumber: ticketNumber.toUpperCase(),
            $or: [
                {guestEmail: normalizedEmail},
                {user: { $ne: null }}
            ]
        })
        .populate("user", "email firstName lastName")
        .select('-userAgent -ipAddress')
        .lean();

        if (!helpRequestInstance) {
            return responseHandler.notFound(res, "Help request not found.");
        }

        if (helpRequestInstance.user && helpRequestInstance.user.email !== normalizedEmail) {
            return responseHandler.notFound(res, 
                "Help request not found or email doesn't match.");
        }

        const formattedTicket = formatTicketForDisplay(helpRequestInstance);

        return responseHandler.ok(res, formattedTicket);
    } catch (error) {
        console.error("Error fetching help request by ticket number:", error);
        return responseHandler.error(res, 
            "An error occurred while fetching the help request.");
    }
};