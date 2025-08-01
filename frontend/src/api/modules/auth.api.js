import publicClient from "../clients/public.client";

const userEndpoints = {
	signin: "user/signin",
	signup: "user/signup",
	verifyEmail: "auth/verify",
	resendVerificationEmail: "auth/resend-verification-email",
	forgotPassword: "auth/forgot-password",
	resetPassword: "auth/reset-password",
};

export const authApi = {
	signin: (data) => publicClient.post(userEndpoints.signin, data),
	signup: (data) => publicClient.post(userEndpoints.signup, data),
	verifyEmail: (data) => publicClient.get(userEndpoints.verifyEmail, data),
	resendVerificationEmail: (data) =>
		publicClient.post(userEndpoints.resendVerificationEmail, data),
	forgotPassword: (data) =>
		publicClient.post(userEndpoints.forgotPassword, data),
	resetPassword: (data) =>
		publicClient.post(userEndpoints.resetPassword, data),
};
