let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let countdownEl = document.getElementById('countdown');
let flash = document.getElementById('flash');
let photostrip = document.getElementById('photostrip');
let countdownTime = document.getElementById('countdownTime');
let templateImage = null;
let capturedPhotos = [];

// --- Camera Access ---
navigator.mediaDevices.getUserMedia({
  video: { facingMode: "user" },
  audio: false
})
.then(stream => {
  video.srcObject = stream;
  video.play();
})
.catch(err => {
  console.error('Error accessing camera:', err);
  alert('Cannot access camera. Please allow camera permission.');
});

// --- Handle Template Upload ---
document.getElementById('templateUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(event) {
    templateImage = new Image();
    templateImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// --- Start Photobooth Session ---
async function startPhotoSession() {
  capturedPhotos = [];
  photostrip.innerHTML = '';

  // Start recording screen
  startRecording();

  for (let i = 0; i < 4; i++) {
    await countdownAndPhoto();
    await new Promise(res => setTimeout(res, 1000)); // small wait after photo
  }

  stopRecording();
}

// --- Countdown and Take Photo ---
async function countdownAndPhoto() {
  let count = parseInt(countdownTime.value);
  while (count > 0) {
    countdownEl.textContent = count;
    countdownEl.style.transform = 'scale(1.2)';
    await new Promise(res => setTimeout(res, 800));
    countdownEl.style.transform = 'scale(1)';
    await new Promise(res => setTimeout(res, 200));
    count--;
  }
  countdownEl.textContent = '';
  takePhoto();
}

// --- Take a Photo ---
function takePhoto() {
  flashScreen();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.save();
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (templateImage) {
    ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
  }

  let imgUrl = canvas.toDataURL('image/png');
  capturedPhotos.push(imgUrl);

  // Preview
  let img = document.createElement('img');
  img.src = imgUrl;
  photostrip.appendChild(img);
}

// --- Flash Effect ---
function flashScreen() {
  flash.style.display = 'block';
  setTimeout(() => {
    flash.style.display = 'none';
  }, 100);
}

// --- Download Photostrip ---
function downloadPhotostrip() {
  if (capturedPhotos.length === 0) return;

  const img = new Image();
  img.src = capturedPhotos[0];
  img.onload = () => {
    const width = img.width;
    const height = img.height;
    const gap = 20;

    const stripCanvas = document.createElement('canvas');
    stripCanvas.width = width;
    stripCanvas.height = (height + gap) * capturedPhotos.length - gap;

    const stripCtx = stripCanvas.getContext('2d');
    capturedPhotos.forEach((src, index) => {
      const photo = new Image();
      photo.src = src;
      photo.onload = () => {
        stripCtx.drawImage(photo, 0, index * (height + gap), width, height);
        if (index === capturedPhotos.length - 1) {
          const link = document.createElement('a');
          link.download = 'photostrip.png';
          link.href = stripCanvas.toDataURL();
          link.click();
        }
      };
    });
  };
}

// --- Screen Recording ---
let mediaRecorder;
let recordedChunks = [];

function startRecording() {
  const stream = document.body.captureStream(30); // Capture whole page at 30 FPS
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

  mediaRecorder.ondataavailable = function(e) {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}

// --- Download the Session Video ---
function downloadVideo() {
  if (recordedChunks.length === 0) return;
  const blob = new Blob(recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'session_video.webm';
  link.click();

  recordedChunks = [];
}
