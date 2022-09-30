//imamo pristup ovome jer smo inkludovali socket.io skriptu u html fajlu
//io();
const socket = io();

//Elements
let formText = document.querySelector("#chatBox");
let sendLocationButton = document.querySelector("#send-location");
let messages = document.querySelector("#messages");

//Templates
let messageTemplates = document.querySelector("#message-template").innerHTML;
let linkTemplates = document.querySelector("#link-template").innerHTML;
let sidebar = document.querySelector("#sidebar-template").innerHTML;

//Options(query in url)
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
}); //ignoreQueryPrefix ignorise ? na pocetku kverija

const autoscroll = () => {
  let lastElement = messages.lastElementChild;
  let lastElementStyle = getComputedStyle(lastElement);
  let lastElementHeight =
    Math.round(parseFloat(lastElementStyle.height)) +
    parseInt(lastElementStyle.marginBottom);
  // console.log("Height of element: " + lastElementHeight);
  // console.log("Height of scroll: " + messages.scrollHeight);
  // console.log("Scroll top: " + messages.scrollTop);
  // console.log("Height of client current window: " + messages.clientHeight);

  let totalCurrentPositionHeight =
    lastElementHeight + messages.scrollTop + messages.clientHeight;
  //poenta je sabrati visinu vidljivog kontejnera, visinu elementa zajedno sa marginama i visinu koliko ima da se skroluje do vrha i
  //uporediti da li je ta visina jednaka(ili veca) od ukupne visine kontejnera u kojem stoje poruke
  if (totalCurrentPositionHeight >= messages.scrollHeight) {
    messages.scrollTop = messages.scrollHeight;
  }
};

//receiveing a message from server
socket.on("message", (messageData) => {
  let html = Mustache.render(messageTemplates, {
    username: messageData.username,
    message: messageData.text,
    createdAt: moment(messageData.createdAt).format("H:mm"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (locationData) => {
  let html = Mustache.render(linkTemplates, {
    username: locationData.username,
    url: locationData.link,
    createdAt: moment(locationData.createdAt).format("H:mm"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  let html = Mustache.render(sidebar, {
    room,
    users,
  });
  document.querySelector("#sidebar").innerHTML = html;
});

//sending a message from form
document.querySelector("#sendMessage").addEventListener("submit", (event) => {
  event.preventDefault();
  let message = formText.value;
  socket.emit("sendMessage", message, (error) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message was delivered!");
  });
  formText.value = "";
  formText.focus();
});

//sending a location
sendLocationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }

  sendLocationButton.disabled = true;
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("Location shared!");
      }
    );
  });
  sendLocationButton.disabled = false; //disableujemo dugme dok se salje lokacija. Reenableujemoga cim se posalje
});

socket.emit(
  "join",
  {
    username,
    room,
  },
  (error) => {
    alert(error);
    location.href = "/";
  }
);
