import { gl, gui, stats, camera, cameraControls, canvas, musicElem } from './init';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { invert, toggleFullscreen } from './libs/utils';
import Renderer from './renderer';
import { loadMeshData } from './libs/utils';
import Tree from "./spacecolon/tree";
import { Vector3 } from 'three';

// Meshes
const HEAD = 'Head';
const HORSE = 'Horse';
const RANDOM = 'Random';
const ROSE = 'Rose';
const SPIRAL = 'Spiral';
const TEAPOT = 'Teapot';

// GUI parameters
export const params = {
  numParticles: 2e2,
  particleCount: 1,
  shape: RANDOM,
  tree: false,
  pause: false,
  pauseApp: 0,
  particleSize: 2.0,
  brightness: 0.8, 
  colorIntensity: 0.7,
  gravity: 50.0,
  rotation: 350.0,
  fullScreen: toggleFullscreen,
  music: true,
  growthSpeed: 5,
};

// Shape
gui.add(params, 'shape', [HEAD, HORSE, ROSE, RANDOM, SPIRAL, TEAPOT]).onChange(setModel);
gui.add(params, 'tree').onChange(setModel);

// Appearance
gui.add(params, 'brightness', 0.8, 0.95);
gui.add(params, 'colorIntensity', 0.6, 0.9);
gui.add(params, 'particleSize', 1.0, 7.0);

// Physics
gui.add(params, 'gravity', 0.0, 100.0);
gui.add(params, 'rotation', 1.0, 360.0);
gui.add(params, 'growthSpeed', 1, 30);

// Controls
gui.add(params, 'pause').onChange(pauseApp);
gui.add(params, 'music').onChange(toggleMusic);
gui.add(params, 'fullScreen');

// Main renderer
var renderer;

// Space Colonization tree
var tree;

// Ping Pong index
var currentIndex = 0;

setModel(params.shape);

function setModel(model) {
  model = params.shape;
  renderer = new Renderer();
  currentIndex = 0;
  params.particleCount = 1;

  switch(model) {
    case HEAD:
      if(params.tree) {
        renderer.scale = 100;
        renderer.createTree = true;
        renderer.jumpingIndex = 0;
        loadMesh("./models/head_tree.obj");
      } else {
        renderer.scale = 25;    
        loadMesh("./models/male_head.obj.txt");
      }
      break;
    case HORSE:
      if(params.tree) {
        renderer.scale = 100;
        renderer.createTree = true;
        renderer.jumpingIndex = 0;
        loadMesh("./models/horse_tree.obj");
      } else {
        renderer.scale = 400;
        loadMesh("./models/horse.obj.txt");
      }
      break;
    case ROSE:
      if(params.tree) {
        initTreeParams(new Vector3(0, -30, 0));
        tree.scale = 5;
        tree.repeatNum = 200;
        loadMesh("./models/lotus_tree.obj");        
      } else {
        renderer.scale = 5;
        loadMesh("./models/lotus.obj");
      }
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
        renderer.scale = 100;
        renderer.createTree = true;
        renderer.jumpingIndex = 0;
        loadMesh("./models/spiral_tree.obj");
      } else {
        renderer.scale = 175;
        loadMesh("./models/spiral.obj");        
      }
      break;
    case TEAPOT:
      if(params.tree) {
        renderer.scale = 100;
        renderer.createTree = true;
        renderer.jumpingIndex = 0;
        loadMesh("./models/teapot_tree.obj");
      } else {
        renderer.scale = 20;
        loadMesh("./models/tea.obj.txt");
      }
      break;
  }
}

function enableFullScreen() {
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

function toggleMusic() {
  if (musicElem.paused) {
    musicElem.play();
  }
  else {
    musicElem.pause();
  }
};

function initTreeParams(pos) {
  renderer.scale = 100;
  renderer.createTree = true;
  renderer.jumpingIndex = 0;
  tree = new Tree(pos);
  renderer.createTree = true;
  tree.meshProvided = true;
  tree.repeatNum = 80;
}

function createRandTree(mesh) {
  tree.mesh = mesh;
  tree.leafCount = mesh.vertexCount;
  tree.generateCrown();
  tree.generateTrunk();

  var mesh = tree.grow();
  if(mesh != null) {
    init(mesh);
    renderLoop();
  }
}

function createTree(mesh) {
  if(mesh != null) {
    tree.mesh = mesh;
    tree.leafCount = mesh.vertexCount;
    tree.generateCrown();
    tree.generateTrunk();

    // Preprocess SCA tree 
    let meshTree = tree.grow();
    while(!tree.doneGrowing) {
      let temp = tree.grow();
      if(temp != null) {
        meshTree = temp;
      }
    }

    // Print out vertices for trees
    for(let i = 0; i < meshTree.vertexCount * 3; i+=3) {
      console.log(meshTree.vertices[i], meshTree.vertices[i + 1], meshTree.vertices[i + 2]);
    }

    init(meshTree);
    renderLoop();
  }
}

function growTree(mesh) {
  if(mesh != null) {
    init(mesh);
    renderLoop();
  }
}

function loadMesh(filename) {
  $.ajax({
      url: filename,
      dataType: 'text'
  }).done(function(data) {
    if(params.tree) {
      growTree(loadMeshData(data));
    }
    else {
      init(loadMeshData(data));
    }
  }).fail(function() {
      alert('Failed to retrieve [' + filename + "]");
  });
}

function init(mesh) {
  if(!(params.shape == RANDOM && !params.tree)) {
    if(params.shape != RANDOM && params.tree && params.particleCount < mesh.vertexCount) {
      params.numParticles = params.particleCount;
      params.particleCount += params.growthSpeed;
    }
    else {
      params.numParticles = mesh.vertexCount;
    }
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

  camera.updateMatrixWorld();
  mat4.invert(renderer._viewMatrix, camera.matrixWorld.elements);
  mat4.copy(renderer._projectionMatrix, camera.projectionMatrix.elements);
  mat4.multiply(renderer._viewProjectionMatrix, renderer._projectionMatrix, renderer._viewMatrix);

  // Render to the whole screen
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Clear the frame
  gl.clear(gl.CLEAR_COLOR_BIT);

  if(params.tree && !params.pause) {
    var mesh = renderer.mesh;
    if(params.shape == RANDOM) {
      if(!tree.doneGrowing) {
        mesh = tree.grow();
        if(mesh != null && !tree.doneGrowing) {
          init(mesh);
        }
      }
    }
    else {
      if(params.particleCount < mesh.vertexCount) {
        if(mesh != null) {
          init(mesh);
        }
      }
    }
  }

  renderer.calculateFeedback(currentIndex);
  renderer.drawToFrameBuffer(invertedIndex);

  renderer.drawQuad();

  stats.end();

  // switch index for next iteration
  currentIndex = invert(currentIndex);
  requestAnimationFrame(renderLoop);
}
