import { gl, mousePos } from '../init';
import { mat3, mat4, vec4 } from 'gl-matrix';
import { params } from '../main'
import { Vector3, Vector4 } from 'three';

class SpaceColon {
    constructor() {
        this.treeCrown = [];
        this.numLeaves = 50;
        this.doneGrowing = false;
        this.minDistance = 0.1;
        this.maxDistance = 0.3;
    }

    createTreeCrown() {
        for(var i = 0; i < this.numLeaves; i++) {
            let leaf = Vector3(Math.random() - 0.5, 
                               Math.random() - 0.5, 
                               Math.random() - 0.5);
            this.treeCrown[i] = leaf;
        }
    }

    update() {
        if(this.doneGrowing) {
            return;
        }

        // Terminate if no more leaves left
        if(this.numLeaves == 0) {
            this.doneGrowing = true;
        }

        // Process the leaves
        for(var i = 0; i < this.numLeaves; i++) {
            let leafRemoved = false;
        }
    }
}
    
export default SpaceColon;
