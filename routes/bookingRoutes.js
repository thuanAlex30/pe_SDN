const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");

router.get("/", bookingController.getBookings);
router.post("/", bookingController.createBooking);
router.put("/:bookingId", bookingController.updateBooking);
router.delete("/:bookingId", bookingController.deleteBooking);

module.exports = router;