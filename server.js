require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const FacebookStrategy = require('passport-facebook').Strategy;
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const { body, validationResult } = require('express-validator');
const Room = require('./models/roomModel');
const Booking = require('./models/bookingModel');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require('path');
app.use(cors({
    credentials: true,
    origin: 'https://pe-kpqg.onrender.com/'  // Replace with the actual URL of your frontend
}));


app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Kết nối MongoDB
mongoose.connection.once("open", () => {
    console.log("🔄 Listening for database changes...");
    const changeStream = mongoose.connection.collection("users").watch();
    changeStream.on("change", (change) => {
        console.log("🔄 Database Change Detected:", change);
        io.emit("database-update", change); // Emit database changes to clients
    });
});

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

// Mô hình User Schema
const UserSchema = new mongoose.Schema({
    facebookId: String,
    name: String,
    email: String
});
const User = mongoose.model('User', UserSchema);

// Cấu hình session
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));

// Passport config
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
            user = new User({
                facebookId: profile.id,
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : "N/A"
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    console.log('Serializing user:', user); // Add log here to check user serialization
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    console.log('Deserialized user:', user); // Add log here to check user deserialization
    done(null, user);
});


app.use(passport.initialize());
app.use(passport.session());

// 🟢 Facebook OAuth Routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        console.log('User authenticated:', req.user);  // Log the user object after Facebook login
        res.redirect('/rooms');  // Redirect to rooms after successful login
    }
);


// 🟢 Webhook Endpoint (Nhận dữ liệu từ bên thứ 3)
app.post('/webhook', (req, res) => {
    console.log("📩 Webhook received:", req.body);
    io.emit("webhook-event", req.body);
    res.status(200).send("Webhook received!");
});


// 🟢 MongoDB Change Stream (Realtime Database Updates)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Increase timeout
    connectTimeoutMS: 30000 // Increase connection timeout
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Connection Error:", err));


// 🟢 WebSocket: Nhận kết nối từ client
io.on("connection", (socket) => {
    console.log("🟢 Client connected");
    socket.on("disconnect", () => console.log("🔴 Client disconnected"));
});

// 🟢 Logout Route
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/');
    });
});

// 🟢 Room API
app.get('/rooms', async (req, res) => {
    if (!req.user) {
        return res.redirect('/auth/facebook/');  // Redirect to login if the user is not logged in
    }

    try {
        const rooms = await Room.find();
        console.log('Rooms fetched:', rooms);  // Log rooms data
        res.render('index', { user: req.user, rooms });  // Pass rooms and user to the view
    } catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).send("Error fetching rooms");
    }
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
        const room = await Room.findById(req.params.id);
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

app.get("/bookings/new", (req, res) => {
    res.render("newBooking");
});

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

app.get("/bookings/:id/edit", async (req, res) => {
    const booking = await Booking.findById(req.params.id);
    res.render("editBooking", { booking });
});

app.put("/bookings/:id", async (req, res) => {
    await Booking.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/bookings");
});

app.delete("/bookings/:id", async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    res.redirect("/bookings");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
