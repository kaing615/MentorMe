import mongoose from "mongoose";
import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import Course from "../models/course.model.js";
import sanitizeHtml from "sanitize-html";
import responseHandler from "../handlers/response.handler.js";

const canCreateReview = async (userId, item) => {
    if (item.targetType === 'Booking') {
        const b = await Booking.findById(item.target).select("mentor mentee status").lean();
        if (!b) return false;
        if (b.status !== "finished") return false;
        return String(b.mentee) === String(userId) || 
        String(b.mentor) === String(userId);
    } 
    if (item.targetType === 'Mentor') {
        const exist = await Booking.exists({ 
            mentor: item.target,
            mentee: userId,
            status: "finished"
        });
        return Boolean(exist);
    }
    if (item.targetType === "Course") {
        const course = await Course.findById(item.target).select("mentees mentor").lean();
        if (!course) return false;
        
        if (String(course.mentor) === String(userId)) return true;

        const isEnrolledMentee = course.mentees.some(menteeId => String(menteeId) === String(userId));
        return isEnrolledMentee;
    }
    return false;
};

const checkDuplicateReview = async (authorId, targetType, targetId) => {
    const existing = await Review.exists({
        author: authorId,
        targetType: targetType,
        target: targetId
    });
    return Boolean(existing);
};

const validateItem = (item) => {
    if (!item || !item.target || !item.targetType) {
        throw new Error("Missing required fields");
    }
    
    const VALID_TYPES = ["Course", "Mentor", "Booking"];
    if (!VALID_TYPES.includes(String(item.targetType))) {
        throw new Error("Invalid target type");
    }

    if (!mongoose.Types.ObjectId.isValid(String(item.target))) {
        throw new Error("Invalid target id");
    }

    if (item.rate == null || 
        !Number.isInteger(Number(item.rate)) || 
        Number(item.rate) < 1 || 
        Number(item.rate) > 5) {
        throw new Error("Rate must be integer between 1-5");
    }
};

const makeDoc = (item, authorId, now) => ({
    author: authorId,
    targetType: item.targetType,
    target: String(item.target),
    content: sanitizeHtml((item.content || "").toString().trim(), { allowedTags: [], allowedAttributes: {} }),
    rate: Number(item.rate),
    createdAt: now,
    updatedAt: now,
});

const canViewReviews = async (userId, targetType, targetId) => {
    // if (!userId) return false;
    // if (targetType === "Course") {
    //     return true;
    // }
    // if (targetType === "Booking") {
    //     const b = await Booking.findById(targetId).select("mentor mentee").lean();
    //     if (!b) return false;
    //     return String(b.mentee) === String(userId) || String(b.mentor) === String(userId);
    // }
    // if (targetType === "Mentor") {
    //     if (String(targetId) === String(userId)) return true;
    //     const had = await Booking.exists({ mentor: targetId, mentee: userId });
    //     return Boolean(had);
    // }
    return true;
};

export const createReview = async (req, res) => {
    try {
        const authorId = String(req.user?.id || req.user?._id || "");
        if (!authorId)
        return (
            responseHandler.unauthorized?.(res) ||
            responseHandler.badRequest(res, "Unauthorized")
        );

        const payload = req.body;
        const now = new Date();
        const MAX_BATCH = 20;
        const isAdmin = Boolean(req.user?.isAdmin || req.user?.role === "admin");

        let created;
        if (Array.isArray(payload)) {
            if (payload.length === 0) return responseHandler.badRequest(res, "Empty payload");
            if (payload.length > MAX_BATCH)
                return responseHandler.badRequest(res, `Batch size too large (max ${MAX_BATCH})`);
            for (const it of payload) validateItem(it);
            for (const it of payload) {
                if (!isAdmin && !(await canCreateReview(authorId, it))) {
                    return responseHandler.forbidden(res, "Not allowed to review this target");
                }
            }

            for (const it of payload) {
                const isDuplicate = await checkDuplicateReview(authorId, it.targetType, it.target);
                if (isDuplicate) {
                    return responseHandler.badRequest(res, `Duplicate review for targetType ${it.targetType} and target ${it.target}`);
                }
            }

            const docs = payload.map((it) => makeDoc(it, authorId, now));
            created = await Review.insertMany(docs);
            const out = created.map((d) => ({...d.toObject(),
                content: sanitizeHtml(d.content || "",
                { allowedTags: [], allowedAttributes: {} }) }));
            return responseHandler.created?.(res) ||
            res.status(201).json({ success: true, data: out });
        }

        try {
            validateItem(payload);
        } catch (e) {
            return responseHandler.badRequest(res, e.message);
        }
        if (!isAdmin && !(await canCreateReview(authorId, payload))) {
            return responseHandler.forbidden(res, "Not allowed to review this target");
        }
        
        const isDuplicate = await checkDuplicateReview(authorId, payload.targetType, payload.target);
        if (isDuplicate) {
            return responseHandler.badRequest(res, `You have already reviewed this ${payload.targetType.toLowerCase()}`);
        }

        const doc = makeDoc(payload, authorId, now);
        created = await Review.create(doc);
        const out = {
            ...created.toObject(),
            content: sanitizeHtml(created.content || "",
            { allowedTags: [], allowedAttributes: {} })
        };
        return responseHandler.created?.(res) || res.status(201).json({ success: true, data: out });
    } catch (err) {
        if (err.code === 11000) {
            return responseHandler.badRequest(res, "You have already reviewed this item");
        }
        console.error("createReview error:", err);
        return responseHandler.error(res, err);
    }
};

export const getReviews = async (req, res) => {
    try {
        const {targetType, target, limit = 20, page = 1, from, to} = req.query;
        if (!targetType || !target) 
            return responseHandler.badRequest(res, "targetType and target are required");

        if (!["Course", "Mentor", "Booking"].includes(targetType)) {
            return responseHandler.badRequest(res, "Invalid targetType");
        }

        if (!mongoose.Types.ObjectId.isValid(String(target))) {
            return responseHandler.badRequest(res, "Invalid target ID");
        }
        const q = {
        targetType,
        target: target,
        };

        if (from || to) {
            const range = {};
            if (from) {
                const f = new Date(from);
                if (isNaN(f)) {
                    return responseHandler.badRequest(res, "Invalid 'from' date");
                }
                range.$gte = f;
            }
            if (to) {
                const t = new Date(to);
                if (isNaN(t)) {
                    return responseHandler.badRequest(res, "Invalid 'to' date");
                }
                range.$lte = t;
            }
            if (Object.keys(range).length) q.createdAt = range;
        }

        const MAX_LIMIT = 50;
        const lim = Math.min(Math.max(Number(limit) || 20, 1), MAX_LIMIT);
        const skip = (Math.max(Number(page) || 1, 1) - 1) * lim;
        
        // const userId = String(req.user?.id || req.user?._id || "");
        // const isAdmin = Boolean(req.user?.isAdmin || req.user?.role === "admin");
        // if (!isAdmin) {
        //     const allowed = await canViewReviews(userId, targetType, String(target));
        //     if (!allowed) {
        //         return responseHandler.forbidden?.(res) || 
        //         responseHandler.unauthorized(res);
        //     }
        // }

        const [items, total] = await Promise.all([
        Review.find(q)
            .populate({
            path: "author",
            select: "firstName lastName avatarUrl",
            options: { lean: true }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(lim)
            .lean(),
        Review.countDocuments(q),
        ]);

        const safeItems = items.map((it) => ({
            ...it,
            content: sanitizeHtml(it.content || "", {
                allowedTags: [],
                allowedAttributes: {},
            }),
        }));

        return responseHandler.ok(res, { items: safeItems, total, page: Number(page) || 1, limit: lim });
    } catch (err) {
        console.error("getReviews error:", err);
        return responseHandler.error(res, err);
    }
};

export const updateReview = async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || "");
    if (!userId)
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id)))
      return responseHandler.badRequest?.(res, "Invalid review id") || res.status(400).json({ success: false, message: "Invalid review id" });

    const payload = req.body || {};
    
    if (payload.rate !== undefined) {
      const r = Number(payload.rate);
      if (!Number.isInteger(r) || r < 1 || r > 5)
        return responseHandler.badRequest?.(res, "Invalid rate (1-5)") || res.status(400).json({ success: false, message: "Invalid rate (1-5)" });
    }

    const review = await Review.findById(id);
    if (!review)
      return responseHandler.notFound?.(res) || res.status(404).json({ success: false, message: "Review not found" });

    const isAdmin = Boolean(req.user?.isAdmin || req.user?.role === "admin");
    if (!isAdmin && String(review.author) !== String(userId))
      return responseHandler.forbidden?.(res) || res.status(403).json({ success: false, message: "Not allowed" });

    if (payload.content !== undefined) {
      review.content = sanitizeHtml(String(payload.content || "").trim(), { allowedTags: [], allowedAttributes: {} });
    }
    if (payload.rate !== undefined) review.rate = Number(payload.rate);
    review.updatedAt = new Date();

    await review.save();

    const out = {
      ...review.toObject(),
      content: sanitizeHtml(review.content || "", { allowedTags: [], allowedAttributes: {} }),
    };
    return responseHandler.ok?.(res, out) || res.status(200).json({ success: true, data: out });
  } catch (err) {
    console.error("updateReview error:", err);
    return responseHandler.error(res, err);
  }
};

export const deleteReview = async (req, res) => {
  try {
    const userId = String(req.user?.id || req.user?._id || "");
    if (!userId)
      return (
        responseHandler.unauthorized?.(res) ||
        responseHandler.badRequest(res, "Unauthorized")
      );

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(id)))
      return responseHandler.badRequest?.(res, "Invalid review id") || res.status(400).json({ success: false, message: "Invalid review id" });

    const review = await Review.findById(id);
    if (!review)
      return responseHandler.notFound?.(res) || res.status(404).json({ success: false, message: "Review not found" });

    const isAdmin = Boolean(req.user?.isAdmin || req.user?.role === "admin");
    if (!isAdmin && String(review.author) !== String(userId))
      return responseHandler.forbidden?.(res) || res.status(403).json({ success: false, message: "Not allowed" });

    await Review.findByIdAndDelete(id);
    return responseHandler.ok?.(res, { success: true, id }) || res.status(200).json({ success: true, id });
  } catch (err) {
    console.error("deleteReview error:", err);
    return responseHandler.error(res, err);
  }
};