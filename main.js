import { gl, gui, stats, camera, cameraControls, canvas } from './init';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { invert, toggleFullscreen } from './libs/utils';
import Renderer from './renderer';
import { loadMeshData } from './libs/utils';
import Tree from "./spacecolon/tree";
import { Vector3 } from 'three';

// Meshes
const RANDOM = 'Random';
const TEAPOT = 'Teapot';
const HORSE = 'Horse';
const HEAD = 'Head';
const CUBE = 'Cube';
const SPIRAL = 'Spiral';

// GUI parameters
export const params = {
  numParticles: 1e6,
  shape: SPIRAL,
  tree: false,
  pause: false,
  pauseApp: 0,
  particleSize: 2.0,
  brightness: 0.8, 
  colorIntensity: 0.7,
  gravity: 50.0,
  rotation: 350.0,
  fullScreen: toggleFullscreen,
};

// Shape
gui.add(params, 'shape', [HEAD, HORSE, RANDOM, SPIRAL, TEAPOT]).onChange(setModel);
gui.add(params, 'tree').onChange(setModel);

// Appearance
gui.add(params, 'brightness', 0.8, 0.95);
gui.add(params, 'colorIntensity', 0.6, 0.9);
gui.add(params, 'particleSize', 1.0, 7.0);

// Physics
gui.add(params, 'gravity', 0.0, 100.0);
gui.add(params, 'rotation', 1.0, 360.0);

// Controls
gui.add(params, 'pause').onChange(pauseApp);
gui.add(params, 'fullScreen');

// Main renderer
var renderer;

// Space Colonization Algo tree
var tree;

// Ping Pong index
var currentIndex = 0;

setModel(params.shape);

function setModel(model) {
  model = params.shape;
  renderer = new Renderer();
  currentIndex = 0;

  switch(model) {
    case HEAD:
      if(params.tree) {
        initTreeParams(new Vector3(0, 0, 30));
        tree.scale = 50;
        tree.offset = 0;
      } else {
        renderer.scale = 25;    
      }
      loadMesh("./models/male_head.obj.txt");
      break;
    case HORSE:
      if(params.tree) {
        initTreeParams(new Vector3(0, 0, -10));
        tree.scale = 400;
      } else {
        renderer.scale = 400;    
      }
      loadMesh("./models/horse.obj.txt");
      break;
    case RANDOM:
      if(params.tree) {
        initTreeParams(new Vector3(0, 0, 0));
        tree.meshProvided = false;
        tree.repeatNum = 200;
        tree.generateCrown();
        tree.generateTrunk();
        init(tree.grow());
        renderLoop();
      } else {
        renderer.createRandom = true;
        params.numParticles = 1e5;
        init(null);
      }
      break;
    case SPIRAL:
      if(params.tree) {
        initTreeParams(new Vector3(20, 0, 0));      
        tree.scale = 200;
      } else {
        renderer.scale = 200;    
      }
      loadMesh("./models/spiral.obj");
      break;
    case TEAPOT:
      if(params.tree) {
        initTreeParams(new Vector3(0, 0, 0));      
        tree.scale = 20;
      } else {
        renderer.scale = 20;
      }
      loadMesh("./models/tea.obj.txt");
      break;
  }
}

function enableFullScreen() {
  debugger;
  if(params.fullScreen) {
    canvas.requestFullscreen();
  } else {
    Document.exitFullscreen();
  }
}

function pauseApp() {
  if(params.pause) {
    params.pauseApp = 1;
  } else {
    params.pauseApp = 0;
  }
}

function initTreeParams(pos) {
  renderer.scale = 100;
  renderer.createTree = true;
  renderer.jumpingIndex = 0;
  tree = new Tree(pos);
  renderer.createTree = true;
  tree.meshProvided = true;
  tree.repeatNum = 40;
}

function createTree(mesh) {
  tree.mesh = mesh;
  tree.leafCount = mesh.vertexCount;
  tree.generateCrown();
  tree.generateTrunk();
  init(tree.grow());

  renderLoop();
}

function loadMesh(filename) {
  $.ajax({
      url: filename,
      dataType: 'text'
  }).done(function(data) {
    if(params.tree && params.shape != RANDOM) {
      createTree(loadMeshData(data));
    } else {
      init(loadMeshData(data));
    }
  }).fail(function() {
      alert('Failed to retrieve [' + filename + "]");
  });
}

function init(mesh) {
  if(!(params.shape == RANDOM && !params.tree)) {
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
  renderer.brightness = gl.getUniformLocation(renderer.programPost, "brightness");
  renderer.colorIntensity = gl.getUniformLocation(renderer.programPost, "colorIntensity");

  renderer.createVAO();

  // Start the render loop
  if(!params.tree) {
    renderLoop();
  }
}

function renderLoop() {
  const invertedIndex = invert(currentIndex);
  renderer.update();
  cameraControls.update();

  stats.begin();

  if(params.tree) {
    if(!tree.doneGrowing) {
      var mesh = tree.grow();
      if(mesh != null && !tree.doneGrowing) {
        init(mesh);
      }
    }
  }

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
