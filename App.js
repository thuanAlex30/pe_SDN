import React, { useEffect, useState } from "react";
import socket from "./sevice/socketClient";

const App = () => {
    const [message, setMessage] = useState("Waiting for updates...");

    useEffect(() => {
        socket.on("webhook-event", (data) => {
            setMessage(`Webhook Event: ${JSON.stringify(data)}`);
        });

        socket.on("database-update", (change) => {
            setMessage(`Database Updated: ${JSON.stringify(change)}`);
        });

        socket.on("facebook-login", (user) => {
            setMessage(`User ${user.user} logged in via Facebook!`);
        });
    }, []);

    return (
        <div>
            <h1>🚀 Webhook & Realtime Demo</h1>
            <p>{message}</p>
        </div>
    );
};

export default App;
