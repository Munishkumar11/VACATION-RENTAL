const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,       // ✅ fixed
  api_key:    process.env.CLOUD_API_KEY,    // ✅ fixed
  api_secret: process.env.CLOUD_API_SECRET, // ✅ fixed
});

module.exports = cloudinary;
