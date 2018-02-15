import DAT from 'dat-gui';
import Stats from 'stats-js';
import { PerspectiveCamera } from 'three';
import OrbitControls from 'three-orbitcontrols';

export const canvas = document.getElementById("canvas");
export const gl = canvas.getContext('webgl2', {antialias: false});
export const mousePos = [0, 0];
export const gui = new DAT.GUI();

// Initialize statistics widget
export const stats = new Stats();
stats.setMode(1); // 0: fps, 1: ms
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';
document.body.appendChild(stats.domElement);

// Check WebGL2
if (!gl) {
    document.querySelector('.no-webgl2').style.display = 'block';
}

// Initialize camera
export const camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);

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
  gl.viewport(0, 0, canvas.width, canvas.height);
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
  

// Set clear color
gl.clearColor(0.2, 0.1, 0.3, 1.0);

// Set camera position and target
camera.position.set(0,0,0);
cameraControls.target.set(0,0,-1);

// Enable blending
gl.enable(gl.BLEND);
gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

// Import the main application
require('./main');
