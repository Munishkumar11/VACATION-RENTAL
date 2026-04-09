const hostMiddleware = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "host") {
      return res.status(403).json({
        success: false,
        message: "Host access required"
      });
    }
  
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = hostMiddleware;