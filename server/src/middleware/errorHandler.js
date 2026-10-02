'use strict';
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (process.env.NODE_ENV !== 'test') {
    console.error('[ERROR] ' + req.method + ' ' + req.originalUrl + ' -> ' + status + ': ' + message);
    if (status === 500) console.error(err.stack);
  }
  res.status(status).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
module.exports = errorHandler;