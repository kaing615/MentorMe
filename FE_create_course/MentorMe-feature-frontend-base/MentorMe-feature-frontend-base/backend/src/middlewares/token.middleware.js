import User from "../models/user.model.js";
import responseHandler from "../handlers/response.handler.js";
import jwt from "jsonwebtoken";

const tokenDecode = (req) => {
	try {
		const bearerHeader = req.headers["authorization"];
		if (bearerHeader && bearerHeader.startsWith("Bearer ")) {
			const token = bearerHeader.split(" ")[1];
			return jwt.verify(token, process.env.JWT_SECRET);
		}
		return false;
	} catch {
		return false;
	}
};

const auth = async (req, res, next) => {
	const tokenDecoded = tokenDecode(req);

	if (!tokenDecoded) return responseHandler.unauthorized(res);

	const user = await User.findById(tokenDecoded.id);
	if (!user || !user.isVerified) return responseHandler.unauthorized(res);

	req.user = user;
	next();
};

export default { auth, tokenDecode };