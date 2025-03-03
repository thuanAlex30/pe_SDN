const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const dotenv = require("dotenv");
const User = require('../models/User');


dotenv.config();

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ facebookId: profile.id }); // <== LỖI Ở ĐÂY
        if (!user) {
            user = await User.create({
                facebookId: profile.id,
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : null
            });
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));


passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

module.exports = passport;
