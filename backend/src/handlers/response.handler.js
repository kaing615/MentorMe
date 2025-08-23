const responseWithData = (res, statusCode, data) => {
  res.status(statusCode).json({
    data: data,
  });
};

const error = (res) =>
  responseWithData(res, 500, {
    status: 500,
    message: "Oops! Something went wrong",
    error: error,
  });

const badRequest = (res, message) =>
  responseWithData(res, 400, {
    status: 400,
    message: message || "Bad Request",
  });

const ok = (res, data) => responseWithData(res, 200, data);

const created = (res, data) => responseWithData(res, 201, data);

const unauthorized = (res, message) =>
  responseWithData(res, 401, {
    status: 401,
    message: message || "Unauthorized",
  });

const notFound = (res, message) =>
  responseWithData(res, 404, {
    status: 404,
    message: message || "Resource not found",
  });

const forbidden = (res, message) =>
  responseWithData(res, 403, {
    status: 403,
    message: message || "Forbidden",
  });

export default {
  error,
  badrequest: badRequest,
  ok,
  created,
  unauthorized,
  notfound: notFound,
  forbidden,
};
