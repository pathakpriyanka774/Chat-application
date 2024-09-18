const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
console.log(process.env.jwtSecretToken);
const crypto = require('crypto');
let token = "";
//const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log("jwtSecret:", process.env.jwt_Secret);
module.exports.login = async(req, res, next) => {
    console.log("REQ", req, res);
    try {

        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user)
            return res.json({ msg: "Incorrect Username or Password", status: false });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid)
            return res.json({ msg: "Incorrect Username or Password", status: false });

        // Generate JWT token
        const payload = { id: user._id };
        token = jwt.sign(payload, process.env.jwt_Secret, { expiresIn: '2h' });
        console.log("TOKEN :", token);
        // Exclude password from the user object
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        return res.json({ status: true, user: userWithoutPassword, token: token });
    } catch (ex) {
        next(ex);
    }
};

module.exports.register = async(req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const usernameCheck = await User.findOne({ username });
        if (usernameCheck)
            return res.json({ msg: "Username already used", status: false });
        const emailCheck = await User.findOne({ email });
        if (emailCheck)
            return res.json({ msg: "Email already used", status: false });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            username,
            password: hashedPassword,
        });
        delete user.password;
        return res.json({ status: true, user });
    } catch (ex) {
        next(ex);
    }
};

module.exports.getAllUsers = async(req, res, next) => {
    try {
        const users = await User.find({ _id: { $ne: req.params.id } }).select([
            "email",
            "username",
            "avatarImage",
            "_id",
        ]);
        return res.json(users);
    } catch (ex) {
        next(ex);
    }
};

module.exports.getsearchUser = async(req, res, next) => {
    try {
        const searchTerm = req.query.searchQuery; // Assuming the search term is sent in the query parameter 'searchTerm'
        // Construct a regex pattern to match usernames starting with the search term
        const regexPattern = new RegExp(`^${searchTerm}`, 'i'); // 'i' flag for case-insensitive search

        const users = await User.find({ username: regexPattern }).select([
            "email",
            "username",
            "avatarImage",
            "_id",
        ]);

        return res.json(users);
    } catch (ex) {
        next(ex);
    }
};

module.exports.setAvatar = async(req, res, next) => {
    try {
        const userId = req.params.id;
        const avatarImage = req.body.image;
        const userData = await User.findByIdAndUpdate(
            userId, {
                isAvatarImageSet: true,
                avatarImage,
            }, { new: true }
        );
        return res.json({
            isSet: userData.isAvatarImageSet,
            image: userData.avatarImage,
        });
    } catch (ex) {
        next(ex);
    }
};

module.exports.logOut = (req, res, next) => {
    try {
        if (!req.params.id) return res.json({ msg: "User id is required " });
        onlineUsers.delete(req.params.id);
        return res.status(200).send();
    } catch (ex) {
        next(ex);
    }
};

// Verify Token Middleware
module.exports.verifyToken = (req, res, next) => {
    //const authHeader = req.header('Authorization');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {

        console.log("Token new 1:", token, process.env.jwt_Secret);


        const decoded = jwt.verify(token, process.env.jwt_Secret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};