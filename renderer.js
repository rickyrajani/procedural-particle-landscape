import { gl, mousePos } from './init';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { params } from './main'
import { Vector4 } from 'three';
import { createBufferFromArray, createBufferWithSize, createProgram, createVAO, invert } from './libs/utils'
import { vertexFeedbackShader } from './shaders/calc_vertex'
import { fragmentEmptyShader } from './shaders/calc_empty_fragment'
import { vertexDisplayShader } from './shaders/display_vertex'
import { fragmentDisplayShader } from './shaders/display_fragment'
import { vertexPostShader } from './shaders/post_vertex'
import { fragmentPostShader } from './shaders/post_fragment'
import { multiply } from 'gl-matrix/src/gl-matrix/mat3';

// Use predefined attribute locations
const VERTEX_ATTRIBUTE_POS = 0;
const VELOCITY_ATTRIBUTE_POS = 1;

class Renderer {
    constructor() {
        this.clock = 0.0;
        this.createRandom = false;
        this.createTree = false;
        this.cube = false;
        this.sizeDivide = 20;

        this._projectionMatrix = mat4.create();
        this._viewMatrix = mat4.create();
        this._viewProjectionMatrix = mat4.create();
    }

    update() {
        this.clock += 1.0;
    }
  
    createBuffers() {
        // Create vertex buffers
        // for(var i = 0; i < params.numParticles; i++) {
        //     console.log(this.mesh.vertices[i]);
        // }
        var extraParticles = params.numParticles * 6;
        this.totalParticles = params.numParticles + extraParticles;
        const vertices = new Float32Array((params.numParticles + extraParticles) * 4);   
        if(this.createRandom) {
            for (let i = 0; i < vertices.length; i+=4) {
                vertices[i] = Math.random() * 2 - 1;
                vertices[i + 1] = Math.random() * 2 - 1;
                vertices[i + 2] = Math.random() * 2 - 1;
                vertices[i + 3] = 1;             
            }
        } else {
            var count = 0;
            for (let i = 0; i < vertices.length; i +=28) {
                // Original point
                vertices[i] = this.mesh.vertices[count] / this.sizeDivide;
                vertices[i + 1] = this.mesh.vertices[count + 1] / this.sizeDivide;
                vertices[i + 2] = this.mesh.vertices[count + 2] / this.sizeDivide; 
                vertices[i + 3] = 1;

                if(!this.createTree) {
                    // Jittered points
                    vertices[i + 4] = this.mesh.vertices[count] / this.sizeDivide + Math.random() * 0.25 - 0.125;
                    vertices[i + 5] = this.mesh.vertices[count + 1] / this.sizeDivide + Math.random() * 0.25 - 0.125;
                    vertices[i + 6] = this.mesh.vertices[count + 2] / this.sizeDivide; 
                    vertices[i + 7] = 1;

                    vertices[i + 8] = this.mesh.vertices[count] / this.sizeDivide;
                    vertices[i + 9] = this.mesh.vertices[count + 1] / this.sizeDivide;
                    vertices[i + 10] = this.mesh.vertices[count + 2] / this.sizeDivide; 
                    vertices[i + 11] = 1;

                    vertices[i + 12] = this.mesh.vertices[count] / this.sizeDivide;
                    vertices[i + 13] = this.mesh.vertices[count + 1] / this.sizeDivide;
                    vertices[i + 14] = this.mesh.vertices[count + 2] / this.sizeDivide; 
                    vertices[i + 15] = 1;

                    vertices[i + 16] = this.mesh.vertices[count] / this.sizeDivide + Math.random() * 0.25 - 0.125;
                    vertices[i + 17] = this.mesh.vertices[count + 1] / this.sizeDivide + Math.random() * 0.25 - 0.125;
                    vertices[i + 18] = this.mesh.vertices[count + 2] / this.sizeDivide; 
                    vertices[i + 19] = 1;

                    vertices[i + 20] = this.mesh.vertices[count] / this.sizeDivide + Math.random() * 0.25 - 0.125;
                    vertices[i + 21] = this.mesh.vertices[count + 1] / this.sizeDivide + Math.random() * 0.25 - 0.125;
                    vertices[i + 22] = this.mesh.vertices[count + 2] / this.sizeDivide; 
                    vertices[i + 23] = 1;
                }
                count += 3;                   
            }
        }
        this.vertexBuffers = [
            createBufferFromArray(vertices),
            createBufferWithSize(this.totalParticles * 4 * 4)
        ];

        // Create velocity buffers
        const velocities = new Float32Array(this.totalParticles * 3);
        for (let i = 0; i < velocities.length; i++) {
            velocities[i] = 0;
        }

        this.velocityBuffers = [
            createBufferFromArray(velocities),
            createBufferWithSize(this.totalParticles * 3 * 4)
        ];

        // Create quad buffer
        const quadArray = new Float32Array([
            -1.0, -1.0,
            -1.0, 1.0,
            1.0, 1.0,
        
            1.0, 1.0,
            1.0, -1.0,
            -1.0, -1.0
        ]);
        this.quadBuffer = createBufferFromArray(quadArray);
    }

    createProgram() {
        // Create program with feedback
        this.programFeedback = createProgram(gl,
            vertexFeedbackShader,
            fragmentEmptyShader,
            ['v_position', 'v_velocity'],
            gl.SEPARATE_ATTRIBS
        );
        
        // Get uniform locations
        this.mousePosLocation = gl.getUniformLocation(this.programFeedback, "u_mouse");
        this.uniformClock = gl.getUniformLocation(this.programFeedback, "u_time");
        this.uniformViewProjectionMatrix = gl.getUniformLocation(this.programFeedback, "u_viewProjectionMatrix")
        
        // Create program to render particles
        this.programDisplay = createProgram(gl,
            vertexDisplayShader,
            fragmentDisplayShader
        );
        
        // Create program to post process framebuffer
        this.programPost = createProgram(gl,
            vertexPostShader,
            fragmentPostShader
        );
    }

    createVAO() {
        this.feedbackVAOs.push(createVAO([{
            data: this.vertexBuffers[0],
            location: VERTEX_ATTRIBUTE_POS,
            elementSize: 4
        },
        {
            data: this.velocityBuffers[0],
            location: VELOCITY_ATTRIBUTE_POS,
            elementSize: 3
        }]
        ));

        this.feedbackVAOs.push(createVAO([{
            data: this.vertexBuffers[1],
            location: VERTEX_ATTRIBUTE_POS,
            elementSize: 4
        },
        {
            data: this.velocityBuffers[1],
            location: VELOCITY_ATTRIBUTE_POS,
            elementSize: 3
        }]
        ));

        this.displayVAOs.push(createVAO([{
            data: this.vertexBuffers[0],
            location: VERTEX_ATTRIBUTE_POS,
            elementSize: 4
        }]));

        this.displayVAOs.push(createVAO([{
            data: this.vertexBuffers[1],
            location: VERTEX_ATTRIBUTE_POS,
            elementSize: 4
        }]));

        this.postVAO = createVAO([{
            data: this.quadBuffer,
            location: VERTEX_ATTRIBUTE_POS,
            elementSize: 2
        }]);
        
        // Create empty textures for framebuffer
        this.texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    }

    // Fill the current feedback buffer
    calculateFeedback(currentIndex) {
        // Create a framebuffer and attach the texture
        this.framebuffer = gl.createFramebuffer();

        // Create transform feedback
        this.transformFeedback = gl.createTransformFeedback();
        
        const invertedIndex = invert(currentIndex);
        // Disable rasterization, vertex processing only
        gl.enable(gl.RASTERIZER_DISCARD);

        gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, this.transformFeedback);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, this.vertexBuffers[invertedIndex]);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, this.velocityBuffers[invertedIndex]);

        gl.useProgram(this.programFeedback);
        gl.uniform2fv(this.mousePosLocation, mousePos);
        gl.uniform1f(this.uniformClock, this.clock); 
        gl.uniformMatrix4fv(this.uniformViewProjectionMatrix, false, this._viewProjectionMatrix);         

        gl.beginTransformFeedback(gl.POINTS);
        gl.bindVertexArray(this.feedbackVAOs[currentIndex]);
        gl.drawArrays(gl.POINTS, 0, this.totalParticles);
        gl.bindVertexArray(null);
        gl.endTransformFeedback();

        /* Re-activate rasterizer for next draw calls */
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
    }

    // Draw result from feedback to framebuffer
    drawToFrameBuffer(index) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.programDisplay);
        gl.bindVertexArray(this.displayVAOs[index]);
        gl.drawArrays(gl.POINTS, 0, this.totalParticles);
        gl.bindVertexArray(null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    drawQuad() {
        gl.useProgram(this.programPost);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        gl.uniform1i(this.texLocation, 0);
        gl.bindVertexArray(this.postVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    }
}

export default Renderer;
