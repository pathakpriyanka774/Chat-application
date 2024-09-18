const Messages = require("../models/messageModel");

// Get Messages
module.exports.getMessages = async(req, res, next) => {
    try {
        const { from, to } = req.body;

        const messages = await Messages.find({
            users: {
                $all: [from, to],
            },
        }).sort({ updatedAt: 1 });
        console.log(messages);

        const projectedMessages = messages.map((msg) => {
            console.log("message ", msg);
            return {
                id: msg._id,
                fromSelf: msg.sender.toString() === from,
                message: msg.message.text,
            };
        });
        res.json(projectedMessages);
    } catch (ex) {
        next(ex);
    }
};

// Add Message
module.exports.addMessage = async(req, res, next) => {
    try {
        const { from, to, message, timestamp } = req.body;
        const data = await Messages.create({
            message: { text: message },
            users: [from, to],
            sender: from,
        });
        const lastMessage = await Messages.findOne({
            users: {
                $all: [from, to],
            },
        }).sort({ _id: -1 });
        console.log("lastmessage:", lastMessage);


        if (data) return res.json({ msg: "Message added successfully." });
        else return res.json({ msg: "Failed to add message to the database" });
    } catch (ex) {
        next(ex);
    }
};

// Delete Chat History
module.exports.deleteChatHistory = async(req, res, next) => {
    try {
        const { from, to } = req.body;

        // Delete messages for the specific chat
        await Messages.deleteMany({
            users: {
                $all: [from, to],
            },
        });

        res.status(200).json({ message: 'Chat history deleted successfully.' });
    } catch (ex) {
        next(ex);
    }
};

// Update Message
module.exports.updateMessage = async(req, res, next) => {
    try {
        const { id, message, from, to } = req.body;
        console.log("Req.body :", req.body);
        console.log("id ,message :", id, message);
        if (id == undefined) {
            const lastMessage = await Messages.findOne({
                users: {
                    $all: [from, to],
                },
            }).sort({ _id: -1 });
            console.log("lastmessage:", lastMessage._id);


            const updatedMessage = await Messages.findByIdAndUpdate(
                lastMessage._id, { "message.text": message }, { new: true }
            );
            console.log("updatedMessage :", updatedMessage);
            if (updatedMessage) return res.json({ msg: "Message updated successfully.", updatedMessage });
            else return res.status(404).json({ msg: "Message not found" });
        } else {
            const updatedMessage = await Messages.findByIdAndUpdate(
                id, { "message.text": message }, { new: true }
            );
            console.log("updatedMessage :", updatedMessage);
            if (updatedMessage) return res.json({ msg: "Message updated successfully.", updatedMessage });
            else return res.status(404).json({ msg: "Message not found" });
        }
    } catch (ex) {
        next(ex);
    }
};