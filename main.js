import { gl, gui, stats, camera, cameraControls } from './init';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { invert } from './libs/utils';
import Renderer from './renderer';
import { loadMeshData } from './libs/utils';
import Tree from "./spacecolon/tree";
import { Vector3 } from 'three';

const RANDOM = 'Random';
const TEAPOT = 'Teapot';
const HORSE = 'Horse';
const HEAD = 'Head';
const CUBE = 'Cube';
const SPIRAL = 'Spiral';
const TREE = 'Tree'

// GUI parameters
export const params = {
  numParticles: 1e6,
  shape: TREE,
  treeMesh: true,
};

var renderer;
var tree;
// Ping Pong index
var currentIndex = 0;

setModel(params.shape);

function setModel(model) {
  renderer = new Renderer();
  currentIndex = 0;

  switch(model) {
    case CUBE:
      renderer.sizeDivide = 2;
      renderer.cube = true;
      loadMesh("./models/cube.obj.txt");  
      break;
    case HEAD:
      renderer.sizeDivide = 50;    
      loadMesh("./models/male_head.obj.txt");
      break;
    case HORSE:
      renderer.sizeDivide = 400;
      loadMesh("./models/horse.obj.txt");
      break;
    case RANDOM:
      renderer.createRandom = true;
      params.numParticles = 1e5;
      init(null);
      break;
    case SPIRAL:
      renderer.sizeDivide = 200;
      loadMesh("./models/spiral.obj");
      break;
    case TEAPOT:
      renderer.sizeDivide = 20;
      loadMesh("./models/tea.obj.txt");
      break;
    case TREE:
      renderer.sizeDivide = 100;
      renderer.createTree = true;
      if(params.treeMesh) {
        tree = new Tree(new Vector3(-40, -50, 0));
        renderer.createTree = true;
        tree.meshProvided = true;
        tree.sizeDivide = 20;
        tree.repeatNum = 40;
        loadMesh("./models/tea.obj.txt");
      }
      else {
        tree = new Tree(new Vector3(0, -50, 0));
        tree.generateCrown();
        tree.generateTrunk();
        init(tree.grow());
        renderLoop();
      }
      break;
  }
}

gui.add(params, 'shape', [HEAD, HORSE, RANDOM, SPIRAL, TEAPOT, TREE]).onChange(setModel);

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
    if(params.shape == TREE && params.treeMesh) {
      createTree(loadMeshData(data));
    } else {
      init(loadMeshData(data));
    }
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
  if(params.shape != TREE) {
    renderLoop();
  }
}

function renderLoop() {
  const invertedIndex = invert(currentIndex);
  renderer.update();
  cameraControls.update();

  stats.begin();

  if(params.shape == TREE) {
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
