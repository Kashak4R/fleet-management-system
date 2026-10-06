export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.name === "ValidationError") {
    const message = Object.values(error.errors).map((item) => item.message).join(", ");
    return res.status(400).json({ message });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "value";
    return res.status(409).json({ message: `${field} already exists` });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ message: "Invalid record identifier" });
  }

  res.status(error.status || 500).json({ message: error.message || "Server error" });
}

