import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Upload, X, MessageCircle, Bell, Calendar, User } from 'lucide-react';
import { courseApi } from '../api/modules/course.api';
import { toast } from 'react-toastify';

const CreateCoursePage = () => {
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);
  const [fileError, setFileError] = useState('');

  // Validation schema
  const courseSchema = yup.object({
    title: yup.string().required('Title is required'),
    price: yup.number().typeError('Price must be a number').positive('Price must be positive').required('Price is required'),
    description: yup.string().required('Description is required'),
    lectures: yup.number().positive('Number of lectures must be positive').required('Lectures is required'),
    link: yup.string().url('Must be a valid URL').required('Course link is required'),
    files: yup.mixed().test('files-required', 'You need to upload file', () => {
      return uploadedFiles.length > 0;
    }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    trigger
  } = useForm({
    resolver: yupResolver(courseSchema)
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
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
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Also update the file input
      const imageInput = document.getElementById('course-image');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      imageInput.files = dataTransfer.files;
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setUploadedFiles(prev => {
      const newFiles = [...prev, ...files];
      // Trigger validation after updating files
      setTimeout(() => trigger('files'), 0);
      return newFiles;
    });
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      // Trigger validation after removing file
      setTimeout(() => trigger('files'), 0);
      return newFiles;
    });
  };

  const onSubmit = async (data) => {
    try {
      console.log('Form submitted with files:', uploadedFiles.length);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append course data
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });
      
      // Add default values for hidden fields
      formData.append('category', 'development');
      formData.append('lectures', '10');
      formData.append('link', 'https://example.com');
      formData.append('duration', '1'); // Default duration for backend requirement
      
      // Append course image if selected
      const imageInput = document.getElementById('course-image');
      if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }
      
      // Append additional files
      uploadedFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      console.log('Creating course with data:', data);
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      
      // Call API to create course
      const response = await courseApi.createCourse(formData);
      console.log('Course creation response:', response);
      
      toast.success('Course created successfully!');
      reset();
      setImagePreview(null);
      setUploadedFiles([]);
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
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Create New Course</h2>
        
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Left Column - Course Image */}
              <div className="space-y-4">
                <div className="relative">
                  <div 
                    className={`w-full h-72 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed transition-colors cursor-pointer ${
                      isImageDragOver 
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
                    <p className="text-sm font-medium text-gray-700 text-center">Course image</p>
                    <input
                      id="course-image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Course Details */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
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
                    Price
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

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Enter course description"
                    className="w-full px-0 py-3 text-gray-900 border-0 border-b border-gray-200 focus:border-blue-500 focus:ring-0 bg-transparent placeholder-gray-400 resize-none"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Upload files (Video/PDF/PNG/JPG)
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                  <Upload className="w-full h-full" />
                </div>
                <p className="text-gray-600 mb-2 text-lg">Drag file here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label
                  htmlFor="file-upload-button"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer transition-colors"
                >
                  Browse Files
                </label>
                <input
                  id="file-upload-button"
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.mp4,.avi,.mov"
                  onChange={(e) => {
                    setUploadedFiles(prev => {
                      const newFiles = [...prev, ...Array.from(e.target.files)];
                      // Trigger validation after updating files
                      setTimeout(() => trigger('files'), 0);
                      return newFiles;
                    });
                  }}
                  className="hidden"
                />
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                          <div className="w-4 h-4 bg-blue-500 rounded"></div>
                        </div>
                        <span className="text-sm text-gray-700">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* File Error Message */}
              {errors.files && (
                <p className="mt-2 text-sm text-red-600">{errors.files.message}</p>
              )}
            </div>

            {/* Hidden fields for required backend fields */}
            {/* Remove hidden fields since we're adding them directly in onSubmit */}

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
