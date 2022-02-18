// Need to fix these imports with parcel
//import '@tensorflow-models/blazeface';
//import '@tensorflow/tfjs-core';
//import '@tensorflow/tfjs-converter';

const MoustacheMakerApp = {
  width: 640,
  height: 480,
  videoElem: null,
  animationFrameID: 0,
  isRunning: false,
  moustache: {
    width: 60,
    height: 30,
  },
};

async function loadCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  //videoElem = document.createElement('video');
  MoustacheMakerApp.videoElem = document.getElementById("theVideo");
  MoustacheMakerApp.videoElem.srcObject = stream;
  MoustacheMakerApp.videoElem.autoplay = false;
  MoustacheMakerApp.videoElem.controls = false;
  return new Promise((resolve) => {
    MoustacheMakerApp.videoElem.onloadedmetadata = () =>
      resolve(MoustacheMakerApp.videoElem);
  });
}

function clearMoustaches(ctx) {
  ctx.clearRect(0, 0, MoustacheMakerApp.width, MoustacheMakerApp.height);
}

function drawMoustache(ctx, nosePos, mouthPos, width, height) {
  const moustacheCenter = [nosePos[0], nosePos[1] / 4 + (3 * mouthPos[1]) / 4];

  const halfwidth = width / 2;
  const threefourthwidth = (3 * width) / 4;
  function drawHalfMoustache(direction) {
    function addOrSub(startx, offsetx) {
      if (direction == "left") {
        return startx - offsetx;
      }
      return startx + offsetx;
    }
    ctx.beginPath();
    ctx.moveTo(moustacheCenter[0], moustacheCenter[1]);
    ctx.bezierCurveTo(
      addOrSub(moustacheCenter[0], halfwidth),
      moustacheCenter[1] - height,
      addOrSub(moustacheCenter[0], threefourthwidth),
      moustacheCenter[1] + 5,
      addOrSub(moustacheCenter[0], width),
      moustacheCenter[1]
    );
    ctx.moveTo(moustacheCenter[0], moustacheCenter[1]);
    ctx.bezierCurveTo(
      addOrSub(moustacheCenter[0], 5),
      moustacheCenter[1] + 10,
      addOrSub(moustacheCenter[0], threefourthwidth),
      moustacheCenter[1] + 5,
      addOrSub(moustacheCenter[0], width),
      moustacheCenter[1]
    );
    ctx.fill();
  }
  drawHalfMoustache("left");
  drawHalfMoustache("right");
}

async function startAddingMoustaches(model, domElem, ctx) {
  if (!MoustacheMakerApp.isRunning) {
    return;
  }

  // ctx.drawImage(domElem, 0, 0, MoustacheMakerApp.width, MoustacheMakerApp.height);

  const returnTensors = false; // Pass in `true` to get tensors back, rather than values.
  const predictions = await model.estimateFaces(domElem, returnTensors);

  if (predictions.length > 0) {
    clearMoustaches(ctx);
    /*
          `predictions` is an array of objects describing each detected face, for example:

          [
          {
          topLeft: [232.28, 145.26],
          bottomRight: [449.75, 308.36],
          probability: [0.998],
          landmarks: [
          [295.13, 177.64], // right eye
          [382.32, 175.56], // left eye
          [341.18, 205.03], // nose
          [345.12, 250.61], // mouth
          [252.76, 211.37], // right ear
          [431.20, 204.93] // left ear
          ]
          }
          ]
        */

    for (let i = 0; i < predictions.length; i++) {
      if (predictions[i].landmarks.length > 3) {
        const nosePos = predictions[i].landmarks[2];
        const mouthPos = predictions[i].landmarks[3];
        drawMoustache(
          ctx,
          nosePos,
          mouthPos,
          MoustacheMakerApp.moustache.width,
          MoustacheMakerApp.moustache.height
        );
      }
    }
  }

  MoustacheMakerApp.animationFrameID = requestAnimationFrame((timestamp) => {
    startAddingMoustaches(model, domElem, ctx);
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  const startButton = document.getElementById("startButton");
  startButton.disabled = true;
  const stopButton = document.getElementById("stopButton");
  stopButton.disabled = true;
  const moustacheButton = document.getElementById("moustacheButton");
  moustacheButton.style.visibility = "hidden";
  const moustacheLabel = document.getElementById("moustacheLabel");
  moustacheLabel.style.visibility = "hidden";
  // Load the model.
  const model = await blazeface.load();
  const domElem = await loadCamera();

  const theCanvas = document.getElementById("theCanvas");
  theCanvas.width = domElem.videoWidth;
  theCanvas.height = domElem.videoHeight;
  MoustacheMakerApp.width = theCanvas.width;
  MoustacheMakerApp.height = theCanvas.height;
  const ctx = theCanvas.getContext("2d");
  ctx.fillStyle = "black";

  startButton.addEventListener("click", () => {
    domElem.play();
  });
  stopButton.addEventListener("click", () => {
    domElem.pause();
    MoustacheMakerApp.isRunning = false;
    cancelAnimationFrame(MoustacheMakerApp.animationFrameID);
  });
  moustacheButton.addEventListener("change", () => {
    if (MoustacheMakerApp.isRunning) {
      MoustacheMakerApp.isRunning = false;
      cancelAnimationFrame(MoustacheMakerApp.animationFrameID);
      moustacheButton.checked = false;
      clearMoustaches(ctx);
    } else {
      MoustacheMakerApp.isRunning = true;
      startAddingMoustaches(model, domElem, ctx);
      moustacheButton.checked = true;
    }
  });
  domElem.play();
  startButton.disabled = false;
  stopButton.disabled = false;
  moustacheButton.style.visibility = "visible";
  moustacheLabel.style.visibility = "visible";
});
