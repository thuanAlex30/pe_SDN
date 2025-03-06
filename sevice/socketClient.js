import io from "socket.io-client";

const socket = io("https://pe-kpqg.onrender.com");

socket.on("webhook-event", (data) => {
    console.log("📩 Data from Webhook:", data);
});

socket.on("database-update", (change) => {
    console.log("🔄 Database Updated:", change);
});

socket.on("facebook-login", (user) => {
    console.log("🔵 Facebook Login Detected:", user);
});

export default socket;
