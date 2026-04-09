const {
  register,
  login,
  logout,
  me,
  getAllUsers,
  updateUser,
  deleteUser,
  updateMyProfile,
  addCard,
  deleteCard,
  updateBankDetails,
} = require("../controllers/userController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/upload"); // ✅ ADD THIS

const router = require("express").Router();

// ── Public routes ─────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ── Logged-in user ───────────────────────
router.get("/me", authMiddleware, me);
router.put("/me", authMiddleware, upload.single("photo"), updateMyProfile);
router.post("/me/cards", authMiddleware, addCard);
router.delete("/me/cards/:cardId", authMiddleware, deleteCard);
router.put("/me/bank", authMiddleware, updateBankDetails);

// ── Admin only ───────────────────────────
router.get("/", authMiddleware, adminMiddleware, getAllUsers);
router.put("/:id", authMiddleware, adminMiddleware, updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

module.exports = router;