import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MessageCircle, Bell, Calendar, User } from 'lucide-react';
import createCourseApi from '../api/modules/course.api';
import { toast } from 'react-toastify';

const CreateCoursePage = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState('');

  // Validation schema
  const courseSchema = yup.object({
    title: yup.string().required('Title is required'),
    price: yup.number().typeError('Price must be a number').positive('Price must be positive').required('Price is required'),
    courseOverview: yup.string().required('Course overview is required'),
    keyLearningObjectives: yup.string().required('Key learning objectives are required'),
    lectures: yup.number().typeError('Number of lectures must be a number').positive('Number of lectures must be positive').required('Number of lectures is required'),
    driveLink: yup.string().url('Must be a valid Google Drive URL').required('Google Drive link is required'),
    duration: yup.number().transform((value, originalValue) => {
      return originalValue === '' ? undefined : value;
    }).positive('Duration must be positive').optional().nullable(),
    category: yup.string().required('Category is required'),
    level: yup.string().required('Level is required'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: yupResolver(courseSchema)
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Please select a valid image file');
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image size must be less than 5MB');
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      
      setImageError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageDragOver = (e) => {
    e.preventDefault();
    setIsImageDragOver(true);
  };

  const handleImageDragLeave = (e) => {
    e.preventDefault();
    setIsImageDragOver(false);
  };

  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsImageDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files[0] && files[0].type.startsWith('image/')) {
      const file = files[0];
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image size must be less than 5MB');
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      
      setImageError('');
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Also update the file input
      const imageInput = document.getElementById('course-image');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;
    } else {
      setImageError('Please drop a valid image file');
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Validate image is required
      if (!imageFile) {
        setImageError('Course image is required');
        toast.error('Please select a course image');
        return;
      }
      
      
      // Prepare FormData for multipart/form-data
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('price', data.price);
      formData.append('category', data.category);
      formData.append('level', data.level);
      formData.append('lectures', data.lectures);
      formData.append('courseOverview', data.courseOverview);
      formData.append('keyLearningObjectives', data.keyLearningObjectives);
      formData.append('driveLink', data.driveLink);
      formData.append('thumbnail', imageFile);
      
      if (data.duration) {
        formData.append('duration', data.duration);
      }

      
      // Call API to create course
      const response = await createCourseApi.createCourse(formData);
      
      toast.success('Course created successfully!');
      reset();
      setImagePreview(null);
      setImageFile(null);
      setImageError('');
      // Chuyển hướng về trang My Courses sau khi tạo thành công
      setTimeout(() => {
        navigate('/mentor/profile', { state: { tab: 'mycourses' } });
      }, 800);
    } catch (error) {
      console.error('Error creating course:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Show more specific error message if available
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Error creating course. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-white-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Create New Course</h2>
        
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Course Image & Descriptions */}
              <div className="space-y-6">
                {/* Course Image */}
                <div className="relative">
                  <div 
                    className={`w-full h-72 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed transition-colors cursor-pointer ${
                      imageError
                        ? 'border-red-400 bg-red-50' 
                        : isImageDragOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleImageDragOver}
                    onDragLeave={handleImageDragLeave}
                    onDrop={handleImageDrop}
                    onClick={() => document.getElementById('course-image').click()}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Course preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 flex items-center justify-center relative">
                        {/* Anime character silhouette placeholder */}
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="relative z-10 text-center">
                          <div className="w-20 h-20 mx-auto mb-4 opacity-80">
                            <svg viewBox="0 0 100 100" className="w-full h-full text-white/60">
                              <circle cx="50" cy="35" r="15" fill="currentColor"/>
                              <path d="M25 85 Q50 60 75 85" stroke="currentColor" strokeWidth="8" fill="none"/>
                              <path d="M35 50 Q50 45 65 50" stroke="currentColor" strokeWidth="6" fill="none"/>
                            </svg>
                          </div>
                          <p className="text-white text-sm opacity-75">Click or drag image here</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 text-center">
                      Course Image <span className="text-red-500">*</span>
                    </p>
                    <input
                      id="course-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {imageError && (
                      <p className="mt-2 text-sm text-red-600 text-center">{imageError}</p>
                    )}
                  </div>
                </div>

                {/* Course Overview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Overview <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('courseOverview')}
                    rows={4}
                    placeholder="Provide a comprehensive overview of your course..."
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400 resize-none"
                  />
                  {errors.courseOverview && (
                    <p className="mt-1 text-sm text-red-600">{errors.courseOverview.message}</p>
                  )}
                </div>

                {/* Key Learning Objectives */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Key Learning Objectives <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register('keyLearningObjectives')}
                    rows={4}
                    placeholder="List the main objectives students will achieve..."
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400 resize-none"
                  />
                  {errors.keyLearningObjectives && (
                    <p className="mt-1 text-sm text-red-600">{errors.keyLearningObjectives.message}</p>
                  )}
                </div>
              </div>

              {/* Right Column - Course Details */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('title')}
                    placeholder="Enter course title"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('price')}
                      placeholder="Enter course price"
                      className="w-full px-0 py-3 pr-8 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                    />
                    <div className="absolute right-0 bottom-3 text-gray-500 font-medium">
                      $
                    </div>
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 text-gray-400 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 focus:text-gray-700"
                  >
                    <option value="">Select category</option>
                    <option value="Programming">Programming</option>
                    <option value="Design">Design</option>
                    <option value="Business">Business</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Photography">Photography</option>
                    <option value="Music">Music</option>
                    <option value="Health & Fitness">Health & Fitness</option>
                    <option value="Language">Language</option>
                    <option value="Academic">Academic</option>
                    <option value="Lifestyle">Lifestyle</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('level')}
                    className="w-full px-4 py-3 text-gray-400 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 focus:text-gray-700"
                  >
                    <option value="">Select level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  {errors.level && (
                    <p className="mt-1 text-sm text-red-600">{errors.level.message}</p>
                  )}
                </div>

                {/* Number of Lectures */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Lectures <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('lectures')}
                    placeholder="Enter number of lectures"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.lectures && (
                    <p className="mt-1 text-sm text-red-600">{errors.lectures.message}</p>
                  )}
                </div>

                {/* Duration (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours) <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="number"
                    {...register('duration')}
                    placeholder="Enter course duration in hours"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">{errors.duration.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Links Section */}
            <div className="mt-8">
              {/* Google Drive Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Drive Materials Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  {...register('driveLink')}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400"
                />
                {errors.driveLink && (
                  <p className="mt-1 text-sm text-red-600">{errors.driveLink.message}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Link to Google Drive folder containing course materials</p>
              </div>
            </div>
                
            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCoursePage;