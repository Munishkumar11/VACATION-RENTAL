const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ✅ Test Cloudinary connection
cloudinary.api.ping((error, result) => {
  if (error) {
    console.log("CLOUDINARY ERROR:", error.message);
  } else {
    console.log("CLOUDINARY CONNECTED ✅");
  }
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "homehaven",
    allowedFormats: ["jpg", "png", "jpeg", "webp"],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
