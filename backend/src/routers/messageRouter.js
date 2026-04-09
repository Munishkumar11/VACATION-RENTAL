const router = require("express").Router();
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  getConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
  deleteMessage,
} = require("../controllers/messageController");

router.get("/conversations", authMiddleware, getConversations);
router.get("/with/:userId", authMiddleware, getConversationMessages);
router.post("/", authMiddleware, sendMessage);
router.patch("/read/:userId", authMiddleware, markConversationRead);
router.delete("/:messageId", authMiddleware, deleteMessage);

module.exports = router;
