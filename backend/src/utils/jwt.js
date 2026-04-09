const jwt = require("jsonwebtoken");

const createToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const sendToken = (user, res) => {
  const token = createToken(user._id, user.email, user.role);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",   // ← change from strict to lax
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

module.exports = {
  createToken,
  sendToken
};