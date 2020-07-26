const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.set("view engine", "ejs");
app.set(express.static("public"));

app.get("/", (req, res) => res.send("hello world"));

server.listen(5000, () => console.log("Server running on the port 5000"));
