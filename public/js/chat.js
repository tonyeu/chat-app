const socket = io();

const $chatForm = document.querySelector("#chat-input-form");
const $messageFormImput = $chatForm.querySelector("input");
const $messageFormButton = $chatForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild;

    // height of the new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // height of messages container
    const containerHeight = $messages.scrollHeight;

    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

    console.log(newMessageMargin);
};

socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message. username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", (locationMessage) => {
    const html = Mustache.render(locationTemplate, {
        url: locationMessage.url,
        createdAt:  moment(locationMessage.createdAt).format("h:mm a"),
        username: locationMessage.username
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room, users
    });
    document.querySelector("#sidebar").innerHTML = html;
});

$chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const sendMessageInput = event.target.elements.message;
    const messageText = sendMessageInput.value;
    if (!messageText) {
        return;
    }

    // disable form
    $messageFormButton.setAttribute("disabled", "disabled");

    socket.emit("sendMessage", messageText, (error) => {
    // enable form
        $messageFormButton.removeAttribute("disabled");
        $messageFormImput.value = "";
        $messageFormImput.focus();

        if (error) {
            return console.log(error);
        }
        console.log("Message delivered.");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                console.log("Location shared!");

                $sendLocationButton.removeAttribute("disabled");
            }
        );
    });
});

socket.emit("join", {
    username, room
}, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
