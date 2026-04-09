const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Authentication token missing",
      });
    }

    // jwt.verify throws if invalid, so no need to check `if (!decoded)`
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();

  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === "development") {
      console.log("AUTH ERROR:", error.message);
    }

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const isHost = (req, res, next) => {
  if (!req.user || req.user.role !== "host") {
    return res.status(403).json({
      message: "Access denied. Only host allowed",
    });
  }

  next();
};

module.exports = { authMiddleware, isHost };