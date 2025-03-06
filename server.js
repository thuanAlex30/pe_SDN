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

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
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
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

app.use(passport.initialize());
app.use(passport.session());

// 🟢 Facebook OAuth Routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/' }),
    (req, res) => {
        res.send(`Welcome, ${req.user.name}! <a href="/logout">Logout</a>`);
        io.emit("facebook-login", { user: req.user.name, message: "User logged in via Facebook!" }); // Emit login event
    }
);


// 🟢 Webhook Endpoint (Nhận dữ liệu từ bên thứ 3)
app.post('/webhook', (req, res) => {
    console.log("📩 Webhook received:", req.body);
    io.emit("webhook-event", req.body); // Emit the webhook event to clients
    res.status(200).send("Webhook received!");
});


// 🟢 MongoDB Change Stream (Realtime Database Updates)
mongoose.connection.once("open", () => {
    console.log("🔄 Listening for database changes...");
    const changeStream = mongoose.connection.collection("users").watch();
    changeStream.on("change", (change) => {
        console.log("🔄 Database Change Detected:", change);
        io.emit("database-update", change);
    });
});

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
    const rooms = await Room.find();
    res.json(rooms);
});

app.post('/rooms', async (req, res) => {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json(room);
});

app.put('/rooms/:id', async (req, res) => {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(room);
});

app.delete('/rooms/:id', async (req, res) => {
    await Room.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

// 🟢 Booking API
app.get('/bookings', async (req, res) => {
    const bookings = await Booking.find();
    res.json(bookings);
});

app.post('/bookings', async (req, res) => {
    const booking = new Booking(req.body);
    await booking.save();
    res.status(201).json(booking);
});

app.put('/bookings/:id', async (req, res) => {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(booking);
});

app.delete('/bookings/:id', async (req, res) => {
    await Booking.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
