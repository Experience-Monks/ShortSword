var Mesh = require('./Mesh');
var GeometryUtils = require('../utils/Geometry');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');

function BlendMesh(geometry1, geometry2, material) {
	this.attributeList = ["vertices"];
	GeometryUtils.pairGeometry(geometry1, geometry2, this.attributeList);
	this.geometry1 = GeometryUtils.octTreeSort(geometry1);
	this.geometry2 = GeometryUtils.octTreeSort(geometry2);
	var geometry = geometry1.clone();
	this.blend = 0;
	Mesh.call( this, geometry, material);

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
		var t = attribute1.length;
		var temp = new THREE.Vector3();
		for (var i = 0; i < t; i++) {
			attribute[i].copy(
				attribute1[i]
			).add(
				temp.copy(attribute2[i]).sub(
					attribute1[i]
				).multiplyScalar(blend)
			)
		};
	}
};

module.exports = BlendMesh;
