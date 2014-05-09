var Mesh = require('./Mesh');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');

function BlendMesh(geometry1, geometry2, material) {
	this.geometry1 = geometry1;
	this.geometry2 = geometry2;
	this._blend = 0;
	Mesh.call( this, geometry1.clone(), material);

	console.log('BlendMesh initialized!');
}

/**
 * BlendMesh extends Object3D
 */
BlendMesh.prototype = Object.create(Mesh.prototype);

BlendMesh.prototype.updateGeometry = function() {

};

module.exports = BlendMesh;
