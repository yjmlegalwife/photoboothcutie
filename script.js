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

// Access webcam
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(s => {
    stream = s;
    video.srcObject = stream;
  })
  .catch(err => alert("Camera access denied."));

function startPhotoSession() {
  photostrip.innerHTML = "";
  recordedChunks = [];
  startRecording();
  capturePhoto(4);
}

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

function takeSnapshot() {
  const ctx = canvas.getContext("2d");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Draw template if available
  if (templateImage && templateImage.complete) {
  ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
}
ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const imgURL = canvas.toDataURL("image/png");

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

function flashScreen() {
  flash.style.display = "block";
  setTimeout(() => { flash.style.display = "none"; }, 100);
}

function downloadPhotostrip() {
  const ctx = canvas.getContext("2d");
  const width = 360;
  const height = (video.videoHeight / video.videoWidth) * width;
  const spacing = 20;
  const totalHeight = (height * 4) + (spacing * 3);
  canvas.width = width;
  canvas.height = totalHeight;

  const images = photostrip.querySelectorAll("img");
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

function startRecording() {
  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
  mediaRecorder.onstop = saveVideo;
  mediaRecorder.start();
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
  }
}

function saveVideo() {
  const blob = new Blob(recordedChunks, { type: "video/webm" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "photobooth-session.webm";
  a.click();
  URL.revokeObjectURL(url);
}
