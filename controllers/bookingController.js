const Booking = require("../models/bookingModel");
const Room = require("../models/roomModel");

exports.getBookings = async (req, res) => {
    const bookings = await Booking.find();
    res.json(bookings);
};


exports.createBooking = async (req, res) => {
    const { customerName, roomNumber, startTime, endTime } = req.body;
    const room = await Room.findOne({ roomNumber });
    if (!room) return res.status(400).json({ error: "Room not found" });

    const duration = (new Date(endTime) - new Date(startTime)) / 3600000;
    const totalAmount = duration * room.pricePerHour;
    const booking = new Booking({ customerName, roomNumber, startTime, endTime, totalAmount });
    await booking.save();
    res.status(201).json(booking);
};

exports.updateBooking = async (req, res) => {
    const { bookingId } = req.params;
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, req.body, { new: true });
    res.json(updatedBooking);
};

exports.deleteBooking = async (req, res) => {
    const { bookingId } = req.params;
    await Booking.findByIdAndDelete(bookingId);
    res.json({ message: "Booking deleted" });
};