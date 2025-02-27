const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");

router.get("/", roomController.getRooms);
router.post("/", roomController.createRoom);
router.put("/:roomId", roomController.updateRoom);
router.delete("/:roomId", roomController.deleteRoom);

module.exports = router;