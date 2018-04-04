import DAT from 'dat-gui';
import Stats from 'stats-js';
import { PerspectiveCamera } from 'three';
import OrbitControls from 'three-orbitcontrols';

export const canvas = document.getElementById("canvas");
export const musicElem = document.getElementById("music");
export const gl = canvas.getContext('webgl2', {antialias: false});
export const mousePos = [0, 0];
export const gui = new DAT.GUI();

var poseStatsBtn = document.querySelector('.pose-stats');
var poseStatsSection = document.querySelector('section');
poseStatsSection.style.visibility = 'hidden'; // hide it initially

var posStats = document.querySelector('.pos');
var orientStats = document.querySelector('.orient');
var linVelStats = document.querySelector('.lin-vel');
var linAccStats = document.querySelector('.lin-acc');
var angVelStats = document.querySelector('.ang-vel');
var angAccStats = document.querySelector('.ang-acc');
var poseStatsDisplayed = false;

// Initialize statistics widget
export const stats = new Stats();
stats.setMode(0); // 0: fps, 1: ms
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.bottom = '0px';
document.body.appendChild(stats.domElement);

// Check WebGL2
if (!gl) {
    document.querySelector('.no-webgl2').style.display = 'block';
}

// Initialize camera
export const camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 500);

// Initialize camera controls
export const cameraControls = new OrbitControls(camera, canvas);
cameraControls.enableDamping = true;
cameraControls.enableZoom = true;
cameraControls.rotateSpeed = 0.3;
cameraControls.zoomSpeed = 1.0;
cameraControls.panSpeed = 2.0;

// Handle canvas resize
function setSize(width, height) {
  canvas.width = width;
  canvas.height = height;
  camera.aspect = width / height;
  // gl.viewport(0, 0, canvas.width, canvas.height);
  camera.updateProjectionMatrix();
}

setSize(canvas.clientWidth, canvas.clientHeight);
window.addEventListener('resize', () => setSize(canvas.clientWidth, canvas.clientHeight));

// Update mouse position
canvas.addEventListener('mousemove', event => {
  mousePos[0] = event.clientX / canvas.width * 2 - 1;
  mousePos[1] = (event.clientY / canvas.height * 2 - 1) * -1;
});
canvas.addEventListener('touchmove', event => {
  mousePos[0] = event.touches[0].clientX / canvas.width * 2 - 1;
  mousePos[1] = (event.touches[0].clientY / canvas.height * 2 - 1) * -1;
});

// WebVR: Sample event handler

window.addEventListener('vrdisplaypresentchange', function(e) {
  console.log('Display ' + e.display.displayId + ' presentation has changed. Reason given: ' + e.reason + '.');
});

// WebVR: Controls readout of pose stats panel

poseStatsBtn.addEventListener('click', function() {
  if(!poseStatsDisplayed) {
    poseStatsDisplayed = true;
    poseStatsSection.style.visibility = 'visible';
    poseStatsBtn.textContent = 'Hide pose stats';
  } else {
    poseStatsDisplayed = false;
    poseStatsSection.style.visibility = 'hidden';
    poseStatsBtn.textContent = 'Show pose stats';
  }
});

function displayPoseStats(pose) {
  var pos = pose.position;
  var orient = pose.orientation;
  var linVel = pose.linearVelocity;
  var linAcc = pose.linearAcceleration;
  var angVel = pose.angularVelocity;
  var angAcc = pose.angularAcceleration;

  posStats.textContent = 'Position: x ' + pos[0].toFixed(3) + ', y ' + pos[1].toFixed(3) + ', z ' + pos[2].toFixed(3);
  orientStats.textContent = 'Orientation: x ' + orient[0].toFixed(3) + ', y ' + orient[1].toFixed(3) + ', z ' + orient[2].toFixed(3);
  linVelStats.textContent = 'Linear velocity: x ' + linVel[0].toFixed(3) + ', y ' + linVel[1].toFixed(3) + ', z ' + linVel[2].toFixed(3);
  angVelStats.textContent = 'Angular velocity: x ' + angVel[0].toFixed(3) + ', y ' + angVel[1].toFixed(3) + ', z ' + angVel[2].toFixed(3);

  if(linAcc) {
    linAccStats.textContent = 'Linear acceleration: x ' + linAcc[0].toFixed(3) + ', y ' + linAcc[1].toFixed(3) + ', z ' + linAcc[2].toFixed(3);
  } else {
    linAccStats.textContent = 'Linear acceleration not reported';
  }

  if(angAcc) {
    angAccStats.textContent = 'Angular acceleration: x ' + angAcc[0].toFixed(3) + ', y ' + angAcc[1].toFixed(3) + ', z ' + angAcc[2].toFixed(3);
  } else {
    angAccStats.textContent = 'Angular acceleration not reported';
  }
}
  
// Set clear color
gl.clearColor(0.2, 0.1, 0.3, 1.0);

// Set camera position and target
camera.position.set(0, 0, 0);
cameraControls.target.set(0, 0, -1);

// Enable blending
gl.enable(gl.BLEND);
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

// Import the main application
require('./main');
