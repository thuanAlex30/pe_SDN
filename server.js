const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const dotenv = require("dotenv");
const Room = require("./models/roomModel");
const Booking = require("./models/bookingModel");

dotenv.config();
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

app.get("/", async (req, res) => {
    const rooms = await Room.find();
    res.render("index", { rooms });
});

app.get("/rooms/new", (req, res) => {
    res.render("newRoom");
});

app.post("/rooms", async (req, res) => {
    await Room.create(req.body);
    res.redirect("/");
});

app.get("/rooms/:id/edit", async (req, res) => {
    const room = await Room.findById(req.params.id);
    res.render("editRoom", { room });
});

app.put("/rooms/:id", async (req, res) => {
    await Room.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/");
});

app.delete("/rooms/:id", async (req, res) => {
    await Room.findByIdAndDelete(req.params.id);
    res.redirect("/");
});

app.get("/bookings", async (req, res) => {
    const bookings = await Booking.find();
    res.render("bookings", { bookings });
});
// 🆕 Hiển thị form thêm đặt phòng
app.get("/bookings/new", (req, res) => {
    res.render("newBooking");
});

// 💾 Xử lý thêm đặt phòng
app.post("/bookings", async (req, res) => {
    const { customerName, roomNumber, startTime, endTime } = req.body;
    const room = await Room.findOne({ roomNumber });

    if (!room) {
        return res.status(400).send("Phòng không tồn tại!");
    }

    const duration = (new Date(endTime) - new Date(startTime)) / 3600000;
    const totalAmount = duration * room.pricePerHour;

    await Booking.create({ customerName, roomNumber, startTime, endTime, totalAmount });
    res.redirect("/bookings");
});

// ✏ Hiển thị form chỉnh sửa đặt phòng
app.get("/bookings/:id/edit", async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    res.render("editBooking", { booking });
});

// 💾 Xử lý cập nhật đặt phòng
app.put("/bookings/:id", async (req, res) => {
    await Booking.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/bookings");
});

// ❌ Xóa đặt phòng
app.delete("/bookings/:id", async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    res.redirect("/bookings");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
