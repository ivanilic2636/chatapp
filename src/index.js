const path = require("path");
const express = require("express");

//sa http pravimo server isto kao sto bismo i sa expressom samo ovako sada radimo jer hocemo da integrisemo socketio
const http = require("http");
const socketio = require("socket.io");

const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const {
  addUser,
  getUser,
  removeUser,
  getUsersInRoom,
} = require("./utils/users");

const Filter = require("bad-words");

const viewsPath = path.join(__dirname, "../templates/views");
const publicDirectoryPath = path.join(__dirname, "../public");

const port = process.env.PORT || 3000;
const app = express();

//kreiramo novi server
const server = http.createServer(app);
//Zbog ovoga smo prebacili da server bude http a ne expressov server. Socketio ocekuje da server koji se prosledjuje kao argument bude http
const io = socketio(server);

app.set("view engine", "hbs");
app.set("views", viewsPath);

app.use(express.static(publicDirectoryPath));

//listener za soket kad se neko konektuje
io.on("connection", (socket) => {
  console.log("New web socket connection");

  //socket.emit("message", generateMessage("Welcome!")); //sends to that user that joined
  //socket.broadcast.emit("message", generateMessage("A new user has joined!")); //sends all users a message except that particular user

  //listener for join
  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username: username,
      room: room,
    });

    if (error) {
      return callback(error);
    }

    socket.join(user.room); //soket ima predefinisanu funkciju da se joinujes u specificnu sobu
    socket.emit("message", generateMessage("Admin", "Welcome!"));
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage("Admin",`${user.username} has joined!`)); //salje poruku samo korisnicima u toj sobi(to(room))

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
  });

  //receives sendMessage function and sends it to all users using io.emit
  socket.on("sendMessage", (message, callback) => {
    let filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed");
    }
    const user = getUser(socket.id);
    // io.emit("message", generateMessage(message));
    io.to(user.room).emit("message", generateMessage(user.username, message));//saljemo samo korisnicima sobe ovu poruku
    callback();
  });

  //When someone disconnects it sends a message to everybody
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      socket.broadcast
        .to(user.room)
        .emit("message", generateMessage("Admin", `${user.username} has disconnected!`));
      // io.emit("message", generateMessage(`${user.username} has disconnected`)); //sends a message to everybody
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  });





  //listening for a sendLocation function
  socket.on("sendLocation", (coordinates, callback) => {
    const user = getUser(socket.id);
   io.to(user.room).emit(
      "locationMessage",
      generateLocationMessage(user.username,
        `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
      )
    );
    callback();
  });
});

server.listen(port, () => {
  console.log(`Chat app listening on port ${port}`);
});
