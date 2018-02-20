import { Vector3 } from 'three';
import { Branch } from './branch'

class Leaf
{
    constructor(position) {
        this.position = position;
        this.closestBranch;
    }
}

export default Leaf
