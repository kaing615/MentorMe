import Joi from 'joi';
import sanitizeHtml from "sanitize-html";

export const helpRequestSchema = Joi.object({
    subject: Joi.string().min(5).max(200).required().messages({
        'string.min': 'Subject should have at least 5 characters.',
        'string.max': 'Subject should not exceed 200 characters.',
        'any.required': 'Subject is required.'
    }),

    issueDetails: Joi.string().min(10).max(2000).required().messages({
        'string.min': 'Issue details should have at least 10 characters.',
        'string.max': 'Issue details should not exceed 2000 characters.',
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
    if (!subject || !details) return false;

    const spamPatterns = [
        /^(hi|hello|help|fix|error|test)$/i,      // Single word subjects
        /^.{1,3}$/,                               // Too short
        /^\W+$/,                                  // Only special characters
        /(.)\1{10,}/,                             // Repeated characters (aaaaaaaaaa)
        /(http|www\.)/i,                          // URLs
        /\b(free|money|win|prize|click here)\b/i, // Spam keywords
        /^(urgent|asap|immediately)\s*$/i,        // Fake urgency
    ];

    // Check patterns
    const originalText = `${subject} ${details}`;
    const combinedText = originalText.toLowerCase();
    if (spamPatterns.some(pattern => pattern.test(combinedText))) {
        return true;
    }

    const capitalRatio = (originalText.match(/[A-Z]/g) || []).length / originalText.length;
    if (capitalRatio > 0.5 && combinedText.length > 10) {
        return true;
    }

    const punctuationRatio = (combinedText.match(/[!?.,;:]/g) || []).length / combinedText.length;
    if (punctuationRatio > 0.3) {
        return true;
    }

    return false;
};


export const canUserViewTicket = (ticket, userId, isAdmin) => {
    if (!ticket) return false;
    if (isAdmin) return true;
    if (ticket.user && String(ticket.user) === String(userId)) return true;
    return false;
};

export const canUserUpdateTicket = (ticket, userId, isAdmin) => {
    if (!ticket) return false;
    if (isAdmin) return true;
    if (ticket.user && String(ticket.user) === String(userId) && ticket.status === "Open") return true;
    return false;
};
 