import responseHandler from "../handlers/response.handler.js";

const authorizeRoles = (allowedRoles) => {
	return (req, res, next) => {
		const userrole = req.user?.role;
		if (!userrole || !allowedRoles.includes(userrole)) {
			return responseHandler.unauthorized(res);
		}
		next();
	};
};

export default authorizeRoles;