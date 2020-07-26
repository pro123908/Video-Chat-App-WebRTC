//client socket to interact with the server
const socket = io("/");

const videoGrid = document.getElementById("video-grid");

// Peer js library - used to create new peer object
// first param is id which is left up to server
// host is the root route
// port on which peer js server is running
// const myPeer = new Peer(undefined, {
//   host: "/",
//   port: "5001",
// });

// console.log("peer => ", myPeer);

// creating video element to render your own video
const myVideo = document.createElement("video");
// muting it obviously you don't wanna hear yourself
myVideo.muted = true;

// array to keep track of all users connected
const peers = {};

document.getElementById("front").addEventListener("click", () => {
  getUserMediaDevices("user");
});

document.getElementById("back").addEventListener("click", () => {
  getUserMediaDevices("environment");
});

function getUserMediaDevices(camera = "user") {
  // STEP-1
  // getting stream from your devices such as camera and microphone
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
      addVideoStream(myVideo, stream);
      console.log("Stream => ", stream);

      let mediaRecorder = new MediaRecorder(stream);
      let chunks = [];

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

      // myPeer.on("call", (call) => {
      //   //connection from new user and then you answer with your own stream
      //   call.answer(stream);
      //   const video = document.createElement("video");

      //   // getting the other user stream
      //   call.on("stream", (userVideoStream) => {
      //     addVideoStream(video, userVideoStream);
      //   });
      // });

      // Whenever a new user comes in your room
      socket.on("new-user", (userId) => {
        console.log("New user connected with id => ", userId);
        connectToNewUser(userId, stream);
      });
    })
    .catch((err) => {
      alert("No device");
    });
}

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

// STEP-1
// when peer is opened
// myPeer.on("open", (id) => {
//   console.log("peer open => ", id);
//   socket.emit("join", ROOM_ID, id);
// });

function connectToNewUser(userId, stream) {
  // giving that new user your stream
  // const call = myPeer.call(userId, stream);
  // const video = document.createElement("video");
  // // On stream from the new user
  // call.on("stream", (userVideoStream) => {
  //   // Stream from the other user
  //   // adding that stream in the video grid
  //   addVideoStream(video, userVideoStream);
  // });
  // // closing/removing video  when stream is closed
  // call.on("close", () => video.remove());
  // // adding new user call object in peers array
  // peers[userId] = call;
}

function addVideoStream(video, stream) {
  // setting source attribute of the video element to the stream to play
  video.srcObject = stream;

  // when stream is ready to be displayed
  video.addEventListener("loadedmetadata", () => {
    // playing the stream/video
    video.play();
  });

  // and in last adding the video to the grid of the videos so that it can be seen
  videoGrid.append(video);
}

/* 
 Flow of the communication

 1)Peer is opened and  your video from stream is displayed in your own browser first

 2) Then if new user comes the join event is called and so the method connectToNewUser is called with new userId and and your stream

 3) then the connection request is send to the new user with your stream and if the new user answers your request it return it's stream to you and then you simply render it in your browser

 4) and the other user render your stream in its browser

 
 
*/
