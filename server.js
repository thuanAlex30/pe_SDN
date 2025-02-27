const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const { body, validationResult } = require("express-validator");
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


const validateRoom = [
    body("roomNumber")
        .notEmpty().withMessage("Room number is required")
        .isNumeric().withMessage("Room number must be a number"),
    body("capacity")
        .isInt({ min: 1 }).withMessage("Capacity must be a positive integer"),
    body("pricePerHour")
        .isInt({ min: 0 }).withMessage("Price per hour must be a non-negative integer"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).render("error", { errors: errors.array() });
        }
        next();
    }
];

const validateBooking = [
    body("customerName").notEmpty().withMessage("Customer name is required"),
    body("roomNumber").notEmpty().withMessage("Room number is required"),
    body("startTime").isISO8601().toDate().withMessage("Invalid start time format"),
    body("endTime").isISO8601().toDate().withMessage("Invalid end time format"),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];


app.get("/", async (req, res) => {
    const rooms = await Room.find();
    res.render("index", { rooms });
});

app.get("/rooms/new", (req, res) => {
    res.render("newRoom");
});

app.post("/rooms", validateRoom, async (req, res) => {
    try {
        await Room.create(req.body);
        res.redirect("/");
    } catch (error) {
        res.status(400).render("error", { errors: [{ msg: error.message }] });
    }
});


app.get("/rooms/:id/edit", async (req, res) => {
    const room = await Room.findById(req.params.id);
    res.render("editRoom", { room });
});


app.put("/rooms/:id", validateRoom, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const room = await Room.findById(req.params.id); // Lấy lại dữ liệu phòng
        return res.status(400).render("editRoom", { room, errors: errors.array() });
    }

    try {
        await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.redirect("/");
    } catch (error) {
        res.status(500).send("Internal Server Error");
    }
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
