const { addMessage, getMessages, deleteChatHistory, updateMessage } = require("../controllers/messageController");
const { verifyToken } = require("../controllers/userController");
const router = require("express").Router();

router.post("/addmsg", verifyToken, addMessage);
router.post("/getmsg", verifyToken, getMessages);
router.delete("/deletemsg", verifyToken, deleteChatHistory);
router.put("/updatemsg", verifyToken, updateMessage);

module.exports = router;