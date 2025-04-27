let stream;
let mediaRecorder;
let recordedChunks = [];

const video = document.getElementById("video");
const countdownEl = document.getElementById("countdown");
const photostrip = document.getElementById("photostrip");
const canvas = document.getElementById("canvas");
const flash = document.getElementById("flash");
const countdownTimeEl = document.getElementById("countdownTime");
const templateUpload = document.getElementById("templateUpload");

let templateImage = null;

// Load template
templateUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      templateImage = new Image();
      templateImage.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
});

// Access webcam (with mirror effect)
navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false })
  .then((s) => {
    stream = s;
    video.srcObject = stream;
    video.play();
  })
  .catch((err) => {
    alert("Camera access denied.");
    console.error(err);
  });

// Start the photobooth session
function startPhotoSession() {
  photostrip.innerHTML = "";
  recordedChunks = [];
  startRecording();
  capturePhoto(4);
}

// Recursive photo capture
function capturePhoto(photosLeft) {
  if (photosLeft === 0) {
    stopRecording();
    countdownEl.textContent = "";
    return;
  }

  let count = parseInt(countdownTimeEl.value);
  countdownEl.textContent = count;

  const countdown = setInterval(() => {
    count--;
    countdownEl.textContent = count;
    if (count === 0) {
      clearInterval(countdown);
      flashScreen();
      takeSnapshot();
      setTimeout(() => {
        capturePhoto(photosLeft - 1);
      }, 1000);
    }
  }, 1000);
}

// Take snapshot
function takeSnapshot() {
  const snapCanvas = document.createElement("canvas");
  const ctx = snapCanvas.getContext("2d");
  snapCanvas.width = video.videoWidth;
  snapCanvas.height = video.videoHeight;

  // Mirror effect
  ctx.translate(snapCanvas.width, 0);
  ctx.scale(-1, 1);

  // Draw video frame
  ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

  // Draw template if uploaded
  if (templateImage && templateImage.complete) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.drawImage(templateImage, 0, 0, snapCanvas.width, snapCanvas.height);
  }

  const imgURL = snapCanvas.toDataURL("image/png");

  const img = document.createElement("img");
  img.src = imgURL;
  photostrip.appendChild(img);

  const btnDiv = document.createElement("div");
  btnDiv.className = "photo-buttons";

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download Photo";
  downloadBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = imgURL;
    link.download = "photo.png";
    link.click();
  };
  btnDiv.appendChild(downloadBtn);
  photostrip.appendChild(btnDiv);
}

// Flash effect
function flashScreen() {
  flash.style.display = "block";
  setTimeout(() => {
    flash.style.display = "none";
  }, 100);
}

// Combine into photostrip
function downloadPhotostrip() {
  const stripCanvas = document.getElementById("canvas");
  const ctx = stripCanvas.getContext("2d");
  const width = 360;
  const height = (video.videoHeight / video.videoWidth) * width;
  const spacing = 20;
  const totalHeight = (height * 4) + (spacing * 3);
  stripCanvas.width = width;
  stripCanvas.height = totalHeight;

  const images = photostrip.querySelectorAll("img");
  let y = 0;

  images.forEach((img) => {
    ctx.drawImage(img, 0, y, width, height);
    y += height + spacing;
  });

  const link = document.createElement("a");
  link.href = stripCanvas.toDataURL("image/png");
  link.download = "photostrip.png";
  link.click();
}

// Start recording camera
function startRecording() {
  mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
  mediaRecorder.onstop = saveVideo;
  mediaRecorder.start();
}

// Stop recording
function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

// Save recorded video
function saveVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "photobooth-session.webm";
  a.click();
  URL.revokeObjectURL(url);
}
