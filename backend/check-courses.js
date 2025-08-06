import mongoose from 'mongoose';
import Course from './src/models/course.model.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentorme')
  .then(async () => {
    console.log('Connected to DB');
    const courses = await Course.find({}).select('name price createdAt');
    console.log('Database courses:');
    courses.forEach(course => {
      console.log(`- ${course.name} ($${course.price}) - ${course.createdAt}`);
    });
    console.log(`\nTotal courses: ${courses.length}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
