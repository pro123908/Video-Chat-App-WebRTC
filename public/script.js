//client socket to interact with the server
const socket = io("/");

const videoGrid = document.getElementById("video-grid");

var configuration = {
  mobileFirst: "user",
  desktopFirst: "user",
  host: "peerjs-server-123908.herokuapp.com",
  path: "/peerjs",
  port: 443,
};

// Peer js library - used to create new peer object
// first param is id which is left up to server
// host is the root route
// port on which peer js server is running
// const myPeer = new Peer(undefined, {
//   host: "/",
//   port: "5001",
// });

// console.log("peer => ", myPeer);

const myPeer = new Peer(undefined, {
  secure: true,
  host: configuration.host,
  port: configuration.port,

  path: configuration.path,
});

console.log("peer => ", myPeer);

var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  navigator.userAgent
)
  ? true
  : false;

// document.getElementById("device").innerText = isMobile;

// creating video element to render your own video
const myVideo = document.createElement("video");
// muting it obviously you don't wanna hear yourself
myVideo.muted = true;

// array to keep track of all users connected
const peers = {};

var mediaRecorder;
var chunks = [];
var streamObject;

let initializeCommunication = async () => {
  try {
    if (isMobile) {
      streamObject = await getUserMediaDevices(configuration.mobileFirst);
    } else {
      streamObject = await getUserMediaDevices(configuration.desktopFirst);
    }

    console.log("StreamObject => ", streamObject);

    mediaRecorder = new MediaRecorder(streamObject);
    chunks = [];

    document.getElementById("record").addEventListener("click", () => {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
    });

    document.getElementById("stop").addEventListener("click", () => {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
    });

    mediaRecorder.ondataavailable = (ev) => {
      chunks.push(ev.data);
    };

    mediaRecorder.onstop = (ev) => {
      let blob = new Blob(chunks, { type: "video/mp4" });
      let vid2 = document.getElementById("vid2");
      chunks = [];

      let videoURL = window.URL.createObjectURL(blob);
      vid2.src = videoURL;
    };
    console.log("end");
  } catch (error) {
    console.log("prse -> ", error);
    alert("No device found");
  }
};

document.getElementById("front").addEventListener("click", () => {
  getUserMediaDevices("user");
});

document.getElementById("back").addEventListener("click", () => {
  getUserMediaDevices("environment");
});

initializeCommunication();

function getUserMediaDevices(camera = "user", cameraChanged = false) {
  // STEP-1
  // getting stream from your devices such as camera and microphone

  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: {
          facingMode: {
            exact: camera,
          },
        },
      })
      .then((stream) => {
        // when connected to your devices, rendering video to the browser
        // giving newly created video element and the stream from devices
        addVideoStream(myVideo, stream, true, cameraChanged);
        streamObject = stream;
        console.log("Stream => ", streamObject);

        socket.emit("stream-changed", stream);

        myPeer.on("call", (call) => {
          //connection from new user and then you answer with your own stream
          call.answer(streamObject);
          const video = document.createElement("video");

          // getting the other user stream
          call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
          });
        });

        // Whenever a new user comes in your room
        socket.on("stream-changed-server", (userId) => {
          console.log("stream-changed-server with id => ", userId);
          connectToNewUser(userId, streamObject);
        });

        // Whenever a new user comes in your room
        socket.on("new-user", (userId) => {
          console.log("New user connected with id => ", userId);
          connectToNewUser(userId, streamObject);
        });
        resolve(streamObject);
      })
      .catch((err) => {
        // reject(err);
        alert("No Device");
        reject(err);
      });
  });
}

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

// STEP-1
// when peer is opened
myPeer.on("open", (id) => {
  console.log("peer open => ", id);
  socket.emit("join", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  // giving that new user your stream
  const call = myPeer.call(userId, stream);

  const video = document.createElement("video");

  // On stream from the new user
  call.on("stream", (userVideoStream) => {
    // Stream from the other user
    // adding that stream in the video grid
    addVideoStream(video, userVideoStream);
  });

  // closing/removing video  when stream is closed
  call.on("close", () => video.remove());

  // adding new user call object in peers array
  peers[userId] = call;
}

function addVideoStream(
  video,
  stream,
  personal = false,
  cameraChanged = false
) {
  // setting source attribute of the video element to the stream to play
  video.srcObject = stream;

  // when stream is ready to be displayed
  video.addEventListener("loadedmetadata", () => {
    // playing the stream/video
    video.play();
  });

  var videoContainer = document.createElement("div");
  videoContainer.classList.add("video-container");
  videoContainer.append(video);
  if (personal && !cameraChanged) {
    var buttonContainer = document.createElement("div");
    buttonContainer.classList.add("buttons-container");

    var frontButton = document.createElement("button");
    frontButton.classList.add("chat-button");
    frontButton.classList.add("front-button");
    frontButton.innerText = "Front";

    frontButton.addEventListener("click", () =>
      getUserMediaDevices("user", true)
    );

    var backButton = document.createElement("button");
    backButton.classList.add("chat-button");
    backButton.classList.add("back-button");
    backButton.innerText = "Back";

    backButton.addEventListener("click", () =>
      getUserMediaDevices("environment", true)
    );

    var recordButton = document.createElement("button");
    recordButton.classList.add("chat-button");
    recordButton.classList.add("record-button");
    recordButton.innerText = "Record";

    var stopButton = document.createElement("button");
    stopButton.classList.add("chat-button");
    stopButton.classList.add("stop-button");
    stopButton.innerText = "Stop";

    buttonContainer.append(frontButton);
    buttonContainer.append(backButton);
    buttonContainer.append(recordButton);
    buttonContainer.append(stopButton);
    videoContainer.append(buttonContainer);
  }

  // and in last adding the video to the grid of the videos so that it can be seen
  videoGrid.append(videoContainer);
}

/*
 Flow of the communication

 1)Peer is opened and  your video from stream is displayed in your own browser first

 2) Then if new user comes the join event is called and so the method connectToNewUser is called with new userId and and your stream

 3) then the connection request is send to the new user with your stream and if the new user answers your request it return it's stream to you and then you simply render it in your browser

 4) and the other user render your stream in its browser

*/

// function returnAPromise() {
//   return new Promise((resolve, reject) => {
//     navigator.mediaDevices
//       .getUserMedia({})
//       .then((stream) => {
//         // when connected to your devices, rendering video to the browser
//         // giving newly created video element and the stream from devices

//         console.log("Stream => ", stream);

//         resolve(stream);
//       })
//       .catch((err) => {
//         // reject(err);
//         console.log("caught");
//         reject(err);
//       });
//   });
// }

// // returnAPromise()
// //   .then(() => console.log("accept"))
// //   .catch((err) => console.log(err));

// var setUp = async () => {
//   try {
//     var result = await returnAPromise();
//     console.log("result => ", result);
//   } catch (error) {
//     console.log("failed with ", error);
//   }
// };

// setUp();
