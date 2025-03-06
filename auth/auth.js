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
    console.log("Access Token:", accessToken);  // Log access token to verify
    console.log("Refresh Token:", refreshToken);  // Log refresh token to verify
    console.log("Facebook Profile:", profile);  // Log Facebook profile data

    try {
        let user = await User.findOne({ facebookId: profile.id });
        if (!user) {
            user = new User({
                facebookId: profile.id,
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : null
            });
            await user.save();
        }
        return done(null, user);
    } catch (error) {
        console.error("Error in Facebook authentication:", error);
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
