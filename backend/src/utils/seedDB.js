import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Profile from '../models/profile.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mentorme';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({});
  await Profile.deleteMany({});

  const user = await User.create({
    userName: 'mentee1',
    firstName: 'Test',
    lastName: 'Mentee',
    email: 'mentee1@example.com',
    password: '123456', // Lưu ý: plain text, chỉ dùng test
    role: 'mentee',
    isVerified: true
  });

  await Profile.create({
    user: user._id,
    bio: 'Tell us about yourself and your goals',
    headline: 'Your professional headline',
    avatarUrl: '',
    links: {
      website: 'https://khoa.com',
      twitter: 'https://khoa.com/username',
      linkedin: 'https://khoa.com/in/username',
      facebook: 'https://khoa.com/username'
    },
    languages: ['Vietnamese', 'English'],
    timezone: 'GMT+7'
  });

  console.log('Seeded test user and profile!');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });