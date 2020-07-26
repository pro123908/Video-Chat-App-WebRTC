const express = require("express");
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io")(server);
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(cors());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

// Generating roomId whenever the root route is visited
// and then redirected to the roomId route
app.get("/", (req, res) => res.redirect(`/${uuidV4()}`));

// Room ID route that render room ejs template
app.get("/:roomId", (req, res) => {
  res.render("room", { roomId: req.params.roomId });
});

// socket is created whenever root route is visited
io.on("connection", (socket) => {
  // When client emit the join event
  // userId and roomId are passed
  socket.on("join", (roomId, userId) => {
    console.log("New join request => ", roomId + " ," + userId);
    //Creating or joining the room with the specified room Id
    socket.join(roomId);
    //Broadcasting new user joining message to all other nodes
    // except the one that is newly connected
    socket.to(roomId).broadcast.emit("new-user", userId);

    //Whenever window/connection is closed
    socket.on("disconnect", () => {
      //Broadcasting  user exiting message to all other nodes
      socket.to(roomId).broadcast.emit("user-disconnected", userId);
    });
  });
});

// Running the server
server.listen(PORT, () => console.log("Server running on the port " + PORT));
