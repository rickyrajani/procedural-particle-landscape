import { Vector3 } from 'three';

class Branch
{
    constructor(parent, position, growDirection) {
        this.parent = parent;
        this.position = position;
        this.growDirection = growDirection;
        this.originalGrowDirection = growDirection;
        this.growCount = 0;
    }
 
    Reset()
    {
        this.growCount = 0;
        this.growDirection = this.originalGrowDirection;
    }
}

export default Branch
