const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true // Ensures "User@Email.com" is same as "user@email.com"
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["student", "staff"], // Limits roles to only these two options
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("User", userSchema);