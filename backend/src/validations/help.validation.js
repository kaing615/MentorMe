import Joi from 'joi';
import sanitize from 'sanitize-html';
import sanitizeHtml from "sanitize-html";

export const helpRequestSchema = Joi.object({
    subject: Joi.string().min(5).max(100).required().messages({
        'string.min': 'Subject should have at least 5 characters.',
        'string.max': 'Subject should not exceed 100 characters.',
        'any.required': 'Subject is required.'
    }),

    issueDetails: Joi.string().min(10).max(1000).required().messages({
        'string.min': 'Issue details should have at least 10 characters.',
        'string.max': 'Issue details should not exceed 1000 characters.',
        'any.required': 'Issue details are required.'
    }),

    issueCategory: Joi.string()
        .valid(
            "Account Issues", "Booking Problems", "Payment Issues",
            "Technical Support", "Course Related", "Mentor Issues", 
            "General Inquiry", "Bug Report", "Feature Request", "Other"
        )
        .default("General Inquiry"),
    
    priorityLevel: Joi.string()
        .valid("Low", "Medium", "High", "Urgent")
        .default("Medium"),

    guestName: Joi.string().min(2).max(100).when('$hasUser', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),

    guestEmail: Joi.string().email().when('$hasUser', {
        is: false,
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
});

export const validateHelpRequest = (data, hasUser = false) => {
    const {error, value} = helpRequestSchema.validate(data, {
        context: {hasUser},
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        const errors = error.details.map(detail => detail.message);
        return {isValid: false, errors, data: null};
    }

    return {isValid: true, errors: [], data: value};
};

export const sanitizeHelpInput = (data) => ({
    subject: sanitizeHtml(data.subject?.trim() || "", {
        allowedTags: [], allowedAttributes: {}
    }),
    issueDetails: sanitizeHtml(data.issueDetails?.trim() || "", {
        allowedTags: ['p', 'br', 'strong', 'em'], allowedAttributes: {}
    }),
    issueCategory: data.issueCategory || "General Inquiry",
    priorityLevel: data.priorityLevel || "Medium",
    guestName: data.guestName ? sanitizeHtml(data.guestName.trim(), {
        allowedTags: [], allowedAttributes: {}
    }) : undefined,
    guestEmail: data.guestEmail ? sanitizeHtml(data.guestEmail.trim().toLowerCase(), {
        allowedTags: [], allowedAttributes: {}
    }) : undefined,
});

export const validateBusinessRules = (data, user) => {
    const errors = [];
    
    if(!user && (!data.guestName || !data.guestEmail)) {
        errors.push("Guest users must provide name and email.");
    }

    if (isSpamContent(data.subject, data.issueDetails)) {
        errors.push("Content appears to be spam or inappropriate.");
    }

    // Check for duplicate submissions (if needed)
    // const isDuplicate = await checkDuplicateSubmission(data, user);

    return errors;
}

const isSpamContent = (subject, details) => {
    const spamPatterns = [
        /^(hi|hello|help|fix|error)$/i,
        /^.{1,3}$/,  // Too short
        /^\W+$/      // Only special characters
    ];

    return spamPatterns.some(pattern => 
        pattern.test(subject) || pattern.test(details)
    );
};


export const canUserViewTicket = (ticket, userId, isAdmin) => {
    if (isAdmin) return true;
    if (ticket.user && String(ticket.user) === String(userId)) return true;
    return false;
};

export const canUserUpdateTicket = (ticket, userId, isAdmin) => {
    if (isAdmin) return true;
    if (ticket.user && String(ticket.user) === String(userId) && ticket.status === "Open") return true;
    return false;
};
 