var Geometry = require('../model/Geometry');
var Mesh = require('../model/Mesh');
function TestFactory() {
	
}

TestFactory.prototype = {
	createVoxelClusterMesh: function(totalVoxels, rangeBox3) {
		rangeBox3 = rangeBox3 || new THREE.Box3(
			new THREE.Vector3(-10, -10, -10),
			new THREE.Vector3(10, 10, 10)
		);
		var vertices = [];
		var basePos = rangeBox3.min;
		var rangeBox3Size = rangeBox3.max.clone().sub(rangeBox3.min);
		for (var i = 0; i < totalVoxels; i++) {
			vertices[i] = new THREE.Vector3(
				basePos.x + Math.random() * rangeBox3Size.x,
				basePos.y + Math.random() * rangeBox3Size.y,
				basePos.z + Math.random() * rangeBox3Size.z
			);
		};
		var geometry = new Geometry({
			vertices : vertices
		});
		return new Mesh(geometry);
	},
	createVoxelCubeMesh: function(totalVoxels, size) {
		size = size || 10;
		var sizeHalf = size * .5;
		return this.createVoxelClusterMesh(
			totalVoxels,
			new THREE.Box3(
				new THREE.Vector3(-sizeHalf, -sizeHalf, -sizeHalf),
				new THREE.Vector3(sizeHalf, sizeHalf, sizeHalf)
			)
		);
	}
};

module.exports = new TestFactory();