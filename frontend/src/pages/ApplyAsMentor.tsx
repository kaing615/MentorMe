import React, { useState, useEffect } from "react";
import authApi from "../api/modules/auth.api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { MENTEE_PATH, MENTOR_PATH, PATH } from "../routes/path";
import profileApi from "../api/modules/profile.api";

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const ApplyAsMentor = () => {
  const navigate = useNavigate();
  const [existingUser] = useState<any>(getStoredUser);
  const isMenteeUpgrade =
    existingUser?.role === "mentee" &&
    Boolean(localStorage.getItem("actkn") || localStorage.getItem("token"));

  useEffect(() => {
    if (existingUser?.role === "mentor") {
      navigate(`${PATH.MENTOR}/${MENTOR_PATH.DASHBOARD}`);
    } else if (existingUser?.role === "admin") {
      navigate(PATH.ADMIN);
    }
  }, [existingUser, navigate]);
  const [formData, setFormData] = useState<any>({
    firstName: existingUser?.firstName || "",
    lastName: existingUser?.lastName || "",
    username: existingUser?.userName || "",
    email: existingUser?.email || "",
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

  const [profileImage, setProfileImage] = useState<any>(null);
  const [profileImageFile, setProfileImageFile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<any>(1);
  const [completedSteps, setCompletedSteps] = useState<any[]>([]);
  const [errors, setErrors] = useState<any>({});
  const [touched, setTouched] = useState<any>({});

  useEffect(() => {
    if (!isMenteeUpgrade) return;
    profileApi
      .getProfile()
      .then((response) => {
        const data = response?.data;
        const user = data?.user || existingUser;
        const profile = data?.profile || {};
        setFormData((current) => ({
          ...current,
          firstName: user?.firstName || "",
          lastName: user?.lastName || "",
          username: user?.userName || "",
          email: user?.email || "",
          jobTitle: profile.jobTitle || "",
          location: profile.location || user?.location || "",
          category: profile.category || "",
          skills: (profile.skills || user?.skills || []).join(", "),
          bio: profile.bio || user?.bio || "",
          linkedin: profile.links?.linkedin || user?.linkedinUrl || "",
          introVideo: profile.introVideo || user?.introVideo || "",
          reason: profile.mentorReason || user?.mentorReason || "",
          achievement:
            profile.greatestAchievement || user?.greatestAchievement || "",
        }));
        setProfileImage(user?.avatarUrl || null);
      })
      .catch(() => toast.error("Không thể tải thông tin hiện tại."));
  }, [existingUser, isMenteeUpgrade]);

  const validateStep1 = (validatePhoto = false) => {
    const newErrors: any = {};
    if (!formData.firstName.trim()) newErrors.firstName = "Input first name";
    if (!formData.lastName.trim()) newErrors.lastName = "Input last name";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!isMenteeUpgrade) {
      if (!formData.password) newErrors.password = "Password is required";
      if (!formData.confirmPassword)
        newErrors.confirmPassword = "Confirm password is required";
      if (
        formData.password &&
        formData.confirmPassword &&
        formData.password !== formData.confirmPassword
      )
        newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.jobTitle.trim()) newErrors.jobTitle = "Job title is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (validatePhoto && !profileImage)
      newErrors.photo = "Profile photo is required";
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors: any = {};
    if (!formData.category.trim()) newErrors.category = "Category is required";
    if (!formData.skills.trim()) newErrors.skills = "Skills are required";
    if (!formData.bio.trim()) newErrors.bio = "Bio is required";
    if (!formData.linkedin.trim())
      newErrors.linkedin = "LinkedIn Profile URL is required";
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors: any = {};

    if (formData.reason.trim() && formData.reason.trim().length < 50) {
      newErrors.reason = "Reason must be at least 50 characters if provided";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      let fieldError = {};
      if (currentStep === 1) {
        fieldError = validateStep1(false);
      } else if (currentStep === 2) {
        fieldError = validateStep2();
      } else if (currentStep === 3) {
        fieldError = validateStep3();
      }
      setErrors((prev) => ({ ...prev, [name]: fieldError[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    let fieldError = {};
    if (currentStep === 1) {
      fieldError = validateStep1(false);
    } else if (currentStep === 2) {
      fieldError = validateStep2();
    } else if (currentStep === 3) {
      fieldError = validateStep3();
    }
    setErrors((prev) => ({ ...prev, [name]: fieldError[name] }));
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = () => {
    let stepErrors = {};
    if (currentStep === 1) {
      stepErrors = validateStep1(true);
    } else if (currentStep === 2) {
      stepErrors = validateStep2();
    } else if (currentStep === 3) {
      stepErrors = validateStep3();
    }

    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);

      const touchedFields = {};
      Object.keys(stepErrors).forEach((key) => {
        touchedFields[key] = true;
      });
      setTouched((prev) => ({ ...prev, ...touchedFields }));
      return;
    }
    setErrors({});
    if (currentStep < 3) {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCompletedSteps((prev) =>
        prev.filter((step) => step !== currentStep - 1)
      );
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const step1Errors = validateStep1(true);
    const step2Errors = validateStep2();
    const step3Errors = validateStep3();

    const allErrors = { ...step1Errors, ...step2Errors, ...step3Errors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const touchedFields = {};
      Object.keys(allErrors).forEach((key) => {
        touchedFields[key] = true;
      });
      setTouched((prev) => ({ ...prev, ...touchedFields }));
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc!");
      return;
    }

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("userName", formData.username);
      if (!isMenteeUpgrade) {
        formDataToSend.append("email", formData.email);
        formDataToSend.append("password", formData.password);
        formDataToSend.append("confirmPassword", formData.confirmPassword);
      }
      formDataToSend.append("jobTitle", formData.jobTitle);
      formDataToSend.append("location", formData.location);

      formDataToSend.append("category", formData.category);
      formDataToSend.append("skills", formData.skills);
      formDataToSend.append("bio", formData.bio);
      formDataToSend.append("linkedinUrl", formData.linkedin);

      if (formData.introVideo.trim()) {
        formDataToSend.append("introVideo", formData.introVideo);
      }

      formDataToSend.append(
        "mentorReason",
        formData.reason.trim() ||
          "I want to share my knowledge and help others grow in their career"
      );
      formDataToSend.append(
        "greatestAchievement",
        formData.achievement.trim() ||
          "Continuous learning and professional development"
      );

      if (profileImageFile) {
        formDataToSend.append("avatar", profileImageFile);
      }

      const response = isMenteeUpgrade
        ? await authApi.applyMentor(formDataToSend)
        : await authApi.signupMentor(formDataToSend);

      if (isMenteeUpgrade) {
        toast.success("Hồ sơ mentor đã được gửi và đang chờ admin xét duyệt.");
        navigate("/home");
        return;
      }

      toast.success("Hồ sơ mentor đã được gửi. Bạn có thể đăng nhập với tài khoản mentee trong khi chờ duyệt.");
      navigate("/auth/signin");

      setFormData({
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
      setProfileImage(null);
      setProfileImageFile(null);
      setCurrentStep(1);
      setCompletedSteps([]);
      setErrors({});
      setTouched({});
    } catch (error) {
      if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error.response?.data?.data?.message) {
        toast.error(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại!");
      }
    }
  };

  const getStepCircleClass = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return "mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ui-accent)] text-sm font-bold text-white transition-colors";
    }

    if (stepId === currentStep) {
      return "mb-3 flex h-10 w-10 rotate-[-3deg] items-center justify-center rounded-[42%_58%_48%_52%] border-2 border-[var(--ui-highlight)] bg-[var(--ui-highlight-soft)] text-sm font-black text-[var(--ui-highlight-strong)] shadow-[3px_3px_0_var(--ui-accent)] transition-colors";
    }

    return "mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--ui-border)] bg-[var(--ui-surface)] text-sm font-bold text-[var(--ui-text-muted)] transition-colors";
  };

  const getStepTextClass = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return "text-[var(--ui-accent)] font-semibold text-sm text-center transition-colors";
    }

    if (stepId === currentStep) {
      return "text-[var(--ui-text)] font-semibold text-sm text-center transition-colors";
    }

    return "text-[var(--ui-text-muted)] font-medium text-sm text-center transition-colors";
  };

  const getConnectionLineClass = (fromStep) => {
    if (completedSteps.includes(fromStep)) {
      return "mx-2 mb-7 w-10 border-t-2 border-dashed border-[var(--ui-accent)] transition-colors sm:mx-4 sm:w-24 md:w-40";
    }

    return "mx-2 mb-7 w-10 border-t-2 border-dashed border-[var(--ui-border)] transition-colors sm:mx-4 sm:w-24 md:w-40";
  };

  const getStepContent = (stepId) => {
    if (completedSteps.includes(stepId)) {
      return "Done";
    }

    return stepId;
  };

  return (
    <div className="mentor-application-form flex min-h-[calc(100dvh-4rem)] flex-col bg-[var(--ui-page)] pb-16">
      <div title="Apply as a Mentor" className="ui-brand-hero relative mx-auto mt-8 w-[calc(100%-2rem)] max-w-3xl overflow-hidden p-6 sm:p-8 md:mt-12">
        <span aria-hidden="true" className="absolute -right-5 -top-8 h-28 w-28 rounded-full border-2 border-dashed border-yellow-300/60" />
        <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Your next chapter</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] text-white">Apply as a <span className="ui-marker text-blue-950">mentor</span></h1>
        <p className="mt-3 max-w-xl text-blue-100">Tell learners what you can help them achieve. Your application will be reviewed before the mentor role is activated.</p>
      </div>

      <div
        title="ActionProcess"
        className="mx-auto mb-8 mt-10 flex w-full max-w-3xl items-center justify-center px-4"
      >

        <div className="flex flex-col items-center">
          <div className={getStepCircleClass(1)}>{getStepContent(1)}</div>
          <span className={getStepTextClass(1)}>About you</span>
        </div>

        <div className={getConnectionLineClass(1)}></div>

        <div className="flex flex-col items-center">
          <div className={getStepCircleClass(2)}>{getStepContent(2)}</div>
          <span className={getStepTextClass(2)}>Profile</span>
        </div>

        <div className={getConnectionLineClass(2)}></div>

        <div className="flex flex-col items-center">
          <div className={getStepCircleClass(3)}>{getStepContent(3)}</div>
          <span className={getStepTextClass(3)}>Experience</span>
        </div>
      </div>

      {currentStep === 1 && (
        <div title="About Form" className="ui-card mx-auto flex w-[calc(100%-2rem)] max-w-3xl flex-col p-5 sm:p-8">
          <div
            title="Upload your profile picture"
            className="flex flex-col mt-[-5px]"
          >
            <label className="text-xl font-medium text-md w-full max-w-3xl mx-auto px-4 md:px-0 pb-2">
              Photo <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center justify-center md:justify-start max-w-3xl mx-auto px-4 md:px-0 gap-4 sm:gap-6 relative w-full">

              <div className="relative">
                <div
                  title="Profile Picture"
                  className="mb-4 flex h-40 w-40 rotate-[-1deg] items-center justify-center overflow-hidden rounded-[46%_54%_48%_52%] border-2 border-dashed border-[var(--ui-accent)] bg-[var(--ui-surface-muted)] shadow-[5px_6px_0_var(--ui-highlight)]"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-sm text-[var(--ui-text-muted)]">No Image</span>
                  )}
                </div>
              </div>

              <div className="mb-4 flex flex-col">
                <input
                  type="file"
                  id="photoUpload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="photoUpload"
                  className="ui-button-highlight flex cursor-pointer items-center gap-2 px-4 py-2.5 font-black text-blue-950"
                >
                  <span className="font-medium">Upload a photo</span>
                </label>
                {errors.photo && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.photo}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            title="Hold input fields for mentor details"
            className="flex flex-col w-full max-w-3xl mx-auto px-4 md:px-0"
          >
            <label className="block mb-1 text-lg font-medium text-left">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 mb-4 gap-4">
              <div className="flex flex-col">
                <input
                  type="text"
                  name="firstName"
                  aria-label="First name"
                  value={formData.firstName}
                  placeholder="First Name"
                  className={`p-2 border rounded-[9px] h-[52px] focus:outline-none ${
                    errors.firstName && touched.firstName
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.firstName && touched.firstName && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <input
                  type="text"
                  name="lastName"
                  aria-label="Last name"
                  value={formData.lastName}
                  placeholder="Last Name"
                  className={`p-2 border rounded-[9px] h-[52px] focus:outline-none ${
                    errors.lastName && touched.lastName
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.lastName && touched.lastName && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>

            <label className="block mb-1 text-lg font-medium text-left">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col mb-4">
              <input
                type="text"
                name="username"
                aria-label="Username"
                value={formData.username}
                placeholder="Username"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.username && touched.username
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
                readOnly={isMenteeUpgrade}
              />
              {errors.username && touched.username && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.username}
                </span>
              )}
            </div>

            <label className="block mb-1 text-lg font-medium text-left">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col mb-4">
              <input
                type="text"
                name="email"
                aria-label="Email"
                value={formData.email}
                placeholder="Email ID"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.email && touched.email
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
                readOnly={isMenteeUpgrade}
              />
              {errors.email && touched.email && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.email}
                </span>
              )}
            </div>

            {!isMenteeUpgrade && (
              <div className="grid grid-cols-1 sm:grid-cols-2 mb-4 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-lg font-medium text-left">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  placeholder="Password"
                  className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                    errors.password && touched.password
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.password && touched.password && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="confirmPassword" className="text-lg font-medium text-left">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  placeholder="Confirm Password"
                  className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                    errors.confirmPassword && touched.confirmPassword
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 mb-4 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="jobTitle" className="text-lg font-medium text-left">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  placeholder="Job Title"
                  className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                    errors.jobTitle && touched.jobTitle
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.jobTitle && touched.jobTitle && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.jobTitle}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="location" className="text-lg font-medium text-left">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  placeholder="Location"
                  className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                    errors.location && touched.location
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.location && touched.location && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.location}
                  </span>
                )}
              </div>
            </div>

            <div title="Next Step Button" className="flex justify-end">
              <button
                onClick={handleNextStep}
                disabled={currentStep >= 3}
                className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep >= 3 || Object.keys(validateStep1()).length > 0
                    ? "bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)] cursor-not-allowed"
                    : "bg-[var(--ui-accent-fill)] text-white hover:bg-[var(--ui-accent-fill-hover)] shadow-[3px_4px_0_var(--ui-highlight)]"
                }`}
              >
                <span className="font-bold">
                  {currentStep >= 3 ? "Complete" : "Next Step"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div
          title="Profile Form"
          className="ui-card mx-auto flex w-[calc(100%-2rem)] max-w-3xl flex-col p-5 transition-all duration-500 ease-in-out sm:p-8"
        >
          <div>
            <label className="block mb-1 text-lg font-medium text-left">
              Categories <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col mb-4">
              <select
                name="category"
                aria-label="Expertise category"
                value={formData.category}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-2 border rounded-[9px] h-[52px] focus:outline-none ${
                  errors.category && touched.category
                    ? "border-red-500"
                    : "border-gray-300"
                } ${formData.category ? "text-[var(--ui-text)]" : "text-[var(--ui-text-muted)]"}`}
              >
                <option value="">Select your expertise</option>
                <option value="web-development">Web Development</option>
                <option value="data-science">Data Science</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
              {errors.category && touched.category && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.category}
                </span>
              )}
            </div>

            <label className="block text-lg font-medium text-left">
              Skills <span className="text-red-500">*</span>
            </label>
            <div className="mb-0 flex flex-col">
              <input
                type="text"
                name="skills"
                aria-label="Skills"
                value={formData.skills}
                placeholder="e.g. JavaScript, React, Node.js"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.skills && touched.skills
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.skills && touched.skills && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.skills}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Describe your expertise to connect with mentees who have similar
              interests.
              <br />
              Comma-separated list of your skills (keep it below 10). Mentees
              will use this to find you.
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              Bio <span className="text-red-500">*</span>
            </label>
            <div className="mb-0 flex flex-col">
              <textarea
                name="bio"
                aria-label="Biography"
                value={formData.bio}
                placeholder="Tell us about yourself..."
                className={`p-2 border rounded-[9px] h-[120px] w-full focus:outline-none resize-none ${
                  errors.bio && touched.bio
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.bio && touched.bio && (
                <span className="text-red-500 text-sm mt-1">{errors.bio}</span>
              )}
            </div>
            <span className="text-sm text-gray-500 mb-5">
              Tell us (and your mentees) a little bit about yourself.
              <br />
              Talk about yourself in the first person, as if you'd directly talk
              to a mentee. This will be public.
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              LinkedIn Profile URL <span className="text-red-500">*</span>
            </label>
            <div className="mb-4 flex flex-col">
              <input
                type="text"
                name="linkedin"
                aria-label="LinkedIn profile URL"
                value={formData.linkedin}
                placeholder="https://www.linkedin.com/in/your-profile"
                className={`p-2 border rounded-[9px] h-[52px] w-full focus:outline-none ${
                  errors.linkedin && touched.linkedin
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.linkedin && touched.linkedin && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.linkedin}
                </span>
              )}
            </div>

            <div className="flex gap-4 mt-2">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep <= 1}
                className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep <= 1
                    ? "bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)] cursor-not-allowed"
                    : "border-2 border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:border-[var(--ui-accent)]"
                }`}
              >
                <span className="font-bold">Previous Step</span>
              </button>

              <button
                onClick={handleNextStep}
                disabled={currentStep >= 3}
                  className={`flex items-center text-left py-3 px-6 sm:ml-auto mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep >= 3 || Object.keys(validateStep2()).length > 0
                    ? "bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)] cursor-not-allowed"
                    : "bg-[var(--ui-accent-fill)] text-white hover:bg-[var(--ui-accent-fill-hover)] shadow-[3px_4px_0_var(--ui-highlight)]"
                }`}
              >
                <span className="font-bold">
                  {currentStep >= 3 ? "Complete" : "Next Step"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div
          title="Experience Form"
          className="ui-card mx-auto flex w-[calc(100%-2rem)] max-w-3xl flex-col p-5 transition-all duration-500 ease-in-out sm:p-8"
        >
          <div>
            <label className="block mt-2 text-lg font-medium text-left">
              Intro video{" "}
              <label className="text-slate-400 text-[15px]">(Optional)</label>
            </label>
            <div className="flex flex-col mb-0">
              <input
                type="text"
                name="introVideo"
                aria-label="Intro video URL"
                value={formData.introVideo}
                placeholder="https://your-intro-video-URL"
                className="p-2 border border-gray-300 rounded-[9px] h-[52px] w-full focus:outline-none"
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </div>
            <span className="text-sm text-gray-500 mb-4">
              Add a YouTube video or record a Loom for your future mentees
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              Why do you want to become a mentor? (Not publicly visible)
            </label>
            <div className="mb-0 flex flex-col">
              <textarea
                name="reason"
                aria-label="Reason for becoming a mentor"
                value={formData.reason}
                placeholder="Tell us why you want to become a mentor... (minimum 50 characters)"
                className={`p-2 border rounded-[9px] h-[120px] w-full focus:outline-none resize-none ${
                  errors.reason && touched.reason
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.reason && touched.reason && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.reason}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500 mb-4">
              This field is optional. If provided, please write at least 50
              characters.
            </span>

            <label className="block mt-2 text-lg font-medium text-left">
              What, in your opinion, has been your greatest achievement so far?{" "}
              <br />
              (Not publicly visible)
            </label>
            <div className="mb-2 flex flex-col">
              <textarea
                name="achievement"
                aria-label="Greatest achievement"
                value={formData.achievement}
                placeholder="Describe your greatest achievement..."
                className={`p-2 border rounded-[9px] h-[120px] w-full focus:outline-none resize-none ${
                  errors.achievement && touched.achievement
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.achievement && touched.achievement && (
                <span className="text-red-500 text-sm mt-1">
                  {errors.achievement}
                </span>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handlePreviousStep}
                disabled={currentStep <= 1}
                className={`flex items-center text-left py-3 px-6 mb-3.5 gap-2 rounded-lg border-0 cursor-pointer transition-colors duration-200 ${
                  currentStep <= 1
                    ? "bg-[var(--ui-surface-muted)] text-[var(--ui-text-muted)] cursor-not-allowed"
                    : "border-2 border-dashed border-[var(--ui-border-strong)] bg-[var(--ui-surface)] text-[var(--ui-text)] hover:border-[var(--ui-accent)]"
                }`}
              >
                <span className="font-bold">Previous Step</span>
              </button>

              <button
                onClick={handleSubmit}
                className="ui-button-highlight mb-3.5 flex items-center gap-2 px-6 py-3 text-left font-black text-blue-950 sm:ml-auto"
              >
                <span className="font-bold">Submit Application</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyAsMentor;
