import mongoose from "mongoose";

const HelpRequestSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    
    guestEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    guestName: {
        type: String,
        trim: true,
        maxLength: 100
    },
    
    subject: {
        type: String,
        required: true,
        trim: true,
        maxLength: 200
    },
    
    issueCategory: {
        type: String,
        required: true,
        enum: [
            "Account Issues", "Booking Problems", "Payment Issues",
            "Technical Support", "Course Related", "Mentor Issues",
            "General Inquiry", "Bug Report", "Feature Request", "Other"
        ],
        default: "General Inquiry"
    },
    
    priorityLevel: {
        type: String,
        required: true,
        enum: ["Low", "Medium", "High", "Urgent"],
        default: "Medium"
    },
    
    issueDetails: {
        type: String,
        required: true,
        trim: true,
        maxLength: 2000
    },
    
    status: {
        type: String,
        enum: {
            values: ["Open", "In Progress", "Resolved", "Closed"],
            message: "{VALUE} is not a valid status"
        },
        default: "Open",
        index: true

    },
    
    adminResponse: String,
    respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    respondedAt: Date,
    
    userAgent: String,
    ipAddress: String,
    ticketNumber: {
        type: String,
        unique: true,
        index: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


HelpRequestSchema.pre("save", function(next) {
    if (!this.ticketNumber && this.isNew) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.ticketNumber = `TICKET-${timestamp}-${randomStr}`;
    }

    if (!this.user && (!this.guestEmail || !this.guestName)) {
        return next(new Error('Either user reference or guest information is required'));
    }

    next();
});


HelpRequestSchema.virtual("contactEmail").get(function() {
    if (this.user && this.populated('user')) {
        return this.user.email;
    }
    return this.guestEmail;
});

HelpRequestSchema.virtual("contactName").get(function() {
    if (this.user && this.populated('user')) {
        return `${this.user.firstName} ${this.user.lastName}`;
    }
    return this.guestName;
});

HelpRequestSchema.virtual("isRegisteredUser").get(function() {
    return Boolean(this.user);
});


HelpRequestSchema.index({ user: 1, createdAt: -1 });
HelpRequestSchema.index({ guestEmail: 1, createdAt: -1 });
HelpRequestSchema.index({ status: 1, priorityLevel: 1 });
HelpRequestSchema.index({ issueCategory: 1, status: 1 });
HelpRequestSchema.index({ createdAt: -1 });
HelpRequestSchema.index({ respondedBy: 1, respondedAt: -1 });

export default mongoose.model("HelpRequest", HelpRequestSchema);