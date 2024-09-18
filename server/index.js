const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const mqtt = require('mqtt');
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

//connect with mongoDB
mongoose.connect('mongodb+srv://pathakpriyanka774:l20Nys1ZLhf1Ezpx@chatapp.tj2i1.mongodb.net/ChatApp?retryWrites=true&w=majority').then(() =>
        app.listen(5000)).then(() => console.log("Connected To Database and listening To Localhost 5000"))
    .catch((err) => console.log(err));
app.get("/ping", (_req, res) => {
    return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

const server = app.listen(process.env.PORT, () =>
    console.log(`Server started on ${process.env.PORT}`)
);

// Debugging: Print MQTT credentials to console
console.log("MQTT_USERNAME:", process.env.MQTT_USERNAME);
console.log("MQTT_PASSWORD:", process.env.MQTT_PASSWORD);

const client = mqtt.connect('wss://49d84cd4714d4a25ad97ea906e7a7bb6.s1.eu.hivemq.cloud:8884/mqtt', {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
});
// Replace 'broker_ip_address' with your MQTT broker's IP address or hostname
//if (client) console.log("mqtt broker has been connected", client);
// Subscribe to a topic
client.on('connect', () => {
    client.subscribe('chat/messages');
    client.subscribe('msg-receive');
    client.subscribe('add-user');
    client.subscribe('send-msg');
});

// Handle incoming messages
client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    // Handle the message (e.g., send it to the frontend)
    client.subscribe('chat/messages', message.toString());

});
// client.on('message', async(topic, message) => {
//     const [_, username, statusType] = topic.split('/');
//     if (statusType === 'status') {
//         const status = message.toString();
//         await UserStatus.updateOne({ username }, { status, lastActive: new Date() }, { upsert: true });
//         console.log(`User ${username} is now ${status}`);
//     }
// });

// app.get('/users/online', async(req, res) => {
//     const onlineUsers = await UserStatus.find({ status: 'online' });
//     res.json(onlineUsers);
// });



// Close the MQTT client when done
process.on('SIGINT', () => {
    client.end();
});


// Store online users in a Map
global.onlineUsers = new Map();

// Handle MQTT client connection

client.on('error', (err) => {
    console.error('MQTT Error:', err);
});



//client.publish(JSON.stringify({ topic: 'chat/messages', msg: "Hii priya" }));

const publishMessage = (topic, msg) => {
    client.publish(topic, msg, (err) => {
        if (err) {
            console.error('Error publishing message:', err);
        } else {
            console.log('Message published successfully');
        }
    });
};

//publishMessage("chat/messages", "Please try to publish my message!!");