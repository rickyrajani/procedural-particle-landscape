import { Vector3 } from 'three';
import Branch from './branch'
import Leaf from './leaf'

class Tree
{
    constructor(position) {
        this.doneGrowing = false;
        this.repeat = 0;
        this.prevLeafCount = 0;
        this.repeatNum = 40;

        this.position = position;
        this.leafCount = 800;
        this.treeWidth = 110;
        this.treeHeight = 200;
        this.trunkHeight = 5;
        this.minDistance = 2;
        this.maxDistance = 15;
        this.branchLength = 2;

        this.root;
        this.leaves;
        this.branches;

        this.meshProvided = false;
        this.offset = this.treeHeight / 4;
    }
 
    generateCrown() {
        this.leaves = new Set();
        
        if(this.meshProvided) {
            var index = 0;
            for(var i = 0; i < this.leafCount; i++) {
                let pos = new Vector3((this.mesh.vertices[index] / this.scale) * this.treeWidth, 
                                      (this.mesh.vertices[index + 1] / this.scale) * this.treeHeight - this.offset,
                                      (this.mesh.vertices[index + 2] / this.scale) * this.treeWidth);
                let leaf = new Leaf(pos);
                this.leaves.add(leaf);
                index += 3;
            }
        }
        else {
            for(var i = 0; i < this.leafCount; i++) {
                let pos = new Vector3(Math.random() * this.treeWidth - this.treeWidth / 2, 
                                      Math.random() * this.treeHeight - this.treeHeight / 2, 
                                      Math.random() * this.treeWidth - this.treeWidth / 2);
                let leaf = new Leaf(pos);
                this.leaves.add(leaf);
            }
        }
    }
     
    generateTrunk()
    {
        var branches = [];

        var root = new Branch(null, this.position, new Vector3(0, -1, 0));
        branches[0] = [root.position, root];
 
        var curr = new Branch(root, new Vector3(this.position.x, this.position.y - this.branchLength, 0), new Vector3(0, -1, 0));
        branches[1] = [curr.position, curr];
 
        //Keep growing trunk upwards until we reach a leaf 
        var count = 2;
        var temp = new Vector3(root.position.x, root.position.y, root.position.z);
        temp = temp.sub(curr.position);
        while (temp.length() < this.trunkHeight)
        {
            let trunk = new Branch(curr, new Vector3(curr.position.x, curr.position.y - this.branchLength, curr.position.z), new Vector3(0, -1, 0));
            branches[count] = [trunk.position, trunk];
            count++;
            curr = trunk;
            temp = new Vector3(root.position.x, root.position.y, root.position.z);
            temp = temp.sub(curr.position);
        }
        
        this.branches = new Map(branches);        
    }
 
    grow()
    {
        if (this.doneGrowing) return;
        this.prevLeafCount = this.leafCount;
 
        //If no leaves left, we are done
        if (this.leafCount == 0 || this.repeat > this.repeatNum) { 
            this.doneGrowing = true; 
            return; 
        }
        var branchesIter1 = this.branches.values();
 
        // Process the leaves
        for (let currLeaf of this.leaves)
        {
            if(currLeaf == null) {
                continue;
            }
            branchesIter1 = this.branches.values();
            let leafRemoved = false;
 
            currLeaf.closestBranch = null;
            var direction = new Vector3(0, 0, 0);
 
            // Find the nearest branch for this leaf
            for(let b; !(b = branchesIter1.next()).done;)
            {
                b = b.value;
                direction = new Vector3(currLeaf.position.x, 
                                        currLeaf.position.y, 
                                        currLeaf.position.z);
                direction = direction.sub(b.position); //direction to branch from leaf
                var distance = Math.round(direction.length()); //distance to branch from leaf
                direction.normalize();
 
                if (distance <= this.minDistance) // Min leaf distance reached, we remove it
                {
                    this.leaves.delete(currLeaf);                        
                    leafRemoved = true;
                    this.leafCount--;
                    break;
                }
                else if (distance <= this.maxDistance) // branch in range, determine if it is the nearest
                {
                    var posTemp = new Vector3(currLeaf.position.x,
                                              currLeaf.position.y,
                                              currLeaf.position.z);
                    if (currLeaf.closestBranch == null) {
                        currLeaf.closestBranch = b;
                    }
                    else if ((posTemp.sub(currLeaf.closestBranch.position)).length() > distance) {
                        currLeaf.closestBranch = b;
                    }
                }
            }
 
            // If the leaf was removed then skip
            if (!leafRemoved)
            {
                // Set the grow parameters on all the closest branches that are in range
                if (currLeaf.closestBranch != null)
                {
                    var dir = new Vector3(currLeaf.position.x,
                                          currLeaf.position.y,
                                          currLeaf.position.z);
                    dir = dir.sub(currLeaf.closestBranch.position);
                    dir.normalize();
                    currLeaf.closestBranch.growDirection = (currLeaf.closestBranch.growDirection).add(dir); //add to grow direction of branch
                    currLeaf.closestBranch.growCount++;
                }
            }
        }
 
        //Generate the new branches
        var branchesIter = this.branches.values();
        var newBranches = []
        var count = 0;
        for(let b; !(b = branchesIter.next()).done;)
        {
            b = b.value;
            if (b.growCount > 0) // if at least one leaf is affecting the branch
            {
                var avgDirection = new Vector3(0, 0, 0);
                avgDirection.x = b.growDirection.x / b.growCount;
                avgDirection.y = b.growDirection.y / b.growCount;
                avgDirection.z = b.growDirection.z / b.growCount;
                
                avgDirection.normalize();

                var avgDirPlusBranch = new Vector3(0, 0, 0);
                avgDirPlusBranch.x = avgDirection.x * this.branchLength;
                avgDirPlusBranch.y = avgDirection.y / this.branchLength;
                avgDirPlusBranch.z = avgDirection.z / this.branchLength;
                
                var temp = new Vector3(b.position.x, b.position.y, b.position.z);
                var temp = temp.add(avgDirPlusBranch);
                
                var newBranch = new Branch(b, temp, avgDirection);
 
                newBranches[count] = newBranch;
                count++;
                b.Reset();
            }
        }

        //Add the new branches to the tree
        var branchAdded = false;
        for(let i = 0; i < count; i++)
        {
            var newBranchAdd = newBranches[i];
            //Check if branch already exists.  These cases seem to happen when leaf is in specific areas
            var existing = this.branches.has(newBranchAdd.position);
            if (!existing)
            {
                this.branches.set(newBranchAdd.position, newBranchAdd);
                branchAdded = true;
            }
        }
 
        //if no branches were added - we are done
        //this handles issues where leaves equal out each other, making branches grow without ever reaching the leaf
        if (!branchAdded) {
            this.doneGrowing = true;
        }
        var treeMesh = this.branches.keys();
        var vertices = [];
        var count = 0;
        var index = 0;

        for(let vec; !(vec = treeMesh.next()).done;) {
          vertices[index] = vec.value.x;
          vertices[index + 1] = vec.value.y;
          vertices[index + 2] = vec.value.z;
          count++;
          index += 3;
        }
        
        var mesh = {
          vertices: new Float32Array(vertices),
          vertexCount: count,
        };

        if(this.prevLeafCount == this.leafCount) {
            this.repeat++;
        }

        return mesh;
    }
}

export default Tree;
