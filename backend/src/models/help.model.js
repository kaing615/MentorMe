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
        enum: ["Open", "In Progress", "Resolved", "Closed"],
        default: "Open"
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
        unique: true
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
    next();
});


HelpRequestSchema.virtual("contactEmail").get(function() {
    return this.user?.email || this.guestEmail;
});

HelpRequestSchema.virtual("contactName").get(function() {
    return this.user ? `${this.user.firstName} ${this.user.lastName}` : this.guestName;
});

HelpRequestSchema.virtual("isRegisteredUser").get(function() {
    return Boolean(this.user);
});


HelpRequestSchema.index({ user: 1, createdAt: -1 });
HelpRequestSchema.index({ guestEmail: 1, createdAt: -1 });
HelpRequestSchema.index({ status: 1, priorityLevel: 1 });
HelpRequestSchema.index({ ticketNumber: 1 }, { unique: true });

export default mongoose.model("HelpRequest", HelpRequestSchema);