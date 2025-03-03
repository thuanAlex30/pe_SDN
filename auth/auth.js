const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const dotenv = require("dotenv");

dotenv.config();

passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/callback",
        profileFields: ["id", "displayName", "email"]
    },
    (accessToken, refreshToken, profile, done) => {
        return done(null, profile);
    }));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

module.exports = passport;
