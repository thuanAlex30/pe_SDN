const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const dotenv = require("dotenv");
const User = require('../models/User');


dotenv.config();

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'emails']  // 'displayName' is part of the profile
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
            user = new User({
                facebookId: profile.id,
                name: profile.displayName,  // 'name' saved here
                email: profile.emails ? profile.emails[0].value : "N/A"
            });
            await user.save();
        }
        return done(null, user);  // Pass the user object to 'done'
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    console.log("User found:", user);  // Log the user object
    done(null, user);
});


module.exports = passport;
