import mongoose from "mongoose";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import Course from "../models/course.model.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mentorme";

async function seed() {
  await mongoose.connect(MONGO_URI);

  // Remove old data
  await User.deleteMany({});
  await Profile.deleteMany({});
  await Course.deleteMany({});

  // Create mentor user
  const mentor = await User.create({
    email: "mentor@example.com",
    userName: "mentor1",
    firstName: "Mentor",
    lastName: "One",
    password: "123456",
    role: "mentor",
    isVerified: true,
    avatarUrl: "https://i.pravatar.cc/150?img=1",
  });

  // Create mentor profile
  await Profile.create({
    user: mentor._id,
    jobTitle: "Senior Developer",
    location: "Hanoi",
    category: "Programming",
    bio: "Experienced mentor in web development.",
    headline: "Web Dev Mentor",
    skills: ["JavaScript", "React", "Node.js"],
    links: {
      website: "https://mentor1.dev",
      linkedin: "https://linkedin.com/in/mentor1",
      github: "https://github.com/mentor1",
      youtube: "https://youtube.com/mentor1",
      facebook: "https://facebook.com/mentor1",
    },
  });

  // Create a course
  await Course.create({
    title: "React for Beginners",
    description: "Learn React from scratch.",
    price: 49,
    mentor: mentor._id,
    category: "Programming",
    duration: 10,
    rate: 5,
    numberOfRatings: 10,
    link: "https://course-link.com/react",
    lectures: 20,
    thumbnail: "https://i.imgur.com/thumbnail.png",
  });

  console.log("Seed data created!");
  await mongoose.disconnect();
}

seed();
