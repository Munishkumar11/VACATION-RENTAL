const router = require("express").Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getNotifications,
  dismissNotification,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getNotifications);
router.delete("/:notificationId", authMiddleware, dismissNotification);

module.exports = router;
