var Mesh = require('./Mesh');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');

function BlendMesh(geometry1, geometry2, material) {
	this.geometry1 = geometry1;
	this.geometry2 = geometry2;
	this.blend = 0;
	Mesh.call( this, geometry1.clone(), material);
	this.attributeList = ["vertices"];

	console.log('BlendMesh initialized!');
}

/**
 * BlendMesh extends Object3D
 */
BlendMesh.prototype = Object.create(Mesh.prototype);

BlendMesh.prototype.updateGeometry = function() {
	var blend = this.blend;
	for (var i = 0; i < this.attributeList.length; i++) {
		var attributeName = this.attributeList[i];
		var attribute = this.geometry[attributeName];
		var attribute1 = this.geometry1[attributeName];
		var attribute2 = this.geometry2[attributeName];
		var t1 = attribute1.length;
		var t2 = attribute2.length;
		var t = t1 > t2 ? t1 : t2;
		if (attribute.length < t) {
			for (var i = attribute.length; i < t; i++) {
				attribute[i] = new THREE.Vector3();
			};
		}
		var temp = new THREE.Vector3();
		for (var i = 0; i < t; i++) {
			attribute[i].copy(
				attribute1[i%t1]
			).add(
				temp.copy(attribute2[i%t2]).sub(
					attribute1[i%t1]
				).multiplyScalar(blend)
			)
		};
	}
};

module.exports = BlendMesh;
