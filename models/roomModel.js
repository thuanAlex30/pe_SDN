const mongoose = require("mongoose");
const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 }, // Sức chứa phải là số nguyên dương
    status: { type: String, enum: ["available", "occupied"], default: "available" },
    pricePerHour: { type: Number, required: true, min: 0, validate: Number.isInteger }, // Không được âm, không số lẻ
    features: { type: [String], default: [] },
});

module.exports  = mongoose.model("Room", roomSchema,"Room");

