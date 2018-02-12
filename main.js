import { gl, gui, stats, camera, cameraControls } from './init';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { invert } from './libs/utils'
import Renderer from './renderer';
import { loadMeshData } from './libs/utils'

const RANDOM = 'Random';
const TEAPOT = 'Teapot';
const HORSE = 'Horse';
const HEAD = 'Head';
const CUBE = 'Cube';

// GUI parameters
export const params = {
  numParticles: 1e6,
  shape: TEAPOT,
};

var renderer;
// Ping Pong index
var currentIndex = 0;

setModel(params.shape);

// Doesn't start the render loop until obj is loaded and buffers are created
function render() {
  if(params.teapot) {
    loadMesh("./models/tea.obj.txt");
  } else {
    init(null);
  }
}

function setModel(model) {
  renderer = new Renderer();
  currentIndex = 0;

  switch(model) {
    case RANDOM:
      renderer.createRandom = true;
      params.numParticles = 1e5;
      init(null);
      break;
    case CUBE:
      renderer.sizeDivide = 2;
      renderer.cube = true;
      loadMesh("./models/cube.obj.txt");  
      break;
    case TEAPOT:
      renderer.sizeDivide = 20;
      loadMesh("./models/tea.obj.txt");
      break;
    case HORSE:
      renderer.sizeDivide = 400;
      loadMesh("./models/horse.obj.txt");
      break;
    case HEAD:
      renderer.sizeDivide = 50;    
      loadMesh("./models/male_head.obj.txt");
      break;
  }
}

gui.add(params, 'shape', [RANDOM, TEAPOT, HORSE, HEAD]).onChange(setModel);

function loadMesh(filename) {
  $.ajax({
      url: filename,
      dataType: 'text'
  }).done(function(data) {
      init(loadMeshData(data));
  }).fail(function() {
      alert('Failed to retrieve [' + filename + "]");
  });
}

function init(mesh) {
  if(params.shape != RANDOM) {
    params.numParticles = mesh.vertexCount;
    renderer.mesh = mesh;
  }

  // Create VAOs
  renderer.feedbackVAOs = [];
  renderer.displayVAOs = [];

  renderer.createBuffers();
  renderer.createProgram();

  // Get uniform location for texture
  renderer.texLocation = gl.getUniformLocation(renderer.programPost, "tex");

  renderer.createVAO();

  // Start the render loop
  renderLoop();
}

function renderLoop() {
  const invertedIndex = invert(currentIndex);
  renderer.update();
  cameraControls.update();

  stats.begin();

  camera.updateMatrixWorld();
  mat4.invert(renderer._viewMatrix, camera.matrixWorld.elements);
  mat4.copy(renderer._projectionMatrix, camera.projectionMatrix.elements);
  mat4.multiply(renderer._viewProjectionMatrix, renderer._projectionMatrix, renderer._viewMatrix);

  renderer.calculateFeedback(currentIndex);
  renderer.drawToFrameBuffer(invertedIndex);

  gl.clear(gl.CLEAR_COLOR_BIT);

  renderer.drawQuad();

  stats.end();

  // switch index for next iteration
  currentIndex = invert(currentIndex);
  requestAnimationFrame(renderLoop);
}
