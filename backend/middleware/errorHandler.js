// Unknown routes.
function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

// Last stop for any error. Never leak technical details to the user.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Broken JSON in the request body.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid request data.' });
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
}

module.exports = { notFound, errorHandler };
