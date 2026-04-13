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
  changeMyPassword,
} = require("../controllers/userController");

const { authMiddleware } = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const upload = require("../middlewares/upload");

const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authMiddleware, me);
router.put("/me", authMiddleware, upload.single("photo"), updateMyProfile);
router.put("/me/password", authMiddleware, changeMyPassword);
router.post("/me/cards", authMiddleware, addCard);
router.delete("/me/cards/:cardId", authMiddleware, deleteCard);
router.put("/me/bank", authMiddleware, updateBankDetails);

router.get("/", authMiddleware, adminMiddleware, getAllUsers);
router.put("/:id", authMiddleware, adminMiddleware, updateUser);
router.delete("/:id", authMiddleware, adminMiddleware, deleteUser);

module.exports = router;
