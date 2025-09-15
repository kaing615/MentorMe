import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { PATH, MENTOR_PATH } from "../routes/path";
import profileApi from "../api/modules/profile.api";
import availabilityApi from "../api/modules/availability.api";
import bookingApi from "../api/modules/booking.api";
import { FaFacebook } from "react-icons/fa6";
import { FaXTwitter } from "react-icons/fa6";
import { FaLinkedin } from "react-icons/fa";
import { FaGoogle } from "react-icons/fa";
import { AiFillYoutube } from "react-icons/ai";
import courseApi from "../api/modules/course.api";

// Capitalize initials of each word
function capitalizeWords(str) {
  if (!str) return "";
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// --- Schedule Builder Helpers ---------------------------------------------------------------
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}
function toHHMM(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function generateTimes(startHH = 8, endHH = 22, stepMin = 30) {
  const out = [];
  let t = startHH * 60;
  const end = endHH * 60;
  while (t < end) {
    out.push(toHHMM(t));
    t += stepMin;
  }
  return out;
}
function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
function isPast(dateStr) {
  const today = new Date(todayKey() + "T00:00:00");
  const d = new Date(dateStr + "T00:00:00");
  return d < today;
}
function isInCurrentYear(dateStr) {
  const y = new Date().getFullYear();
  const d = new Date(dateStr + "T00:00:00");
  return d.getFullYear() === y;
}
function formatHuman(dateStr) {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// Helper function to check if time is in the past for today
function isTimeInPast(timeStr, dateStr) {
  const today = todayKey();
  if (dateStr !== today) return false; // Not today, so time is not in past

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const timeMinutes = toMinutes(timeStr);

  return timeMinutes <= currentMinutes;
}

// Helper function to filter out past times for today
function getAvailableTimes(dateStr) {
  const allTimes = generateTimes(8, 22, 30);
  const today = todayKey();

  if (dateStr !== today) return allTimes; // Not today, return all times

  // For today, filter out past times
  return allTimes.filter((time) => !isTimeInPast(time, dateStr));
}

// --- Schedule Builder Component ---------------------------------------------------------------
function MentorAvailabilityBuilder({ onBack, onSave, editingSchedule }) {
  const [mode, setMode] = useState("builder"); // 'builder' | 'review'
  const [selectedDate, setSelectedDate] = useState("");
  const [error, setError] = useState("");
  const [pickedForDay, setPickedForDay] = useState(new Set()); // working selection
  const [availability, setAvailability] = useState({}); // committed while editing
  const [savedSnapshot, setSavedSnapshot] = useState(null); // what we "persisted"
  const [bookedSlots, setBookedSlots] = useState({}); // Track booked slots by date

  // Load editing data when component mounts or editingSchedule changes
  useEffect(() => {
    if (editingSchedule) {
      setAvailability(editingSchedule.availability || {});

      // Extract booked slots info if editing
      if (editingSchedule.slots) {
        const booked = {};
        const dateKey = editingSchedule.date;
        booked[dateKey] = editingSchedule.slots
          .filter((slot) => slot.status === "booked")
          .map((slot) => ({
            time: slot.start,
            bookingId: slot.bookingId,
            bookedBy: slot.bookedBy,
          }));
        setBookedSlots(booked);
      }
    } else {
      setAvailability({});
      setBookedSlots({});
    }
  }, [editingSchedule]);

  const times = useMemo(() => getAvailableTimes(selectedDate), [selectedDate]);

  function validateDate(dateStr) {
    if (!dateStr) return "Please choose a date.";
    if (isPast(dateStr))
      return "Selected date is in the past. Please choose today or a future date.";
    if (!isInCurrentYear(dateStr))
      return "Only dates within the current year are allowed.";
    return "";
  }

  function onDateChange(v) {
    setSelectedDate(v);
    setError(validateDate(v));
    const saved = availability[v] || [];
    // Filter out past times if it's today
    const validSavedTimes = saved.filter((time) => !isTimeInPast(time, v));

    // Auto-include booked slots for this date (they cannot be unselected)
    const bookedTimes = bookedSlots[v]?.map((slot) => slot.time) || [];
    const allSelectedTimes = [...new Set([...validSavedTimes, ...bookedTimes])];

    setPickedForDay(new Set(allSelectedTimes));
  }

  function toggleTime(t) {
    // Check if this time slot is booked (cannot be toggled off)
    const isBooked = bookedSlots[selectedDate]?.find((slot) => slot.time === t);
    if (isBooked) {
      return; // Do nothing for booked slots
    }

    const next = new Set(pickedForDay);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setPickedForDay(next);
  }

  function submitDay() {
    const e = validateDate(selectedDate);
    if (e) {
      setError(e);
      return;
    }
    if (pickedForDay.size === 0) {
      setError("Please select at least one time slot before submitting.");
      return;
    }
    setError("");
    const arr = Array.from(pickedForDay).sort(
      (a, b) => toMinutes(a) - toMinutes(b)
    );
    setAvailability((prev) => ({ ...prev, [selectedDate]: arr }));
  }

  function removeDay(dateKey) {
    const copy = { ...availability };
    delete copy[dateKey];
    setAvailability(copy);
    if (dateKey === selectedDate) setPickedForDay(new Set());
  }

  async function saveAll() {
    // Guard: must have at least 1 submitted day before saving
    if (Object.keys(availability).length === 0) {
      alert("Please submit at least one day before saving.");
      return;
    }
    // In a real app, call your API here then navigate to a separate page.
    const payload = {
      slots: availability,
      createdAt: new Date().toISOString(),
    };
    console.log("SAVE ALL", payload);

    if (onSave) {
      onSave(payload);
    } else {
      setSavedSnapshot(payload);
      setMode("review");
    }
  }

  if (mode === "review") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Your Availability</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setMode("builder")}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create schedule
              </button>
              <button
                onClick={() => alert("Publish stub: wire to your API.")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Publish
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saved at</p>
                  <p className="font-medium">
                    {new Date(
                      savedSnapshot?.createdAt || Date.now()
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="text-sm text-gray-600">
                  {Object.keys(savedSnapshot?.slots || {}).length} day(s)
                </div>
              </div>

              {Object.keys(savedSnapshot?.slots || {}).length === 0 ? (
                <p className="text-sm text-gray-600">
                  No availability to show.
                </p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(savedSnapshot.slots)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, list]) => (
                      <div
                        key={dateKey}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="mb-2 font-medium">
                          {formatHuman(dateKey)} ({dateKey})
                        </div>
                        <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
                          {list.map((t) => (
                            <div
                              key={t}
                              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-center"
                            >
                              {t}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Tip: This page is a read-only summary of what you saved. Use{" "}
            <b>Create schedule</b> to add or modify availability, then save
            again.
          </div>
        </div>
      </div>
    );
  }

  // --- Builder view -------------------------------------------------------
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-semibold">
          {editingSchedule
            ? `Edit Schedule ${editingSchedule.name}`
            : "Set Specific-Day Availability"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="bg-gradient-to-br from-white to-blue-50/30 border border-blue-200 rounded-xl shadow-sm">
          <div className="p-6 space-y-6">
            <header className="text-center pb-4 border-b border-blue-100">
              <p className="text-sm text-blue-600">
                {editingSchedule
                  ? "Modify your existing schedule by adding/removing dates and time slots."
                  : "Pick a date, toggle the available times, then submit that day."}
              </p>
              {editingSchedule &&
                Object.values(bookedSlots).some(
                  (slots) => slots.length > 0
                ) && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <span className="text-lg">⚠️</span>
                      <div className="text-sm">
                        <p className="font-semibold">Protected Bookings</p>
                        <p>
                          Red slots with 🔒 have active bookings and cannot be
                          removed. They will be preserved automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </header>

            {/* Date */}
            <section className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                Choose a date (current year only)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm text-gray-900 font-medium"
                />
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {error}
                  </p>
                </div>
              )}
            </section>

            {/* Time grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  Available times for selected date
                </label>
                {selectedDate === todayKey() && (
                  <div className="text-xs text-orange-700 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-200 px-3 py-1.5 rounded-full font-medium">
                    Current:{" "}
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white/70 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-5">
                  {times.map((t) => {
                    const active = pickedForDay.has(t);
                    const isPastTime = isTimeInPast(t, selectedDate);
                    const isBooked = bookedSlots[selectedDate]?.find(
                      (slot) => slot.time === t
                    );

                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTime(t)}
                        disabled={isPastTime || isBooked}
                        title={
                          isBooked
                            ? "This slot has an active booking and cannot be removed"
                            : undefined
                        }
                        className={`rounded-lg border px-3 py-2.5 text-sm text-center transition-all duration-200 font-medium relative ${
                          isPastTime
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                            : isBooked
                            ? "bg-red-100 text-red-800 border-red-300 cursor-not-allowed shadow-sm"
                            : active
                            ? "border-blue-600 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105"
                            : "border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
                        }`}
                      >
                        {t}
                        {isBooked && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">🔒</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-sm text-blue-800 font-medium">
                      {pickedForDay.size === 0
                        ? "No times selected"
                        : `${pickedForDay.size} time(s) selected`}
                    </p>
                    {selectedDate === todayKey() && times.length === 0 && (
                      <span className="ml-2 text-orange-600 text-xs bg-orange-100 px-2 py-0.5 rounded-full font-medium">
                        No more slots today
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPickedForDay(new Set())}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition font-medium text-gray-700"
                    >
                      Clear
                    </button>
                    <button
                      onClick={submitDay}
                      disabled={pickedForDay.size === 0}
                      className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                    >
                      Submit day
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Right: committed list */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <h2 className="text-lg font-semibold text-blue-900">
                  Availability Preview
                </h2>
              </div>
              {Object.keys(availability).length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-blue-300 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-blue-600 text-sm">No days added yet</p>
                  <p className="text-blue-500 text-xs mt-1">
                    Start by selecting a date and time slots
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(availability)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dateKey, times]) => (
                      <div
                        key={dateKey}
                        className="bg-white/70 backdrop-blur-sm border border-blue-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <div className="font-medium text-blue-900 text-sm">
                              {formatHuman(dateKey)}
                            </div>
                            <span className="text-blue-600 text-xs bg-blue-100 px-2 py-0.5 rounded-full">
                              {dateKey}
                            </span>
                          </div>
                          <button
                            onClick={() => removeDay(dateKey)}
                            className="text-red-500 hover:text-red-700 transition text-sm p-1 rounded hover:bg-red-50"
                            title="Remove this day"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-4">
                          {times.map((t) => (
                            <div
                              key={t}
                              className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-800 px-3 py-2.5 text-sm text-center rounded-md font-medium shadow-sm hover:from-blue-100 hover:to-blue-150 transition-colors duration-200 flex items-center justify-center min-w-0"
                            >
                              {t}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="text-blue-600 text-xs">
                            {times.length} slot{times.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="mb-2 font-medium text-blue-900 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Rules enforced
              </h3>
              <ul className="list-disc pl-6 text-sm text-blue-800 space-y-1">
                <li>Cannot select past dates.</li>
                <li>
                  Only dates in the <b>current year</b> are allowed.
                </li>
                <li>
                  For today's date, only <b>future time slots</b> are available.
                </li>
                <li>
                  Must select at least one time slot before submitting a day.
                </li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setAvailability({});
                  setPickedForDay(new Set());
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Reset all
              </button>
              <button
                onClick={saveAll}
                disabled={Object.keys(availability).length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingSchedule ? "Update Schedule" : "Save all"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const MentorProfile = () => {
  // State lưu thông tin profile
  const navigate = useNavigate(); // Hook to navigate between routes
  const location = useLocation();
  // --- AUTH & ROLE CHECK ---
  useEffect(() => {
    // Check token
    const token =
      localStorage.getItem("actkn") || localStorage.getItem("token");
    const userStr =
      localStorage.getItem("user") || localStorage.getItem("user");
    console.log("Token:", token);
    let user = null;
    if (!token) {
      navigate("/auth/signin");
      return;
    }
    // Check user object
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      user = null;
    }
    if (!user || !user.role) {
      navigate("/auth/signin");
      return;
    }
    // Check role
    if (user.role === "mentor") {
      return;
    }
    if (user.role === "mentee") {
      navigate("/home");
      return;
    }
    // if (user.role === "admin") {
    //   navigate("/admin/profile");
    //   return;
    // }
  }, [navigate]);

  // Save profilepl
  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gom dữ liệu từ formData và avatar
      const payload = { ...formData };
      if (profileImage) {
        payload.avatar = profileImage;
      }
      const response = await profileApi.updateMentorProfile(payload);
      if (response && response.data) {
        setProfileImage(null); // Reset local image preview để sidebar lấy avatar từ backend
        toast.success("Cập nhật profile thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      setError(error.message || "Cập nhật profile thất bại");
      toast.error(error.message || "Cập nhật profile thất bại", {
        position: "top-right",
        autoClose: 4000,
      });
    }
    setLoading(false);
  };

  // const handleGetProfileDetail = async () => {
  //   setLoading(true);
  //   setError(null);
  //   const { response, error } = await profileApi.getProfileDetail();
  //   if (error) {
  //     setError("Không thể tải chi tiết profile");
  //   }
  //   setLoading(false);
  // };

  // CRUD API integration for Course
  // const handleCreateCourse = async (courseData) => {
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const formData = courseApi.createCourseFormData(courseData);
  //     const { response, error } = await courseApi.createCourse(formData);
  //     if (error) {
  //       setError("Tạo khóa học thất bại");
  //     } else if (response && response.data) {
  //       // Sau khi tạo thành công, reload lại danh sách courses
  //       if (formData?._id) {
  //         const mentorId = formData._id;
  //         if (!mentorId) {
  //           setError("Mentor ID không hợp lệ!");
  //           setAllCourses([]);
  //         } else {
  //           const courses = await courseApi.getCoursesByMentor(mentorId);
  //           setAllCourses(courses);
  //         }
  //       }
  //       alert("Tạo khóa học thành công!");
  //     }
  //   } catch (err) {
  //     setError("Tạo khóa học thất bại");
  //   }
  //   setLoading(false);
  // };

  // const handleUpdateCourse = async (courseId, updatedData) => {
  //   setLoading(true);
  //   setError(null);
  //   const { response, error } = await courseApi.updateCourse(
  //     courseId,
  //     updatedData
  //   );
  //   if (error) {
  //     setError("Cập nhật khóa học thất bại");
  //   } else if (response && response.data) {
  //     setAllCourses((prev) =>
  //       prev.map((c) => (c._id === courseId ? response.data : c))
  //     );
  //     alert("Cập nhật khóa học thành công!");
  //   }
  //   setLoading(false);
  // };

  // const handleGetCourseDetail = async (courseId) => {
  //   setLoading(true);
  //   setError(null);
  //   if (!courseId) {
  //     setError("Course ID không hợp lệ!");
  //     setLoading(false);
  //     return;
  //   }
  //   const { response, error } = await courseApi.getDetail({ courseId });
  //   if (error) {
  //     setError("Không thể tải chi tiết khóa học");
  //   } else if (response && response.data) {
  //     // You can set a state for selected course detail if needed
  //     alert("Đã tải chi tiết khóa học");
  //   }
  //   setLoading(false);
  // };

  // Replace mock delete with API delete
  const handleDeleteCourse = async (course) => {
    const courseId = course._id || course.id;
    if (!courseId) {
      toast.error("Invalid course id!", {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      setLoading(true);
      const { response, error } = await courseApi.deleteCourse({ courseId });
      if (error) {
        setError("Xóa khóa học thất bại");
        toast.error("Xóa khóa học thất bại", {
          position: "top-right",
          autoClose: 4000,
        });
      } else {
        setAllCourses((prev) =>
          prev.filter((c) => (c._id || c.id) !== courseId)
        );
        toast.success("Xóa khóa học thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed - network error", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ...existing code...
  // Tab logic: luôn vào tab 'profile' khi vào mentor/profile lần đầu, reload thì giữ tab hiện tại
  const [activeTab, setActiveTab] = useState(() => {
    // Nếu có tab lưu trong localStorage thì lấy, không thì mặc định là 'profile'
    return localStorage.getItem("mentorProfileTab") || "profile";
  });

  // Khi activeTab thay đổi, lưu vào localStorage
  useEffect(() => {
    localStorage.setItem("mentorProfileTab", activeTab);
  }, [activeTab]);

  // Khi vào mentor/profile lần đầu (mount), luôn về tab 'profile'
  useEffect(() => {
    if (!localStorage.getItem("mentorProfileTab")) {
      setActiveTab("profile");
      localStorage.setItem("mentorProfileTab", "profile");
    }
  }, []);

  // Lấy thông tin profile khi mount
  useEffect(() => {
    const fetchProfileAndCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await profileApi.getProfile();
        const profileData = data?.data;
        console.log("Profile API response:", profileData);
        if (!profileData || !profileData.user) {
          setError(
            "Không nhận được dữ liệu profile từ API hoặc thiếu thông tin user."
          );
          setFormData({
            userName: "",
            firstName: "",
            lastName: "",
            jobTitle: "",
            category: "",
            bio: "",
            mentorReason: "",
            headline: "",
            website: "",
            twitter: "",
            linkedin: "",
            youtube: "",
            facebook: "",
          });
          setProfileImage(null);
          setAllCourses([]);
        } else {
          // ...existing code...
          setFormData({
            userName: profileData?.user?.userName || "",
            firstName: profileData?.user?.firstName || "",
            lastName: profileData?.user?.lastName || "",
            bio: profileData?.bio || profileData?.user?.bio || "",
            jobTitle:
              profileData?.jobTitle || profileData?.user?.jobTitle || "",
            category:
              profileData?.category || profileData?.user?.category || "",
            skills:
              Array.isArray(profileData?.skills) &&
              profileData.skills.length > 0
                ? profileData.skills
                : Array.isArray(profileData?.user?.skills)
                ? profileData.user.skills
                : [],
            experience:
              profileData?.profile?.experience ||
              profileData?.experience ||
              profileData?.user?.experience ||
              "",
            location:
              profileData?.location || profileData?.user?.location || "",
            mentorReason:
              profileData?.mentorReason ||
              profileData?.user?.mentorReason ||
              "",
            greatestAchievement:
              profileData?.greatestAchievement ||
              profileData?.user?.greatestAchievement ||
              "",
            introVideo:
              profileData?.introVideo || profileData?.user?.introVideo || "",
            headline:
              profileData?.headline || profileData?.user?.headline || "",
            website: profileData?.links?.website || "",
            twitter: profileData?.links?.X || "",
            linkedin: profileData?.user?.linkedinUrl || "",
            youtube: profileData?.links?.youtube || "",
            facebook: profileData?.links?.facebook || "",
            avatarUrl: profileData?.user?.avatarUrl || "",
          });
          setProfileImage(profileData?.user?.avatarUrl || null);
          // Lấy đúng danh sách khóa học của mentor
          if (profileData?.user?._id) {
            const mentorId = profileData.user._id;
            if (!mentorId) {
              setError("Mentor ID không hợp lệ!");
              setAllCourses([]);
            } else {
              const courses = await courseApi.getCoursesByMentor(mentorId);
              setAllCourses(courses);
            }
          }
        }
      } catch (error) {
        setError("Không thể tải thông tin profile hoặc courses");
        // ...existing code...
        setAllCourses([]);
      }
      setLoading(false);
    };
    fetchProfileAndCourses();
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    userName: "",
    firstName: "",
    lastName: "",
    jobTitle: "",
    category: "",
    bio: "",
    mentorReason: "",
    headline: "",
    website: "",
    twitter: "",
    linkedin: "",
    youtube: "",
    facebook: "",
  });

  // Sửa trong mentor-profile.jsx
  const [profileImage, setProfileImage] = useState(null);

  // Đổi avatar khi upload ảnh mới
  const handleChangeAvatar = async (file) => {
    try {
      const res = await profileApi.changeAvatar(file);
      if (res && res.avatarUrl) {
        setProfileImage(res.avatarUrl);
        // ...existing code...
      }
    } catch (err) {
      alert("Đổi avatar thất bại!");
    }
  };

  // Course management state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [filterBy, setFilterBy] = useState("relevance");
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  // Mentee management state
  const [menteeSearchTerm, setMenteeSearchTerm] = useState("");
  const [menteeSortBy, setMenteeSortBy] = useState("latest");
  const [menteeCurrentPage, setMenteeCurrentPage] = useState(1);
  const menteesPerPage = 8;

  // Message management state
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchMessages, setSearchMessages] = useState("");

  // Reviews management state
  const [reviewSearchTerm, setReviewSearchTerm] = useState("");
  const [reviewSortBy, setReviewSortBy] = useState("latest");
  const [reviewCurrentPage, setReviewCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  // Schedule management state
  const [scheduleMode, setScheduleMode] = useState("list"); // 'list' | 'builder' | 'review'
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingSchedule, setEditingSchedule] = useState(null); // Schedule being edited
  const [availabilityOverview, setAvailabilityOverview] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [mySchedules, setMySchedules] = useState(null);
  const [mySchedulesLoading, setMySchedulesLoading] = useState(false);

  // Load availability overview when component mounts or tab changes to schedule
  useEffect(() => {
    if (activeTab === "schedule") {
      loadAvailabilityOverview();
      loadMySchedules();
    }
  }, [activeTab]);

  const loadAvailabilityOverview = async () => {
    setAvailabilityLoading(true);
    console.log("=== LOADING AVAILABILITY OVERVIEW ===");
    try {
      const { response, error } =
        await availabilityApi.getAvailabilityOverview();
      console.log("API Response:", response);
      console.log("API Error:", error);

      if (error) {
        console.error("Error loading availability overview:", error);
        toast.error("Không thể tải lịch overview");
      } else if (response && response.data) {
        console.log("Setting availability overview:", response.data);
        setAvailabilityOverview(response.data);
      } else {
        console.log("No data in response");
      }
    } catch (err) {
      console.error("Error in loadAvailabilityOverview:", err);
      toast.error("Lỗi khi tải availability overview");
    } finally {
      setAvailabilityLoading(false);
      console.log("=== AVAILABILITY OVERVIEW LOADING FINISHED ===");
    }
  };

  const loadMySchedules = async () => {
    setMySchedulesLoading(true);
    console.log("=== LOADING MY SCHEDULES ===");
    try {
      const { response, error } = await availabilityApi.getMySchedules();
      console.log("My Schedules API Response:", response);
      console.log("My Schedules API Error:", error);

      if (error) {
        console.error("Error loading my schedules:", error);
        toast.error("Không thể tải danh sách schedules");
      } else if (response && response.data) {
        console.log("Setting my schedules:", response.data);
        setMySchedules(response.data);
      } else {
        console.log("No data in my schedules response");
      }
    } catch (err) {
      console.error("Error in loadMySchedules:", err);
      toast.error("Lỗi khi tải danh sách schedules");
    } finally {
      setMySchedulesLoading(false);
      console.log("=== MY SCHEDULES LOADING FINISHED ===");
    }
  };

  // Function to handle editing a schedule
  const handleEditSchedule = (schedule) => {
    // Transform schedule data to format expected by MentorAvailabilityBuilder
    const availability = {};
    if (schedule.date && schedule.slots) {
      // Convert slots to time strings array
      const timeSlots = schedule.slots.map((slot) => slot.start).sort();
      availability[schedule.date] = timeSlots;
    }

    const editingData = {
      ...schedule,
      availability: availability,
      name: `Schedule for ${new Date(schedule.date).toLocaleDateString(
        "vi-VN",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )}`,
    };

    setEditingSchedule(editingData);
    setScheduleMode("builder");
  };

  // Helper function to calculate end time
  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const endMinutes = minutes + durationMinutes;
    const endHours =
      endMinutes >= 60 ? hours + Math.floor(endMinutes / 60) : hours;
    const adjustedMinutes = endMinutes % 60;
    return `${endHours.toString().padStart(2, "0")}:${adjustedMinutes
      .toString()
      .padStart(2, "0")}`;
  };

  // Function to save edited schedule with booking protection
  const handleSaveEditedSchedule = async (scheduleData) => {
    try {
      // Transform scheduleData.slots to backend format with booking protection
      const availabilityPromises = Object.entries(scheduleData.slots).map(
        async ([date, times]) => {
          // First, get existing schedule for this date to check for bookings
          console.log("Looking for existing schedule for date:", date);
          console.log("mySchedules structure:", mySchedules);

          const existingSchedule = mySchedules?.schedulesByMonth
            ?.flatMap((month) => month.schedules)
            ?.find((schedule) => {
              const normalizedScheduleDate = schedule.date.split("T")[0]; // Remove time part
              const normalizedTargetDate = date.split("T")[0]; // Remove time part
              console.log(
                "Comparing dates:",
                normalizedScheduleDate,
                "vs",
                normalizedTargetDate
              );
              return normalizedScheduleDate === normalizedTargetDate;
            });

          console.log("Found existing schedule:", existingSchedule);

          const newSlots = [];

          console.log("Processing times for date", date, ":", times);
          console.log("Existing schedule slots:", existingSchedule?.slots);

          // Convert new times to 30-minute slots
          times.forEach((time) => {
            const [hours, minutes] = time.split(":").map(Number);
            const startTime = `${hours.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}`;
            const endMinutes = minutes + 30;
            const endHours = endMinutes >= 60 ? hours + 1 : hours;
            const adjustedMinutes =
              endMinutes >= 60 ? endMinutes - 60 : endMinutes;
            const endTime = `${endHours
              .toString()
              .padStart(2, "0")}:${adjustedMinutes
              .toString()
              .padStart(2, "0")}`;

            // Always add the slot - backend will handle preservation of booking status
            console.log(`Adding slot: ${startTime}`);
            newSlots.push({
              start: startTime,
              end: endTime,
              status: "open", // Always send as 'open' - backend will preserve booked status
            });
          });

          // Note: Backend will automatically preserve booked/held slots
          // and delete pending/canceled bookings for removed slots

          // Sort slots by start time and log final payload
          newSlots.sort((a, b) => a.start.localeCompare(b.start));
          console.log("Final slots payload for", date, ":", newSlots);

          // Call API to create/update availability
          const payload = {
            date,
            slots: newSlots,
            timezone: "Asia/Ho_Chi_Minh",
          };
          console.log("API payload:", payload);

          const { response, error } =
            await availabilityApi.createOrUpdateAvailability(payload);

          if (error) {
            console.error("API error for date", date, ":", error);
            throw new Error(
              `Lỗi cập nhật availability cho ngày ${date}: ${JSON.stringify(
                error
              )}`
            );
          }

          console.log("API success for date", date, ":", response);
          return response;
        }
      );

      await Promise.all(availabilityPromises);

      toast.success(
        "Cập nhật lịch thành công! Các booking pending/cancelled đã bị xóa."
      );
      setScheduleMode("list");
      setEditingSchedule(null);

      // Reload all data to refresh UI
      await loadAvailabilityOverview();
      await loadMySchedules();
      await loadMentorBookings(); // Refresh bookings - deleted bookings should disappear
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast.error(error.message || "Lỗi khi cập nhật lịch");
    }
  };

  // Auto-cleanup expired schedules
  useEffect(() => {
    const cleanupExpiredSchedules = () => {
      const today = todayKey();
      setSchedules((prevSchedules) => {
        const activeSchedules = prevSchedules.filter((schedule) => {
          // Check if schedule has any future dates
          const futureDates = Object.keys(schedule.availability).filter(
            (date) => !isPast(date)
          );
          return futureDates.length > 0;
        });

        // Log if any schedules were removed
        const removedCount = prevSchedules.length - activeSchedules.length;
        if (removedCount > 0) {
          console.log(
            `Automatically removed ${removedCount} expired schedule(s)`
          );
        }

        return activeSchedules;
      });
    };

    // Run cleanup on component mount and every minute
    cleanupExpiredSchedules();
    const interval = setInterval(cleanupExpiredSchedules, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Response/Booking management state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Booking filter state
  const [bookingFilter, setBookingFilter] = useState("all"); // 'all', 'pending', 'accepted', 'declined'

  // Delete confirmation popup state
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    scheduleId: null,
    scheduleName: null,
  });

  // Decline booking confirmation popup state
  const [declineConfirmModal, setDeclineConfirmModal] = useState({
    isOpen: false,
    bookingId: null,
    bookingInfo: null,
  });

  // Decline reason state
  const [declineReason, setDeclineReason] = useState("");

  // Load bookings when component mounts or tab changes to response
  useEffect(() => {
    if (activeTab === "response") {
      loadMentorBookings();
    }
  }, [activeTab]);

  const loadMentorBookings = async () => {
    setBookingsLoading(true);
    try {
      const { response, error } = await bookingApi.getMentorBookings();
      if (error) {
        console.error("Error loading mentor bookings:", error);
        toast.error("Không thể tải danh sách booking");
        setBookings([]);
      } else if (response && response.data) {
        // Transform backend data to match frontend format
        const transformedBookings = (
          Array.isArray(response.data) ? response.data : []
        ).map((booking) => ({
          id: booking._id,
          avatarUrl: booking.mentee?.avatarUrl || "",
          menteeName: booking.mentee
            ? `${booking.mentee.firstName || ""} ${
                booking.mentee.lastName || ""
              }`.trim()
            : "Unknown",
          menteeEmail: booking.mentee?.email || "No email",
          date: new Date(booking.date).toISOString().split("T")[0],
          time: booking.start,
          endTime: booking.end,
          status: booking.status,
          message: booking.notes || "",
          createdAt: booking.createdAt,
        }));
        setBookings(transformedBookings);
      }
    } catch (err) {
      console.error("Error in loadMentorBookings:", err);
      toast.error("Lỗi khi tải danh sách booking");
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Function to filter bookings based on current filter
  const getFilteredBookings = () => {
    if (bookingFilter === "all") return bookings;

    // Map frontend filter to backend status
    const statusMap = {
      pending: "pending",
      accepted: "active", // Backend uses "active" for confirmed bookings
      declined: "cancelled", // Backend uses "cancelled" for declined bookings
    };

    const targetStatus = statusMap[bookingFilter];
    return bookings.filter((booking) => booking.status === targetStatus);
  };

  // Booking response handlers
  const handleAcceptBooking = async (bookingId) => {
    try {
      const { response, error } = await bookingApi.confirmBooking(bookingId);
      if (error) {
        console.error("Error accepting booking:", error);
        toast.error("Không thể chấp nhận booking");
        return;
      }

      // Update bookings state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: "active", // Backend trả về "active" cho confirmed booking
                respondedAt: new Date().toISOString(),
              }
            : booking
        )
      );

      // Update mySchedules slots color immediately for better UX
      const acceptedBooking = bookings.find((b) => b.id === bookingId);

      if (acceptedBooking) {
        setMySchedules((prev) => {
          if (!prev || !prev.schedulesByMonth) return prev;

          return {
            ...prev,
            schedulesByMonth: prev.schedulesByMonth.map((monthGroup) => ({
              ...monthGroup,
              schedules: monthGroup.schedules.map((schedule) => {
                // Normalize dates to YYYY-MM-DD format for comparison
                const scheduleDate = schedule.date.split("T")[0];
                const bookingDate = acceptedBooking.date.split("T")[0];
                if (scheduleDate === bookingDate) {
                  return {
                    ...schedule,
                    slots: schedule.slots.map((slot) => {
                      if (slot.start === acceptedBooking.time) {
                        return { ...slot, status: "booked" };
                      }
                      return slot;
                    }),
                  };
                }
                return schedule;
              }),
            })),
          };
        });
      }

      // Refresh availability data with slight delay to ensure backend update completes
      setTimeout(async () => {
        await Promise.all([loadAvailabilityOverview(), loadMySchedules()]);
      }, 1000); // Wait 1 second for backend to complete slot update

      toast.success("Đã chấp nhận booking thành công!");
    } catch (err) {
      console.error("Error in handleAcceptBooking:", err);
      toast.error("Lỗi khi chấp nhận booking");
    }
  };

  const handleDeclineBooking = async (bookingId, reason = "") => {
    try {
      const { response, error } = await bookingApi.cancelBooking(
        bookingId,
        reason
      );
      if (error) {
        console.error("Error declining booking:", error);
        toast.error("Không thể từ chối booking");
        return;
      }

      // Update bookings state
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                status: "cancelled", // Backend trả về "cancelled" cho declined booking
                respondedAt: new Date().toISOString(),
              }
            : booking
        )
      );

      // Update mySchedules slots color immediately for better UX
      const declinedBooking = bookings.find((b) => b.id === bookingId);

      if (declinedBooking) {
        setMySchedules((prev) => {
          if (!prev || !prev.schedulesByMonth) return prev;

          return {
            ...prev,
            schedulesByMonth: prev.schedulesByMonth.map((monthGroup) => ({
              ...monthGroup,
              schedules: monthGroup.schedules.map((schedule) => {
                // Normalize dates to YYYY-MM-DD format for comparison
                const scheduleDate = schedule.date.split("T")[0];
                const bookingDate = declinedBooking.date.split("T")[0];
                if (scheduleDate === bookingDate) {
                  return {
                    ...schedule,
                    slots: schedule.slots.map((slot) => {
                      if (slot.start === declinedBooking.time) {
                        return { ...slot, status: "open" };
                      }
                      return slot;
                    }),
                  };
                }
                return schedule;
              }),
            })),
          };
        });
      }

      // Refresh availability data để slot trở lại trạng thái available
      setTimeout(async () => {
        await Promise.all([loadAvailabilityOverview(), loadMySchedules()]);
      }, 1000); // Wait 1 second for backend to complete slot update

      toast.success(
        "Đã từ chối booking thành công! Thời gian đã trở lại trạng thái có thể đặt lịch."
      );
    } catch (err) {
      console.error("Error in handleDeclineBooking:", err);
      toast.error("Lỗi khi từ chối booking");
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      console.log(`Deleting schedule ${scheduleId}`);

      const { response, error } = await availabilityApi.deleteAvailability(
        scheduleId
      );
      if (error) {
        console.error("Error deleting schedule:", error);
        toast.error("Không thể xóa lịch trình");
        return;
      }

      // Update local state - remove from mySchedules
      setMySchedules((prev) => {
        if (!prev || !prev.schedulesByMonth) return prev;

        const updatedSchedulesByMonth = prev.schedulesByMonth
          .map((monthGroup) => ({
            ...monthGroup,
            schedules: monthGroup.schedules.filter(
              (schedule) => schedule._id !== scheduleId
            ),
          }))
          .filter((monthGroup) => monthGroup.schedules.length > 0); // Remove empty months

        return {
          ...prev,
          schedulesByMonth: updatedSchedulesByMonth,
          // Update totals
          totalSchedules: prev.totalSchedules - 1,
        };
      });

      // Refresh availability overview data (chỉ refresh overview, không cần refresh mySchedules vì đã update local state)
      loadAvailabilityOverview();

      // Fallback: nếu UI không update, refresh lại data sau 500ms
      setTimeout(() => {
        loadMySchedules();
      }, 500);

      toast.success("Đã xóa lịch trình thành công!");
    } catch (err) {
      console.error("Error in handleDeleteSchedule:", err);
      toast.error("Lỗi khi xóa lịch trình");
    }
  };

  // Open delete confirmation modal
  const openDeleteConfirmModal = (schedule) => {
    const dayOfWeekEn = new Date(schedule.date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    const dateEn = new Date(schedule.date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    setDeleteConfirmModal({
      isOpen: true,
      scheduleId: schedule._id,
      scheduleName: `${dayOfWeekEn} - ${dateEn}`,
    });
  };

  // Close delete confirmation modal
  const closeDeleteConfirmModal = () => {
    setDeleteConfirmModal({
      isOpen: false,
      scheduleId: null,
      scheduleName: null,
    });
  };

  // Confirm delete
  const confirmDeleteSchedule = async () => {
    if (deleteConfirmModal.scheduleId) {
      await handleDeleteSchedule(deleteConfirmModal.scheduleId);
      closeDeleteConfirmModal();
    }
  };

  // Open decline booking confirmation modal
  const openDeclineConfirmModal = (booking) => {
    setDeclineConfirmModal({
      isOpen: true,
      bookingId: booking.id,
      bookingInfo: {
        menteeName: booking.menteeName,
        date: new Date(booking.date).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        time: booking.time,
      },
    });
  };

  // Close decline booking confirmation modal
  const closeDeclineConfirmModal = () => {
    setDeclineConfirmModal({
      isOpen: false,
      bookingId: null,
      bookingInfo: null,
    });
    setDeclineReason(""); // Reset decline reason
  };

  // Confirm decline booking
  const confirmDeclineBooking = async () => {
    if (declineConfirmModal.bookingId) {
      await handleDeclineBooking(declineConfirmModal.bookingId, declineReason);
      closeDeclineConfirmModal();
    }
  };

  // Real courses data from MongoDB API
  // No mock data, empty courses array
  const [allCourses, setAllCourses] = useState([]);

  // Real mentees data - TODO: Replace with API data
  const [allMentees] = useState([]);

  // Real conversations data - TODO: Replace with API data
  const [conversations] = useState([]);

  // Real reviews data from MongoDB API
  // No mock data, empty reviews array
  const [allReviews, setAllReviews] = useState([]);

  // Load courses from MongoDB
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const { response, error } = await courseApi.getAllCourses();
      if (error || !response?.data) {
        setError("Failed to load courses");
        setAllCourses([]);
        setLoading(false);
        return;
      }
      if (response.data.courses && Array.isArray(response.data.courses)) {
        setAllCourses(response.data.courses);
      } else if (Array.isArray(response.data)) {
        setAllCourses(response.data);
      } else {
        setError("Unexpected response structure");
        setAllCourses([]);
      }
    } catch (err) {
      setError("Error loading courses");
      setAllCourses([]);
    } finally {
      setLoading(false);
    }
  };

  // Load reviews from MongoDB
  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const { response, error } = await courseApi.getAllReviews();
      console.log("Reviews API Response:", { response, error });

      if (error) {
        console.error("Reviews API Error:", error);
        setError("Failed to load reviews");
        setAllReviews([]);
      } else if (response && response.data) {
        if (response.data.reviews && Array.isArray(response.data.reviews)) {
          setAllReviews(response.data.reviews);
        } else if (Array.isArray(response.data)) {
          setAllReviews(response.data);
        } else {
          console.error(
            "Unexpected reviews response structure:",
            response.data
          );
          setAllReviews([]);
        }
      } else {
        console.error("No reviews response data");
        setAllReviews([]);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setError("Failed to load reviews");
      setAllReviews([]);
    } finally {
      setLoading(false);
    }
  };

  // Load courses and reviews on component mount
  // Không gọi API courses/reviews nữa, chỉ dùng dữ liệu mock

  // Filter and search logic
  const getFilteredAndSortedCourses = () => {
    let filtered = allCourses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.description &&
          course.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort courses
    switch (sortBy) {
      case "latest":
        filtered = filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        break;
      case "popular":
        filtered = filtered.sort(
          (a, b) => (b.mentees?.length || 0) - (a.mentees?.length || 0)
        );
        break;
      default:
        break;
    }

    // Filter by price/rating
    switch (filterBy) {
      case "price-low":
        filtered = filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = filtered.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        filtered = filtered.sort((a, b) => (b.rate || 0) - (a.rate || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Pagination logic
  const filteredCourses = getFilteredAndSortedCourses();
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const startIndex = (currentPage - 1) * coursesPerPage;
  const currentCourses = filteredCourses.slice(
    startIndex,
    startIndex + coursesPerPage
  );

  // Mentee filter and search logic
  const getFilteredAndSortedMentees = () => {
    let filtered = allMentees.filter(
      (mentee) =>
        mentee.name.toLowerCase().includes(menteeSearchTerm.toLowerCase()) ||
        mentee.email.toLowerCase().includes(menteeSearchTerm.toLowerCase()) ||
        mentee.enrolledCourses.some((course) =>
          course.courseName
            .toLowerCase()
            .includes(menteeSearchTerm.toLowerCase())
        )
    );

    // Sort mentees
    switch (menteeSortBy) {
      case "latest":
        filtered = filtered.sort(
          (a, b) => new Date(b.lastActive) - new Date(a.lastActive)
        );
        break;
      case "oldest":
        filtered = filtered.sort(
          (a, b) => new Date(a.joinedDate) - new Date(b.joinedDate)
        );
        break;
      case "most-courses":
        filtered = filtered.sort((a, b) => b.totalCourses - a.totalCourses);
        break;
      case "name":
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  };

  // Mentee pagination logic
  const filteredMentees = getFilteredAndSortedMentees();
  const totalMenteePages = Math.ceil(filteredMentees.length / menteesPerPage);
  const menteeStartIndex = (menteeCurrentPage - 1) * menteesPerPage;
  const currentMentees = filteredMentees.slice(
    menteeStartIndex,
    menteeStartIndex + menteesPerPage
  );

  const handleMenteePageChange = (page) => {
    setMenteeCurrentPage(page);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveImage = () => {
    // TODO: Implement save image functionality
    console.log("Save image functionality to be implemented");
  };

  // Message handlers
  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      // TODO: Implement send message functionality with API
      console.log("Sending message:", messageInput);
      setMessageInput("");
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessageToMentee = (menteeId) => {
    // Find or create conversation with this mentee
    const existingConversation = conversations.find(
      (conv) => conv.menteeId === menteeId
    );
    if (existingConversation) {
      setSelectedConversation(existingConversation);
    } else {
      // Create new conversation - TODO: Implement with API
      const mentee = allMentees.find((m) => m.id === menteeId);
      if (mentee) {
        const newConversation = {
          id: conversations.length + 1,
          menteeId: mentee.id,
          menteeName: mentee.name,
          menteeAvatar: mentee.avatar,
          lastMessage: "",
          lastMessageTime: "Now",
          isOnline: false,
          unreadCount: 0,
          messages: [],
        };
        setSelectedConversation(newConversation);
      }
    }
    setActiveTab("messages");
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv) =>
    conv.menteeName.toLowerCase().includes(searchMessages.toLowerCase())
  );

  // Reviews filter and search logic
  const getFilteredAndSortedReviews = () => {
    let filtered = allReviews.filter((review) => {
      const studentName = review.author
        ? `${review.author.firstName || ""} ${
            review.author.lastName || ""
          }`.trim() || review.author.userName
        : "";
      const courseName = review.target ? review.target.title : "";
      const reviewText = review.content || "";

      return (
        studentName.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        courseName.toLowerCase().includes(reviewSearchTerm.toLowerCase()) ||
        reviewText.toLowerCase().includes(reviewSearchTerm.toLowerCase())
      );
    });

    // Sort reviews
    switch (reviewSortBy) {
      case "latest":
        return filtered.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
      case "oldest":
        return filtered.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
      case "highest-rating":
        return filtered.sort((a, b) => (b.rate || 0) - (a.rate || 0));
      case "lowest-rating":
        return filtered.sort((a, b) => (a.rate || 0) - (b.rate || 0));
      case "most-helpful":
        return filtered.sort(
          (a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0)
        );
      default:
        return filtered;
    }
  };

  // Reviews pagination logic
  const filteredReviews = getFilteredAndSortedReviews();
  const totalReviewPages = Math.ceil(filteredReviews.length / reviewsPerPage);
  const reviewStartIndex = (reviewCurrentPage - 1) * reviewsPerPage;
  const currentReviews = filteredReviews.slice(
    reviewStartIndex,
    reviewStartIndex + reviewsPerPage
  );

  const handleReviewPageChange = (page) => {
    setReviewCurrentPage(page);
  };

  // Scroll lên đầu trang (bao gồm cả header) khi chuyển tab
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tab handler: set tab, lưu localStorage, cuộn lên đầu
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("mentorProfileTab", tab);
    scrollToTop();
  };

  return (
    <div className="min-h-screen bg-white-100">
      {/* Main Layout Container */}
      <div className="flex max-w-7xl mx-auto pt-10 gap-8 px-8 min-h-screen">
        {/* Sidebar - Fixed width and height */}
        <div
          style={{ width: 280, minWidth: 280 }}
          className="bg-slate-50 rounded-2xl shadow-sm p-8 flex flex-col items-center sticky top-10 self-start"
        >
          {formData?.avatarUrl || profileImage ? (
            <img
              src={formData.avatarUrl || profileImage}
              alt={
                formData?.firstName || formData?.lastName
                  ? `${capitalizeWords(formData.firstName)} ${capitalizeWords(
                      formData.lastName
                    )}`
                  : "Default Avatar"
              }
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
          ) : (
            <FaUserCircle className="w-24 h-24 text-gray-300 mb-4" />
          )}
          <h2 className="font-semibold text-xl text-gray-900 mb-3">
            {formData?.firstName || formData?.lastName
              ? `${capitalizeWords(formData.firstName)} ${capitalizeWords(
                  formData.lastName
                )}`.trim()
              : "Name"}
          </h2>
          <button className="bg-blue-600 text-white border-none rounded-lg px-6 py-1.5 mb-6 font-medium text-base">
            Mentor
          </button>

          {/* Navigation Menu */}
          <nav className="w-full mt-6">
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("profile")}
              >
                Profile
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "mycourses"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("mycourses")}
              >
                My Courses
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "mentees"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("mentees")}
              >
                Mentees
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "messages"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => {
                  handleTabChange("messages");
                  setSelectedConversation(null); // Reset to messages list when clicking tab
                }}
              >
                Message
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "reviews"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("reviews")}
              >
                My Reviews
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "schedule"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("schedule")}
              >
                My Schedule
              </li>
              <li
                className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === "response"
                    ? "bg-gray-200 hover:bg-gray-300 hover:shadow-sm"
                    : "hover:bg-blue-50 hover:text-blue-600 hover:shadow-sm hover:scale-105"
                }`}
                onClick={() => handleTabChange("response")}
              >
                Response
              </li>
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && (
            <form className="space-y-6">
              {/* Personal Information Section */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Label"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Job Title & Category row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      name="jobTitle"
                      value={formData.jobTitle || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category (Expertise)
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Skills, Experience, Mentor Reason, Greatest Achievement */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={
                        Array.isArray(formData.skills)
                          ? formData.skills.join(", ")
                          : formData.skills || ""
                      }
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "skills",
                            value: e.target.value.split(/,\s*/),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. React, Node.js, MongoDB"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason to become a mentor
                  </label>
                  <textarea
                    name="mentorReason"
                    rows={2}
                    value={formData.mentorReason || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Greatest Achievement
                  </label>
                  <input
                    type="text"
                    name="greatestAchievement"
                    value={formData.greatestAchievement || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Headline
                  </label>
                  <input
                    type="text"
                    name="headline"
                    placeholder="Label"
                    value={formData.headline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    placeholder="Label"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intro Video (URL)
                  </label>
                  <input
                    type="url"
                    name="introVideo"
                    value={formData.introVideo || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* Image Upload Section - Chỉ còn ô preview, click để upload */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Profile Image
                </h3>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-4 bg-gray-50 cursor-pointer flex items-center justify-center"
                  onClick={() => document.getElementById("imageUpload").click()}
                  style={{ minHeight: 120 }}
                  title="Click to upload/change avatar"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Preview"
                      className="w-24 h-24 object-cover mx-auto rounded"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-300 rounded mx-auto flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        fill="none"
                        stroke="currentColor"
                        className="text-gray-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      handleImageUpload(e);
                      if (e.target.files[0])
                        handleChangeAvatar(e.target.files[0]);
                    }}
                    className="hidden"
                    id="imageUpload"
                  />
                </div>
              </div>

              {/* Links Section */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Social Links
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FaGoogle className="w-5 h-5 text-blue-500" />
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      placeholder="https://your-website.com"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FaXTwitter className="w-5 h-5 text-black" />
                      Twitter/X
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      placeholder="https://twitter.com/username"
                      value={formData.twitter}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FaLinkedin className="w-5 h-5 text-blue-700" />
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <AiFillYoutube className="w-5 h-5" />
                      Youtube
                    </label>
                    <input
                      type="url"
                      name="youtube"
                      placeholder="https://youtube.com/channel/channelid"
                      value={formData.youtube}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                      <FaFacebook className="w-5 h-5 text-blue-600" />
                      Facebook
                    </label>
                    <input
                      type="url"
                      name="facebook"
                      placeholder="https://facebook.com/username"
                      value={formData.facebook}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              {/* Nút lưu profile ở cuối form */}
              <button
                type="button"
                className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold mt-8 float-right transition-all duration-200 ${
                  loading
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-blue-700 hover:scale-105"
                }`}
                onClick={loading ? undefined : handleUpdateProfile}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            </form>
          )}

          {activeTab === "mycourses" && (
            <div className="space-y-6">
              {/* Courses Section - TODO: Connect to real API for fetching mentor's courses */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                {/* Header with course count and search/filter */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Courses ({filteredCourses.length})
                    </h3>
                    <button
                      onClick={() =>
                        navigate(`${PATH.MENTOR}/${MENTOR_PATH.CREATECOURSE}`)
                      }
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
                    >
                      New Course
                    </button>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Course"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to page 1 when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest</option>
                      <option value="popular">Most Popular</option>
                    </select>
                    <select
                      value={filterBy}
                      onChange={(e) => {
                        setFilterBy(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Rating</option>
                    </select>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSortBy("latest");
                        setFilterBy("relevance");
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Course Grid - Dynamic rendering based on filtered data */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">
                      Loading courses...
                    </span>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-600 mb-4">⚠️ {error}</div>
                    <button
                      onClick={loadCourses}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Retry Loading Courses
                    </button>
                  </div>
                ) : (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start content-start"
                    style={{
                      height: "1650px",
                    }}
                  >
                    {currentCourses.length > 0 ? (
                      currentCourses.map((course) => (
                        <div
                          key={course._id || course.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow min-h-[450px] flex flex-col cursor-pointer"
                          onClick={() => {
                            navigate(
                              `/mentor/course-detail/${course._id || course.id}`
                            );
                          }}
                        >
                          <img
                            src={
                              course.thumbnail
                                ? /cloudinary\.com|res\.cloudinary\.com/.test(
                                    course.thumbnail
                                  )
                                  ? course.thumbnail
                                  : course.thumbnail.startsWith("http")
                                  ? course.thumbnail
                                  : `http://localhost:4000/${course.thumbnail}`
                                : "/placeholder-course.jpg"
                            }
                            alt={course.title}
                            className="w-full h-48 object-cover"
                          />
                          {/* Đã bỏ phần ngăn cách lớn, chỉ giữ card nhỏ gọn */}
                          <div className="flex-1 flex flex-col p-4 pb-0">
                            <div
                              className="flex flex-col"
                              style={{
                                minHeight: "120px",
                                justifyContent: "flex-start",
                              }}
                            >
                              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                {course.title}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                By{" "}
                                {(() => {
                                  const capitalizeWords = (str) =>
                                    str
                                      ? str
                                          .split(" ")
                                          .map(
                                            (word) =>
                                              word.charAt(0).toUpperCase() +
                                              word.slice(1)
                                          )
                                          .join(" ")
                                      : "";
                                  if (course.mentor?.userName)
                                    return capitalizeWords(
                                      course.mentor.userName
                                    );
                                  if (course.mentor?.firstName)
                                    return `${capitalizeWords(
                                      course.mentor.firstName
                                    )} ${capitalizeWords(
                                      course.mentor.lastName
                                    )}`;
                                  return "Unknown Mentor";
                                })()}
                              </p>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex text-yellow-400 text-sm">
                                  {"★".repeat(Math.floor(course.rate || 0))}
                                  {(course.rate || 0) % 1 !== 0 && "☆"}
                                </div>
                                <span className="text-sm text-gray-600">
                                  ({course.numberOfRatings || 0} Ratings)
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {course.duration || 0} Hours.{" "}
                                {course.lectures || 0} Lectures.{" "}
                                {course.category}
                              </p>

                              {/* Hiển thị tags (Programming Languages) */}
                              {course.tags && course.tags.length > 0 && (
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {course.tags
                                      .slice(0, 3)
                                      .map((tag, index) => (
                                        <span
                                          key={index}
                                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    {course.tags.length > 3 && (
                                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                        +{course.tags.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Hiển thị languages */}
                              {course.language &&
                                course.language.length > 0 && (
                                  <div className="mb-2">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Languages:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {course.language
                                        .slice(0, 2)
                                        .map((lang, index) => (
                                          <span
                                            key={index}
                                            className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                                          >
                                            {lang}
                                          </span>
                                        ))}
                                      {course.language.length > 2 && (
                                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                                          +{course.language.length - 2} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Đã bỏ hiển thị course overview và key learning objectives */}
                              {/* Hiển thị level nếu có */}
                              {course.level && (
                                <p className="text-green-500 text-xs mb-2">
                                  <b>Level:</b> {course.level}
                                </p>
                              )}
                            </div>
                            <p className="font-bold text-xl text-gray-900 mb-2 mt-auto">
                              $
                              {(() => {
                                const price =
                                  typeof course.price === "number"
                                    ? course.price
                                    : parseFloat(course.price || 0);
                                return price % 1 === 0
                                  ? price.toLocaleString("en-US")
                                  : price.toLocaleString("en-US", {
                                      minimumFractionDigits: 1,
                                      maximumFractionDigits: 2,
                                    });
                              })()}
                            </p>
                          </div>
                          <div className="flex gap-2 p-4 pt-0 mt-auto">
                            <button
                              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  `/mentor/edit-course/${
                                    course._id || course.id
                                  }`
                                );
                              }}
                            >
                              Edit Course
                            </button>
                            <button
                              className="flex-1 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCourse(course);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500 text-lg mb-2">
                          No courses found
                        </p>
                        <p className="text-gray-400">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Pagination - Dynamic based on filtered results */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded transition ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "mentees" && (
            <div className="space-y-6">
              {/* Mentees Section - TODO: Connect to real API for fetching mentor's mentees */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                {/* Header with mentee count and search */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Mentees ({filteredMentees.length})
                    </h3>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Mentees"
                      value={menteeSearchTerm}
                      onChange={(e) => {
                        setMenteeSearchTerm(e.target.value);
                        setMenteeCurrentPage(1); // Reset to page 1 when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={menteeSortBy}
                      onChange={(e) => {
                        setMenteeSortBy(e.target.value);
                        setMenteeCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="latest">Most Active</option>
                      <option value="oldest">Oldest Member</option>
                      <option value="most-courses">Most Courses</option>
                      <option value="name">Name A-Z</option>
                    </select>
                    <button
                      onClick={() => {
                        setMenteeSearchTerm("");
                        setMenteeSortBy("latest");
                        setMenteeCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Mentees Grid - Dynamic rendering based on filtered data */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start content-start"
                  style={{ height: "2220px" }}
                >
                  {currentMentees.length > 0 ? (
                    currentMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={mentee.avatar}
                            alt={mentee.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {mentee.name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {mentee.email}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                Joined:{" "}
                                {new Date(
                                  mentee.joinedDate
                                ).toLocaleDateString()}
                              </span>
                              <span>
                                Last Active:{" "}
                                {new Date(
                                  mentee.lastActive
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">
                            Enrolled Courses ({mentee.totalCourses})
                          </h5>
                          <div className="space-y-2">
                            {mentee.enrolledCourses.map((course, index) => (
                              <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-3"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h6 className="font-medium text-sm text-gray-900">
                                    {course.courseName}
                                  </h6>
                                  <span className="text-xs text-gray-500">
                                    {course.progress}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                  <span>
                                    Enrolled:{" "}
                                    {new Date(
                                      course.enrolledDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${course.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* TODO: Add message/contact functionality with API calls */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSendMessageToMentee(mentee.id)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            Send Message
                          </button>
                          <button className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm">
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-500 text-lg mb-2">
                        No mentees found
                      </p>
                      <p className="text-gray-400">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  )}
                </div>

                {/* Pagination - Dynamic based on filtered results */}
                {totalMenteePages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() =>
                        handleMenteePageChange(menteeCurrentPage - 1)
                      }
                      disabled={menteeCurrentPage === 1}
                      className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {[...Array(totalMenteePages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handleMenteePageChange(page)}
                          className={`px-3 py-1 rounded transition ${
                            menteeCurrentPage === page
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        handleMenteePageChange(menteeCurrentPage + 1)
                      }
                      disabled={menteeCurrentPage === totalMenteePages}
                      className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "messages" && !selectedConversation && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {/* Header with Search and Filter */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Messages
                  </h3>
                  <div className="flex gap-4 items-center">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search User"
                        value={searchMessages}
                        onChange={(e) => setSearchMessages(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Sort By</span>
                        <select className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
                          <option>Relevance</option>
                          <option>Latest</option>
                          <option>Oldest</option>
                        </select>
                      </div>

                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                        Filter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conversations List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={conversation.menteeAvatar}
                          alt={conversation.menteeName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {conversation.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {conversation.menteeName}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">
                          {conversation.lastMessageTime}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && selectedConversation && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <img
                    src={selectedConversation.menteeAvatar}
                    alt={selectedConversation.menteeName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedConversation.menteeName}
                    </h4>
                    {selectedConversation.isOnline && (
                      <p className="text-sm text-green-600">Online</p>
                    )}
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === "mentor"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          message.senderId === "mentor"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === "mentor"
                              ? "text-blue-100"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type Your Message"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-6">
              {scheduleMode === "list" && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  {/* Header with create schedule button */}
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      My Schedules
                    </h3>
                    <button
                      onClick={() => setScheduleMode("builder")}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Create Schedule
                    </button>
                  </div>

                  {/* Availability Overview */}
                  {availabilityLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">
                        Loading availability...
                      </span>
                    </div>
                  ) : availabilityOverview ? (
                    <div className="space-y-4">
                      {/* Debug logging */}
                      {console.log(
                        "Rendering availabilityOverview:",
                        availabilityOverview
                      )}

                      {/* Summary Stats */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-lg">
                        <h4 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
                          <span className="text-blue-600">📊</span> Availability
                          Overview (Next 7 Days)
                        </h4>
                        <div className="grid grid-cols-3 gap-6 mb-4">
                          <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
                            <div className="text-3xl font-bold text-blue-600 mb-1">
                              {availabilityOverview.summary
                                ?.totalDaysWithSlots || 0}
                            </div>
                            <div className="text-sm text-blue-800 font-medium">
                              Days with Slots
                            </div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
                            <div className="text-3xl font-bold text-green-600 mb-1">
                              {availabilityOverview.summary
                                ?.totalAvailableSlots || 0}
                            </div>
                            <div className="text-sm text-green-800 font-medium">
                              Available Slots
                            </div>
                          </div>
                          <div className="text-center bg-white rounded-lg p-4 shadow-sm border">
                            <div className="text-3xl font-bold text-purple-600 mb-1">
                              {availabilityOverview.summary?.totalSlots || 0}
                            </div>
                            <div className="text-sm text-purple-800 font-medium">
                              Total Slots
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Daily Overview */}
                      <div className="space-y-4">
                        {availabilityOverview.overview?.map((day, index) => (
                          <div
                            key={day.date}
                            className={`border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                              day.hasAvailability
                                ? "border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 hover:border-blue-300"
                                : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h5 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                  <span className="text-blue-600 text-sm">
                                    📅
                                  </span>
                                  {new Date(day.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      weekday: "long",
                                    }
                                  )}
                                </h5>
                                <p className="text-gray-600 font-medium text-sm mb-1">
                                  {new Date(day.date).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "long",
                                      day: "numeric",
                                      year: "numeric",
                                    }
                                  )}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {day.hasAvailability
                                    ? `${day.availableSlots} available / ${day.totalSlots} total slots`
                                    : "No slots available"}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {day.hasAvailability ? (
                                  <>
                                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium shadow-sm">
                                      ✅ Available
                                    </span>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">
                                        Availability
                                      </div>
                                      <div className="text-sm font-semibold text-green-600">
                                        {Math.round(
                                          (day.availableSlots /
                                            day.totalSlots) *
                                            100
                                        )}
                                        %
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <span className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full font-medium">
                                    ❌ No Slots
                                  </span>
                                )}
                              </div>
                            </div>

                            {day.hasAvailability &&
                              day.slots &&
                              day.slots.length > 0 && (
                                <div className="bg-white rounded-lg p-4 border border-gray-100">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-3">
                                    Time Slots
                                  </h6>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                    {day.slots
                                      .slice(0, 6)
                                      .map((slot, slotIndex) => (
                                        <div
                                          key={slotIndex}
                                          className={`text-xs py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
                                            slot.status === "open"
                                              ? "bg-green-100 text-green-800 border border-green-200 shadow-sm"
                                              : slot.status === "booked"
                                              ? "bg-red-100 text-red-800 border border-red-200 shadow-sm"
                                              : slot.status === "held"
                                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"
                                              : "bg-gray-100 text-gray-600 border border-gray-200"
                                          }`}
                                        >
                                          {slot.start}
                                        </div>
                                      ))}
                                    {day.slots.length > 6 && (
                                      <div className="text-xs py-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 font-medium flex items-center justify-center">
                                        +{day.slots.length - 6} more
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-lg mb-2">
                            No schedules created yet
                          </p>
                          <p className="text-gray-400 mb-4">
                            Create your first availability schedule to start
                            accepting bookings
                          </p>
                          <button
                            onClick={() => setScheduleMode("builder")}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                          >
                            Create Schedule
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* My Schedules List */}
                  <div className="mt-8">
                    {mySchedulesLoading ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <span className="ml-3 text-gray-600">
                          Loading my schedules...
                        </span>
                      </div>
                    ) : mySchedules &&
                      mySchedules.schedulesByMonth &&
                      mySchedules.schedulesByMonth.length > 0 ? (
                      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 overflow-hidden">
                        {/* Header with gradient background */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 -m-8 mb-6 p-8 border-b border-gray-100">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <span className="text-blue-600">📅</span> My
                              Schedules
                            </h3>
                            <div className="flex items-center gap-8 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {mySchedules.summary?.totalSchedules || 0}
                                  </span>
                                </div>
                                <span className="text-gray-700 font-medium">
                                  Total
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {mySchedules.summary?.upcomingSchedules ||
                                      0}
                                  </span>
                                </div>
                                <span className="text-gray-700 font-medium">
                                  Upcoming
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {mySchedules.summary?.pastSchedules || 0}
                                  </span>
                                </div>
                                <span className="text-gray-700 font-medium">
                                  Past
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Debug logging */}
                        {console.log("Rendering mySchedules:", mySchedules)}

                        {/* Time Slots Legend */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">
                            Time Slots Status Legend
                          </h4>
                          <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded shadow-sm"></div>
                              <span className="text-sm text-gray-700">
                                Available
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded shadow-sm"></div>
                              <span className="text-sm text-gray-700">
                                Booked
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded shadow-sm"></div>
                              <span className="text-sm text-gray-700">
                                On Hold
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                              <span className="text-sm text-gray-700">
                                Blocked
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Schedules by Month */}
                        <div className="space-y-8">
                          {mySchedules.schedulesByMonth.map(
                            (monthGroup, monthIndex) => (
                              <div key={monthGroup.month} className="relative">
                                {/* Month Header */}
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2 rounded-xl shadow-sm">
                                    <h4 className="text-base font-semibold">
                                      {monthGroup.monthName}
                                    </h4>
                                  </div>
                                  <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                    {monthGroup.schedules.length} schedules
                                  </div>
                                </div>

                                {/* Schedules Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                  {monthGroup.schedules.map(
                                    (schedule, scheduleIndex) => (
                                      <div
                                        key={schedule._id}
                                        className={`relative border-2 rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                                          schedule.status === "past"
                                            ? "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                                            : "border-blue-200 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 hover:border-blue-300 hover:shadow-blue-100"
                                        }`}
                                      >
                                        {/* Status Badge */}
                                        <div className="absolute top-4 right-4">
                                          <span
                                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                                              schedule.status === "past"
                                                ? "bg-gray-200 text-gray-600"
                                                : "bg-green-100 text-green-700 shadow-sm"
                                            }`}
                                          >
                                            {schedule.status === "past"
                                              ? "COMPLETED"
                                              : "UPCOMING"}
                                          </span>
                                        </div>

                                        {/* Schedule Header */}
                                        <div className="mb-4">
                                          <h5 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-1">
                                            <span className="text-blue-600 text-sm">
                                              📆
                                            </span>
                                            {new Date(
                                              schedule.date
                                            ).toLocaleDateString("en-US", {
                                              weekday: "long",
                                            })}
                                          </h5>
                                          <p className="text-gray-600 font-medium text-sm">
                                            {new Date(
                                              schedule.date
                                            ).toLocaleDateString("en-US", {
                                              month: "long",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </p>
                                        </div>

                                        {/* Slots Summary */}
                                        <div className="mb-4">
                                          <div className="grid grid-cols-3 gap-4">
                                            <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                                              <div className="text-2xl font-bold text-blue-600">
                                                {schedule.totalSlots}
                                              </div>
                                              <div className="text-xs text-gray-600 font-medium">
                                                Total Slots
                                              </div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                                              <div className="text-2xl font-bold text-green-600">
                                                {schedule.openSlots}
                                              </div>
                                              <div className="text-xs text-gray-600 font-medium">
                                                Available
                                              </div>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg shadow-sm border">
                                              <div className="text-2xl font-bold text-orange-600">
                                                {schedule.bookedSlots}
                                              </div>
                                              <div className="text-xs text-gray-600 font-medium">
                                                Booked
                                              </div>
                                            </div>
                                          </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                          <button
                                            onClick={() =>
                                              handleEditSchedule(schedule)
                                            }
                                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200"
                                          >
                                            <span className="text-xs">✏️</span>{" "}
                                            Edit
                                          </button>
                                          {schedule.canDelete && (
                                            <button
                                              onClick={() =>
                                                openDeleteConfirmModal(schedule)
                                              }
                                              className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200"
                                            >
                                              <span className="text-xs">
                                                🗑️
                                              </span>{" "}
                                              Delete
                                            </button>
                                          )}
                                        </div>

                                        {/* Time Slots Preview */}
                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                          <h6 className="text-sm font-semibold text-gray-700 mb-3">
                                            Time Slots Preview
                                          </h6>
                                          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                            {schedule.slots
                                              .slice(0, 6)
                                              .map((slot, index) => (
                                                <div
                                                  key={index}
                                                  className={`text-xs py-2 rounded-lg font-medium transition-all flex items-center justify-center ${
                                                    slot.status === "open"
                                                      ? "bg-green-100 text-green-800 border border-green-200 shadow-sm"
                                                      : slot.status === "booked"
                                                      ? "bg-red-100 text-red-800 border border-red-200 shadow-sm"
                                                      : slot.status === "held"
                                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"
                                                      : "bg-gray-100 text-gray-600 border border-gray-200"
                                                  }`}
                                                >
                                                  {slot.start}
                                                </div>
                                              ))}
                                            {schedule.slots.length > 6 && (
                                              <div className="text-xs py-2 rounded-lg bg-blue-100 text-blue-700 border border-blue-200 font-medium flex items-center justify-center">
                                                +{schedule.slots.length - 6}{" "}
                                                more
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                        <div className="text-center py-12">
                          <div className="text-4xl mb-3 text-blue-600">📅</div>
                          <p className="text-gray-500 text-lg font-medium mb-2">
                            No schedules found
                          </p>
                          <p className="text-gray-400 text-sm">
                            Create your first schedule to get started!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {scheduleMode === "builder" && (
                <MentorAvailabilityBuilder
                  onBack={() => {
                    setScheduleMode("list");
                    setEditingSchedule(null);
                  }}
                  onSave={handleSaveEditedSchedule}
                  editingSchedule={editingSchedule}
                />
              )}

              {scheduleMode === "review" && selectedSchedule && (
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setScheduleMode("list")}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </button>
                      <h1 className="text-2xl font-semibold">
                        {selectedSchedule.name}
                      </h1>
                    </div>
                    <div className="flex gap-3">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Schedule
                      </button>
                      <button className="border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition font-medium flex items-center gap-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Publish
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                      <div>
                        <p className="text-sm text-gray-600">Created at</p>
                        <p className="font-medium">
                          {new Date(
                            selectedSchedule.createdAt
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {selectedSchedule.totalDays} day(s) •{" "}
                          {selectedSchedule.totalSlots} slots
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedSchedule.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedSchedule.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(selectedSchedule.availability)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([dateKey, timeSlots]) => (
                        <div key={dateKey} className="rounded-lg border p-4">
                          <div className="mb-3 font-medium">
                            {new Date(dateKey + "T00:00:00").toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "2-digit",
                              }
                            )}{" "}
                            ({dateKey})
                          </div>
                          <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
                            {timeSlots.map((time) => (
                              <div
                                key={time}
                                className="rounded-lg border px-3 py-2 text-sm text-center bg-blue-50 border-blue-200"
                              >
                                {time}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-600">
                    <p>
                      <strong>Tip:</strong> This schedule shows all your
                      available time slots. Students can book these slots for
                      mentoring sessions.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "response" && (
            <div className="space-y-6">
              {/* Booking Response Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 -m-8 mb-6 p-8 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <span className="text-indigo-600">📋</span> Booking
                          Requests
                        </h1>
                        <p className="text-gray-600">
                          Manage mentee booking requests for your available time
                          slots
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {
                                bookings.filter((b) => b.status === "pending")
                                  .length
                              }
                            </div>
                            <div className="text-xs text-orange-800 font-medium">
                              Pending
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                              {bookings.length}
                            </div>
                            <div className="text-xs text-indigo-800 font-medium">
                              Total
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-6">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setBookingFilter("all")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                          bookingFilter === "all"
                            ? "bg-indigo-100 text-indigo-700 shadow-sm border border-indigo-200"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <span className="w-2 h-2 bg-current rounded-full"></span>
                        All ({bookings.length})
                      </button>
                      <button
                        onClick={() => setBookingFilter("pending")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                          bookingFilter === "pending"
                            ? "bg-orange-100 text-orange-700 shadow-sm border border-orange-200"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <span className="w-2 h-2 bg-current rounded-full"></span>
                        Pending (
                        {bookings.filter((b) => b.status === "pending").length})
                      </button>
                      <button
                        onClick={() => setBookingFilter("accepted")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                          bookingFilter === "accepted"
                            ? "bg-green-100 text-green-700 shadow-sm border border-green-200"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <span className="w-2 h-2 bg-current rounded-full"></span>
                        Accepted (
                        {bookings.filter((b) => b.status === "active").length})
                      </button>
                      <button
                        onClick={() => setBookingFilter("declined")}
                        className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                          bookingFilter === "declined"
                            ? "bg-red-100 text-red-700 shadow-sm border border-red-200"
                            : "text-gray-600 hover:bg-gray-100 border border-gray-200"
                        }`}
                      >
                        <span className="w-2 h-2 bg-current rounded-full"></span>
                        Declined (
                        {
                          bookings.filter((b) => b.status === "cancelled")
                            .length
                        }
                        )
                      </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={loadMentorBookings}
                      disabled={bookingsLoading}
                      className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all duration-200 shadow-sm"
                    >
                      {bookingsLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          Refresh
                        </>
                      )}
                    </button>
                  </div>

                  {/* Booking List */}
                  <div className="space-y-4">
                    {(() => {
                      const filteredBookings = getFilteredBookings();
                      return filteredBookings.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-3xl">📋</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            {bookingFilter === "all"
                              ? "No booking requests yet"
                              : `No ${bookingFilter} booking requests`}
                          </h3>
                          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                            {bookingFilter === "all"
                              ? "When mentees book your available time slots, they will appear here for your review."
                              : `No booking requests with ${bookingFilter} status found.`}
                          </p>
                        </div>
                      ) : (
                        filteredBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl ${
                              booking.status === "pending"
                                ? "border-orange-200 bg-gradient-to-br from-orange-50/50 to-yellow-50/30 hover:border-orange-300"
                                : booking.status === "accepted"
                                ? "border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/30 hover:border-green-300"
                                : "border-red-200 bg-gradient-to-br from-red-50/50 to-pink-50/30 hover:border-red-300"
                            }`}
                          >
                            {/* Status Badge */}
                            <div className="flex justify-between items-start mb-4">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  booking.status === "pending"
                                    ? "bg-orange-100 text-orange-800"
                                    : booking.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {booking.status === "pending"
                                  ? "⏳ PENDING"
                                  : booking.status === "active"
                                  ? "✅ ACCEPTED"
                                  : booking.status === "cancelled"
                                  ? "❌ DECLINED"
                                  : "❓ " + booking.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  booking.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-start justify-between mb-6">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                    {booking.avatarUrl ? (
                                      <img
                                        src={booking.avatarUrl}
                                        alt={booking.menteeName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = "none";
                                          e.target.nextSibling.style.display =
                                            "flex";
                                        }}
                                      />
                                    ) : null}
                                    <span
                                      className="text-indigo-700 font-bold text-lg"
                                      style={{
                                        display: booking.avatarUrl
                                          ? "none"
                                          : "flex",
                                      }}
                                    >
                                      {booking.menteeName?.charAt(0) || "M"}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900">
                                      {booking.menteeName}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                      {booking.menteeEmail}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-4">
                                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <span className="text-blue-600">📅</span>
                                      <span className="font-medium">Date</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                      {new Date(
                                        booking.date
                                      ).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                      <span className="text-green-600">⏰</span>
                                      <span className="font-medium">Time</span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                      {booking.time}
                                    </span>
                                  </div>
                                </div>

                                {booking.message && (
                                  <div className="bg-white rounded-lg p-4 border border-gray-100 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                      <span className="text-purple-600">
                                        💬
                                      </span>
                                      <span className="font-medium">
                                        Message from Mentee
                                      </span>
                                    </div>
                                    <p className="text-gray-800 italic">
                                      "{booking.message}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            {booking.status === "pending" && (
                              <div className="flex justify-center gap-3 pt-4 border-t border-gray-200">
                                <button
                                  onClick={() =>
                                    handleAcceptBooking(booking.id)
                                  }
                                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() =>
                                    openDeclineConfirmModal(booking)
                                  }
                                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      );
                    })()}
                  </div>

                  {/* Information */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">
                          How booking requests work:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>
                            Mentees can book your available time slots from your
                            published schedule
                          </li>
                          <li>
                            You will receive notifications for new booking
                            requests
                          </li>
                          <li>
                            Accept or decline requests based on your
                            availability
                          </li>
                          <li>
                            Accepted bookings will be added to your calendar
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              {/* Reviews Section - TODO: Connect to real API for fetching mentor's reviews */}
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                {/* Header with review count and search/filter */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      My Reviews ({filteredReviews.length})
                    </h3>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search Reviews"
                      value={reviewSearchTerm}
                      onChange={(e) => {
                        setReviewSearchTerm(e.target.value);
                        setReviewCurrentPage(1); // Reset to page 1 when searching
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={reviewSortBy}
                      onChange={(e) => {
                        setReviewSortBy(e.target.value);
                        setReviewCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest</option>
                      <option value="highest-rating">Highest Rating</option>
                      <option value="lowest-rating">Lowest Rating</option>
                      <option value="most-helpful">Most Helpful</option>
                    </select>
                    <button
                      onClick={() => {
                        setReviewSearchTerm("");
                        setReviewSortBy("latest");
                        setReviewCurrentPage(1);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      Clear
                    </button>
                  </div>
                </div>

                {/* Reviews Grid - Dynamic rendering based on filtered data */}
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start content-start"
                  style={{ minHeight: "900px" }}
                >
                  {currentReviews.length > 0 ? (
                    currentReviews.map((review) => (
                      <div
                        key={review._id || review.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                      >
                        {/* Review Header */}
                        <div className="flex items-start gap-4 mb-4">
                          <img
                            src={
                              review.author?.avatarUrl ||
                              "/placeholder-avatar.jpg"
                            }
                            alt={
                              review.author
                                ? `${review.author.firstName} ${review.author.lastName}`
                                : "User"
                            }
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {review.author
                                    ? `${review.author.firstName || ""} ${
                                        review.author.lastName || ""
                                      }`.trim() || review.author.userName
                                    : "Unknown User"}
                                </h4>
                                <p className="text-sm text-blue-600 font-medium">
                                  {review.target?.name || "Unknown Course"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex text-yellow-400 text-sm">
                                  {"★".repeat(review.rate || 0)}
                                  {"☆".repeat(5 - (review.rate || 0))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {review.rate || 0}/5
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Review Content */}
                        <div className="mb-4">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {review.content}
                          </p>
                        </div>

                        {/* Review Footer */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V18m-7-8a2 2 0 01-2-2V6a2 2 0 012-2h2.343M11 7L9 5l2-2m0 4l2-2 2 2m-2 2h6"
                                />
                              </svg>
                              <span>{review.helpfulCount} found helpful</span>
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-blue-600 hover:text-blue-700 transition text-sm font-medium">
                              Reply
                            </button>
                            <button className="text-gray-500 hover:text-gray-700 transition text-sm">
                              Report
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-gray-500 text-lg mb-2">
                            No reviews found
                          </p>
                          <p className="text-gray-400">
                            Try adjusting your search criteria
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pagination - Dynamic based on filtered results */}
                {totalReviewPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-gray-200">
                    <button
                      onClick={() =>
                        handleReviewPageChange(reviewCurrentPage - 1)
                      }
                      disabled={reviewCurrentPage === 1}
                      className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    {[...Array(totalReviewPages)].map((_, index) => {
                      const page = index + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handleReviewPageChange(page)}
                          className={`px-3 py-1 rounded transition ${
                            reviewCurrentPage === page
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() =>
                        handleReviewPageChange(reviewCurrentPage + 1)
                      }
                      disabled={reviewCurrentPage === totalReviewPages}
                      className="p-2 hover:bg-gray-100 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeDeleteConfirmModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-red-600 text-xl">🗑️</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Confirm Delete Schedule
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this schedule?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 shadow-sm">
                  <p className="font-medium text-gray-900">
                    {deleteConfirmModal.scheduleName}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-6 flex gap-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteSchedule}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                Delete Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Booking Confirmation Modal */}
      {declineConfirmModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeDeclineConfirmModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-gray-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-red-600 text-xl">❌</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Decline Booking
                  </h3>
                  <p className="text-sm text-gray-600">
                    Confirm booking rejection
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to decline this booking request?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {declineConfirmModal.bookingInfo?.menteeName}
                    </p>
                    <p className="text-sm text-gray-600">
                      📅 {declineConfirmModal.bookingInfo?.date}
                    </p>
                    <p className="text-sm text-gray-600">
                      🕐 {declineConfirmModal.bookingInfo?.time}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decline Reason Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Decline Reason (Optional)
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason for declining this booking..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>This reason will be shared with the mentee</span>
                  <span>{declineReason.length}/500</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-6 flex gap-3">
              <button
                onClick={closeDeclineConfirmModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeclineBooking}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg"
              >
                Decline Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorProfile;