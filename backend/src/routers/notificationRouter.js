const router = require("express").Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getNotifications,
  dismissNotification,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsAsRead);
router.delete("/:notificationId", authMiddleware, dismissNotification);

module.exports = router;
