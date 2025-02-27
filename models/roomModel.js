const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomNumber: { type: String, required: true },
    capacity: { type: Number, required: true },
    status: { type: String, enum: ["available", "occupied"], default: "available" },
    pricePerHour: { type: Number, required: true },
    features: { type: [String], default: [] },
});

module.exports  = mongoose.model("Room", roomSchema,"Room");

