const axios = require("axios");
const crypto = require("crypto");
const User = require("../models/userModel");
const { sendToken } = require("../utils/jwt");

const googleRedirect = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/google/callback`;

  if (!clientId) {
    return res.status(500).send("GOOGLE_CLIENT_ID is not configured.");
  }

  const state = req.query.role || "guest";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const role = req.query.state === "host" ? "host" : "guest";

    if (!code) {
      return res.status(400).send("Google authentication code is missing.");
    }

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      `${process.env.BACKEND_URL || "http://localhost:5000"}/auth/google/callback`;

    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).send("Unable to get Google access token.");
    }

    const profileResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { email, name, picture } = profileResponse.data;

    if (!email) {
      return res.status(400).send("Google did not return an email address.");
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        password: randomPassword,
        role,
        profilePic: picture || "",
        is_verified: true,
      });
    }

    sendToken(user, res);
    res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/`);
  } catch (error) {
    console.error("Google OAuth error:", error.response?.data || error.message);
    res
      .status(500)
      .send(
        "Google sign-in failed. " +
          (error.response?.data?.error_description || error.message)
      );
  }
};

module.exports = {
  googleRedirect,
  googleCallback,
};
