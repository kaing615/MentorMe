import React, { useState, useEffect } from "react";
import { IoArrowForward, IoCloudUpload, IoCheckmark } from "react-icons/io5";

const ApplyAsMentor = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    jobTitle: "",
    location: "",
    category: "",
    skills: "",
    bio: "",
    linkedin: "",
    introVideo: "",
    reason: "",
    achievement: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (profileImage) {
      setFormData((prev) => ({ ...prev, photo: profileImage }));
    }
  }, [profileImage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý khi chọn ảnh
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please upload a valid image file.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("Image size should be less than 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý chuyển bước tiếp theo
  const handleNextStep = () => {
    if (currentStep < 3) {
      // Mark current step as completed
      setCompletedSteps((prev) => [...prev, currentStep]);

      // Move to next step
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Xử lý quay lại bước trước
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      // Remove current step from completed steps
      setCompletedSteps((prev) =>
        prev.filter((step) => step !== currentStep - 1)
      );

      // Move to previous step
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Lấy class CSS cho vòng tròn step
  const getStepCircleClass = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return "flex items-center justify-center w-20 h-20 rounded-full bg-green-600 text-white font-bold text-2xl mb-4 transition-all duration-500 ease-in-out";
    }

    if (stepId === currentStep) {
      return "flex items-center justify-center w-20 h-20 rounded-full bg-blue-600 text-white font-bold text-2xl mb-4 transition-all duration-500 ease-in-out";
    }

    return "flex items-center justify-center w-20 h-20 rounded-full border-2 border-gray-300 text-gray-400 font-bold text-2xl mb-4 transition-all duration-500 ease-in-out";
  };

  // Lấy class CSS cho text step
  const getStepTextClass = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return "text-green-600 font-semibold text-lg transition-colors duration-500";
    }

    if (stepId === currentStep) {
      return "text-blue-600 font-semibold text-lg transition-colors duration-500";
    }

    return "text-gray-400 font-medium text-lg transition-colors duration-500";
  };

  // Lấy class CSS cho đường nối
  const getConnectionLineClass = (fromStep) => {
    if (completedSteps.includes(fromStep)) {
      return "w-55 h-1 bg-green-500 mx-6 mt-[-32px] transition-all duration-700 ease-in-out";
    }

    return "w-55 h-1 bg-gray-300 mx-6 mt-[-32px] transition-all duration-700 ease-in-out";
  };

  // Lấy nội dung hiển thị trong vòng tròn
  const getStepContent = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return <IoCheckmark size={50} />;
    }

    return stepId;
  };
  return (
    <div className="flex flex-col">
      <div title="Apply as a Mentor" className="pt-20 pl-92">
        <h1 className="text-4xl font-bold mb-4">Apply as a Mentor</h1>
      </div>

      <div
        title="ActionProcess"
        className="flex items-center justify-center mb-[9px] mt-8"
      >
        {/* Step 1: About you */}
        <div className="flex flex-col items-center">
          <div className={getStepCircleClass(1)}>{getStepContent(1)}</div>
          <span className={getStepTextClass(1)}>About you</span>
        </div>

        {/* Line 1 */}
        <div className={getConnectionLineClass(1)}></div>

        {/* Step 2: Profile */}
        <div className="flex flex-col items-center">
          <div className={getStepCircleClass(2)}>{getStepContent(2)}</div>
          <span className={getStepTextClass(2)}>Profile</span>
        </div>

        {/* Line 2 */}
        <div className={getConnectionLineClass(2)}></div>

        {/* Step 3: Experience */}
        <div className="flex flex-col items-center">
          <div className={getStepCircleClass(3)}>{getStepContent(3)}</div>
          <span className={getStepTextClass(3)}>Experience</span>
        </div>
      </div>

      {/* Conditional Form Rendering */}
      {currentStep === 1 && (
        <div title="About Form" className="flex flex-col">
          <div
            title="Upload your profile picture"
            className="flex flex-col mt-[-5px]"
          >
            <label className="text-xl font-medium text-md pl-100 pb-2">
              Photo
            </label>
            <div className="flex items-center ml-98 gap-6">
              {/* Profile Picture Circle */}
              <div
                title="Profile Picture"
                className="flex items-center justify-center w-40 h-40 rounded-full border-2 border-gray-300 mb-4 overflow-hidden bg-gray-50"
              >
                {profileImage ? (
                  <>
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                    <button
                      className="text-sm text-red-500 underline mt-2"
                      onClick={() => setProfileImage(null)}
                    >
                      Remove Photo
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400 text-sm">No Image</span>
                )}
              </div>

              {/* Upload Button */}
              <div className="mb-4">
                <input
                  type="file"
                  id="photoUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photoUpload"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors duration-200"
                >
                  <IoCloudUpload size={20} />
                  <span className="font-medium">Upload a photo</span>
                </label>
              </div>
            </div>
          </div>

          <div
            title="Hold input fields for mentor details"
            className="flex flex-col pl-100"
          >
            <label className="block mb-1 text-lg font-medium text-left">
              Full Name
            </label>
            <div alt="Full Name" className="flex flex-row mb-4 gap-6">
              <input
                type="text"
                placeholder="First Name"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[330px] focus:outline-none"
                onChange={handleChange}
              />
              <input
                type="text"
                placeholder="Last Name"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[345px] focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <label className="block mb-1 text-lg font-medium text-left">
              Username
            </label>
            <div alt="Username" className="mb-4">
              <input
                type="text"
                placeholder="Username"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <label className="block mb-1 text-lg font-medium text-left">
              Email
            </label>
            <div alt="Email" className="mb-4">
              <input
                type="text"
                placeholder="Email ID"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-row mb-1 gap-69.5">
              <label className="text-lg font-medium text-left">Password</label>
              <label className="text-lg font-medium text-left">
                Confirm Password
              </label>
            </div>
            <div alt="Password" className="flex flex-row mb-4 gap-6">
              <input
                type="password"
                placeholder="Password"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[330px] focus:outline-none"
                onChange={handleChange}
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[345px] focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-row mb-1 gap-69.5">
              <label className="text-lg font-medium text-left">Job Title</label>
              <label className="text-lg font-medium text-left">Location</label>
            </div>
            <div
              alt="Job title and location"
              className="flex flex-row mb-4 gap-6"
            >
              <input
                type="text"
                placeholder="Job Title"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[330px] focus:outline-none"
                onChange={handleChange}
              />
              <input
                type="text"
                placeholder="Location"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[345px] focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <div title="Next Step Button" className="flex pl-137.5">
              <button
                onClick={handleNextStep}
                disabled={currentStep >= 3}
                className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep >= 3
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                <span className="font-bold">
                  {currentStep >= 3 ? "Complete" : "Next Step"}
                </span>
                <IoArrowForward className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div
          title="Profile Form"
          className="flex flex-col pl-100 transition-all duration-500 ease-in-out"
        >
          <div>
            <label className="block mb-1 text-lg font-medium text-left">
              Categories
            </label>
            <select className="mb-4 w-[699px] p-2 border border-gray-300 rounded-[9px] h-[52px] focus:outline-none text-slate-500">
              <option value="">Select your expertise</option>
              <option value="web-development">Web Development</option>
              <option value="data-science">Data Science</option>
              <option value="design">Design</option>
              <option value="marketing">Marketing</option>
              <option value="other">Other</option>
            </select>

            <label className="block text-lg font-medium text-left">
              Skills
            </label>
            <div className="mb-0">
              <input
                type="text"
                placeholder="e.g. JavaScript, React, Node.js"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none"
                onChange={handleChange}
              />
            </div>
            <span className="text-sm text-gray-500">
              Describe your expertise to connect with mentees who have similar
              interests.
              <br />
              Comma-separated list of your skills (keep it below 10). Mentees
              will use this to find you.
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              Bio
            </label>
            <div className="mb-0">
              <textarea
                placeholder="Tell us about yourself..."
                className="p-2 border border-gray-300 rounded-[9px] h-[120px] w-[699px] focus:outline-none resize-none"
                onChange={handleChange}
              />
            </div>
            <span className="text-sm text-gray-500 mb-5">
              Tell us (and your mentees) a little bit about yourself.
              <br />
              Talk about yourself in the first person, as if you'd directly talk
              to a mentee. This will be public.
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              LinkedIn Profile URL
            </label>
            <div className="mb-4">
              <input
                type="text"
                placeholder="https://www.linkedin.com/in/your-profile"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none"
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 mt-2">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep <= 1}
                className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep <= 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                <span className="font-bold">Previous Step</span>
                <IoArrowForward className="text-lg rotate-180" />
              </button>

              <button
                onClick={handleNextStep}
                disabled={currentStep >= 3}
                className={`flex items-center text-left py-3 px-6 ml-90 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep >= 3
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                <span className="font-bold">
                  {currentStep >= 3 ? "Complete" : "Next Step"}
                </span>
                <IoArrowForward className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div
          title="Experience Form"
          className="flex flex-col pl-101 transition-all duration-500 ease-in-out"
        >
          <div>
            <label className="block mt-2 text-lg font-medium text-left">
              Intro video{" "}
              <label className="text-slate-400 text-[15px]">(Optional)</label>
            </label>
            <div>
              <input
                type="text"
                placeholder="https://your-intro-video-URL"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-[699px] focus:outline-none"
                onChange={handleChange}
              />
            </div>
            <span className="text-sm text-gray-500">
              Add a YouTube video or record a Loom for your future mentees
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              Why do you want to become a mentor? (Not publicly visible)
            </label>
            <div className="mb-0">
              <textarea className="p-2 border border-gray-300 rounded-[9px] h-[120px] w-[699px] focus:outline-none resize-none" />
            </div>

            <label className="block mt-2 text-lg font-medium text-left">
              What, in your opinion, has been your greatest achievement so far?{" "}
              <br />
              (Not publicly visible)
            </label>
            <div className="mb-2">
              <textarea className="p-2 border border-gray-300 rounded-[9px] h-[120px] w-[699px] focus:outline-none resize-none" />
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep <= 1}
                className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep <= 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-slate-950 text-white hover:bg-slate-800"
                }`}
              >
                <span className="font-bold">Previous Step</span>
                <IoArrowForward className="text-lg rotate-180" />
              </button>

              <button className="flex items-center ml-72 bg-green-600 text-white text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer hover:bg-green-700 transition-colors duration-200">
                <span className="font-bold">Submit Application</span>
                <IoCheckmark className="text-lg" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyAsMentor;
