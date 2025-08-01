import publicClient from "../clients/public.client";

const userEndpoints = {
	signin: "user/signin",
	signup: "user/signup",
	signupMentor: "user/signupMentor",
	verifyEmail: "user/verify",
	resendVerificationEmail: "user/resend-verification-email",
	forgotPassword: "user/forgot-password",
	resetPassword: "user/reset-password",
};

export const authApi = {
	signin: (data) => publicClient.post(userEndpoints.signin, data),
	signup: (data) => publicClient.post(userEndpoints.signup, data),
	signupMentor: (data) => publicClient.post(userEndpoints.signupMentor, data),
	verifyEmail: (data) => publicClient.get(userEndpoints.verifyEmail, data),
	resendVerificationEmail: (data) =>
		publicClient.post(userEndpoints.resendVerificationEmail, data),
	forgotPassword: (data) =>
		publicClient.post(userEndpoints.forgotPassword, data),
	resetPassword: (data) =>
		publicClient.post(userEndpoints.resetPassword, data),
};
