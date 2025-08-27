import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import Relationship from "../models/relationship.model.js";
import responseHandler from "../handlers/response.handler.js";

// [POST] /api/bookings
export const createBooking = async (req, res) => {
  try {
    const { mentor, mentee, date, start, end, notes } = req.body;
    if (!mentor || !mentee || !date || !start || !end) {
      return responseHandler.badRequest(res, "Missing required fields");
    }
    // Optionally: check if mentor/mentee exist
    const mentorUser = await User.findById(mentor);
    const menteeUser = await User.findById(mentee);
    if (!mentorUser || !menteeUser) {
      return responseHandler.notFound(res, "Mentor or mentee not found");
    }
    // Optionally: check relationship
    let relationship = await Relationship.findOne({ mentor, mentee });
    if (!relationship) {
      relationship = await Relationship.create({ mentor, mentee });
    }
    // Prevent double booking (same mentor, mentee, date, start)
    const exists = await Booking.findOne({ mentor, mentee, date, start });
    if (exists) {
      return responseHandler.badRequest(res, "This slot is already booked");
    }
    const booking = await Booking.create({ relationship: relationship._id, mentor, mentee, date, start, end, notes });
    return responseHandler.created(res, booking);
  } catch (err) {
    console.error("Error creating booking:", err);
    responseHandler.error(res);
  }
};

// [GET] /api/bookings?mentor=...&mentee=...&date=...
export const getBookings = async (req, res) => {
  try {
    const { mentor, mentee, date } = req.query;
    const query = {};
    if (mentor) query.mentor = mentor;
    if (mentee) query.mentee = mentee;
    if (date) query.date = date;
    const bookings = await Booking.find(query).populate("mentor mentee");
    return responseHandler.ok(res, bookings);
  } catch (err) {
    responseHandler.error(res);
  }
};

// [PATCH] /api/bookings/:id (update status, notes, ...)
export const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const booking = await Booking.findByIdAndUpdate(id, update, { new: true });
    if (!booking) return responseHandler.notFound(res, "Booking not found");
    return responseHandler.ok(res, booking);
  } catch (err) {
    responseHandler.error(res);
  }
};

// [DELETE] /api/bookings/:id
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return responseHandler.notFound(res, "Booking not found");
    return responseHandler.ok(res, { message: "Booking deleted" });
  } catch (err) {
    responseHandler.error(res);
  }
};

export default {
  createBooking,
  getBookings,
  updateBooking,
  deleteBooking,
};
