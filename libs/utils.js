import { gl, canvas, camera } from '../init';
import { Vector3, Matrix4 } from 'three';
import { mat3, mat4, vec4, vec3 } from 'gl-matrix';

/**
 * Creates a shader.
 * 
 * @param {WebGLRenderingContext} gl The webgl context
 * @param {string} source The shader source
 * @param {number} type Either gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
 * @returns {WebGLShader}
 */
export function createShader(gl, source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

/**
 * Creates a webgl program.
 * 
 * @param {WebGLRenderingContext} gl The webgl context
 * @param {string} vertexShaderSource
 * @param {string} fragmentShaderSource
 * @param {Array} [varyings] An array of feedback varyings. Optional.
 * @param {number} feedbackType Either gl.INTERLEAVED_ATTRIBS of gl.SEPARATE_ATTRIBS
 * @returns {WebGLProgram}
 */
export function createProgram(gl, vertexShaderSource, fragmentShaderSource, varyings, feedbackType) {
    var vshader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    var fshader = createShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    var program = gl.createProgram();
    gl.attachShader(program, vshader);
    gl.deleteShader(vshader);
    gl.attachShader(program, fshader);
    gl.deleteShader(fshader);

    // set only if feedback varying are defined
    if (varyings && varyings.length) {
      gl.transformFeedbackVaryings(program, varyings, feedbackType);
    }
    gl.linkProgram(program);

    // check status
    var log = gl.getProgramInfoLog(program);
    if (log) {
      console.error("Program Info: ", log);
      gl.deleteProgram(program);
      return null;
    }

    log = gl.getShaderInfoLog(vshader);
    if (log) {
      console.error("Shader Info: ", log);
      gl.deleteProgram(program);
      return null;
    }

    return program;
}


/**
 * Creates a buffer from an array.
 * 
 * @param {TypedArray} data
 * @param {number} [type=gl.STATIC_DRAW] 
 * @returns
 */
export function createBufferFromArray(data, type = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, type);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return buffer;
}

/**
 * Creates a buffer with a specific size
 * 
 * @param {number} size
 * @param {any} [type=gl.STATIC_DRAW]
 * @returns
 */
export function createBufferWithSize(size, type = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, size, type);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return buffer;
}

/**
 * Creates a vertex array objects
 * 
 * @param {Array} buffers The buffer objects to bind
 * @returns
 */
export function createVAO(buffers) {
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  buffers.forEach(buffer => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer.data);
    gl.enableVertexAttribArray(buffer.location);
    gl.vertexAttribPointer(buffer.location, buffer.elementSize, gl.FLOAT, gl.FALSE, 0, 0);
  });

  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindVertexArray(null);

  return vao;
}

/**
 * Inverts 1 to 0 and 0 to 1.
 * 
 * @param {number} index
 * @returns
 */
export function invert(index) {
  return (index + 1) % 2;
}

/**
 * Returns URL query params as object
 * 
 * @returns {object}
 */
export function getJsonFromUrl() {
  var query = location.search.substr(1);
  var result = {};
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    result[item[0]] = decodeURIComponent(item[1]);
  });
  return result;
}

export function loadMeshData(string) {
  var lines = string.split("\n");
  var vertices = [];
  var normals = [];
  var indices = [];
 
  for ( var i = 0 ; i < lines.length ; i++ ) {
    var parts = lines[i].trimRight().split(' ');
    if ( parts.length > 0 ) {
      switch(parts[0]) {
        case 'v':
          // var objPosition = new Vector3(parts[1], parts[2], parts[3]);
          // var screenPosition = toScreenXY(objPosition);
          // vertices.push(screenPosition.x);
          // vertices.push(screenPosition.y);
          vertices.push(parseFloat(parts[1]));
          vertices.push(parseFloat(parts[2]));
          vertices.push(parseFloat(parts[3]));   
          break;
        case 'vn':
          normals.push(parseFloat(parts[1]));
          normals.push(parseFloat(parts[2]));
          normals.push(parseFloat(parts[3]));
          break;
        case 'f': {
          indices.push(parseFloat(parts[1]));
          indices.push(parseFloat(parts[2]));
          indices.push(parseFloat(parts[3]));
          break;
        }
      }
    }
  }
  var vertexCount = vertices.length / 3;
  console.log("Loaded mesh with " + vertexCount + " vertices");
  return {
    vertices: new Float32Array(vertices),
    vertexCount: vertexCount,
    normals: new Float32Array(normals),
    indices: new Float32Array(indices),
  };
}

function toScreenXY(position) {
  var pos = position.clone();
  var projScreenMat = new Matrix4();
  projScreenMat.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  pos.applyMatrix4(projScreenMat);

  var width = canvas.clientWidth;
  var height = canvas.clientHeight;

  return {x: ((pos.x + 1) / 2) * width,
          y: ((1 - pos.y) / 2) * height};
}
