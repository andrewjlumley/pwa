// The width and height of the captured photo. We will set the
// width to the value defined here, but the height will be
// calculated based on the aspect ratio of the input stream.
  
const width = 320; // We will scale the photo width to this
let height = 0; // This will be computed based on the input stream
  
// |streaming| indicates whether or not we're currently streaming
// video from the camera. Obviously, we start at false.
  
let streaming = false;
  
// The various HTML elements we need to configure or control. These
// will be set by the startup() function.
  
let video = null;
let canvas = null;
let photos = null;
let startbutton = null;

let isNetwork = false;

function UpdateNetworkStatus(isActive) {
    isNetwork = isActive;
    onlineStatus.textContent = isNetwork ? "online" : "offline";
}

function showViewLiveResultButton() {
    if (window.self !== window.top) {
      // Ensure that if our document is in a frame, we get the user
      // to first open it in its own tab or window. Otherwise, it
      // won't be able to request permission for camera access.
      document.querySelector(".contentarea").remove();
      const button = document.createElement("button");
      button.textContent = "View live result of the example code above";
      document.body.append(button);
      button.addEventListener("click", () => window.open(location.href));
      return true;
    }

    return false;
}
    
function startup() {
    if (showViewLiveResultButton()) {
      return;
    }
    video = document.getElementById("video");
    photos = document.getElementById("photos");
    canvas = document.getElementById("canvas");
    startbutton = document.getElementById("startbutton");
    onlineStatus = document.getElementById("status");
    
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });
    
    video.addEventListener(
      "canplay",
      (ev) => {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width);
    
          // Firefox currently has a bug where the height can't be read from
          // the video, so we will make assumptions if this happens.
    
          if (isNaN(height)) {
            height = width / (4 / 3);
          }
    
          video.setAttribute("width", width);
          video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          streaming = true;
        }
      },
      false,
    );
    
    startbutton.addEventListener(
      "click",
      (ev) => {
        TakePicture();
        ev.preventDefault();
      },
      false,
    );
  
    UpdateNetworkStatus(window.navigator.onLine);
}

async function TakePicture() {
    const context = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
    
      const data = canvas.toDataURL("image/png");
  
      const img = new Image();
      img.src = data;
      img.id = "photo";
      photos.append(img);
  
      try {
        //const url = "http://localhost:1792/api/articles/4181f4d5-961e-4243-bbb8-0b3ac004ac4b/image";
        const url = "http://researchonionarchitecturetest/api/articles/4181f4d5-961e-4243-bbb8-0b3ac004ac4b/image";
    
        // Use postMessage to send data to service worker as registering a sync directly
        // is problematic if data is large.
        console.log('Send picture to service worker via message');
        const registration = await navigator.serviceWorker.ready;
        registration.active.postMessage({ type: 'sync', url : url, method: 'POST', body: data });
      }

      catch (err) {
        console.log(err);
      }
    }
}

window.addEventListener("load", startup, false);

window.addEventListener("online", () => UpdateNetworkStatus(true));
window.addEventListener("offline", () => UpdateNetworkStatus(false));

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('sw.js')
        .then(reg => console.log('Service worker registered'))
        .catch(err => console.log(`The error is ${err}`));
    });
}

if ('Notification' in window) {
    window.addEventListener('load', () => {
      console.log('Notification supported')

      Notification.requestPermission()
      .then(reg => {
          console.log('Notification permission: ' + reg);
          if (reg != 'granted')
              console.log('Notification permission not granted');
      })
    .catch(err => console.log(`The error is ${err}`));
  });
};
