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

// Load background template
templateUpload.addEventListener("change", e => {
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

// Access webcam (mirror the camera)
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(s => {
    stream = s;
    video.srcObject = stream;

    // Mirror the video element
    video.style.transform = "scaleX(-1)";
  })
  .catch(err => alert("Camera access denied."));

// Start photo session
function startPhotoSession() {
  photostrip.innerHTML = "";
  recordedChunks = [];
  startRecording();
  capturePhoto(4); // Capture 4 photos
}

// Capture each photo with countdown
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

  ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);

  // Draw template on top (reset transform first)
  if (templateImage && templateImage.complete) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset mirror
    ctx.drawImage(templateImage, 0, 0, snapCanvas.width, snapCanvas.height);
  }

  const imgURL = snapCanvas.toDataURL("image/png");

  const img = document.createElement("img");
  img.src = imgURL;
  photostrip.appendChild(img);

  // Add Download Button for each photo
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

// Flash white screen when taking photo
function flashScreen() {
  flash.style.display = "block";
  setTimeout(() => {
    flash.style.display = "none";
  }, 100);
}

// Download full photostrip
function downloadPhotostrip() {
  const ctx = canvas.getContext("2d");
  const width = 360;
  const images = photostrip.querySelectorAll("img");

  if (images.length === 0) {
    alert("No photos to download!");
    return;
  }

  const height = (video.videoHeight / video.videoWidth) * width;
  const spacing = 20;
  const totalHeight = (height * images.length) + (spacing * (images.length - 1));
  
  canvas.width = width;
  canvas.height = totalHeight;

  let y = 0;
  images.forEach(img => {
    ctx.drawImage(img, 0, y, width, height);
    y += height + spacing;
  });

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "photostrip.png";
  link.click();
}

// Start recording video
function startRecording() {
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
  mediaRecorder.onstop = saveVideo;
  mediaRecorder.start();
}

// Stop recording
function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

// Save video
function saveVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "photobooth-session.webm";
  a.click();
  URL.revokeObjectURL(url);
}
