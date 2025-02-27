const Room = require("../models/roomModel");

exports.getRooms = async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRoom = async (req, res) => {
    try {
        const newRoom = new Room(req.body);
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateRoom = async (req, res) => {
    try {
        const updatedRoom = await Room.findByIdAndUpdate(req.params.roomId, req.body, { new: true });
        res.json(updatedRoom);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteRoom = async (req, res) => {
    try {
        await Room.findByIdAndDelete(req.params.roomId);
        res.json({ message: "Room deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
