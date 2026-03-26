function notFoundHandler(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || "Something went wrong. Please try again.",
    code: error.code || "SERVER_ERROR"
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
