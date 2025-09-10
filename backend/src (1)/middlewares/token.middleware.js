import User from "../models/user.model.js";
import responseHandler from "../handlers/response.handler.js";
import jwt from "jsonwebtoken";

const tokenDecode = (req) => {
	try {
		const bearerHeader = req.headers["authorization"];
		console.log("Token Middleware - Authorization header:", bearerHeader);
		
		if (bearerHeader && bearerHeader.startsWith("Bearer ")) {
			const token = bearerHeader.split(" ")[1];
			console.log("Token Middleware - Extracted token:", token);
			
			const decoded = jwt.verify(token, process.env.JWT_SECRET);
			console.log("Token Middleware - Decoded successfully:", decoded);
			return decoded;
		} else {
			console.log("Token Middleware - No Bearer token found");
			return false;
		}
	} catch (error) {
		console.log("Token Middleware - JWT verification failed:", error.message);
		return false;
	}
};

const auth = async (req, res, next) => {
	const tokenDecoded = tokenDecode(req);
	
	console.log("Token Middleware - Headers:", req.headers.authorization);
	console.log("Token Middleware - Decoded token:", tokenDecoded);

	if (!tokenDecoded) {
		console.log("Token Middleware - No valid token found");
		return responseHandler.unauthorized(res);
	}

	const user = await User.findById(tokenDecoded.id);
	console.log("Token Middleware - User found:", user ? `Yes (${user.email})` : "No");
	console.log("Token Middleware - User isVerified:", user?.isVerified);
	
	if (!user || !user.isVerified) {
		console.log("Token Middleware - User not found or not verified");
		return responseHandler.unauthorized(res);
	}

	req.user = user;
	next();
};

export default { auth, tokenDecode };