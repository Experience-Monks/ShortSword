var Object3D = require('./Object3D');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');

function Mesh(geometry, material) {
	Object3D.call( this );
	this.geometry = geometry;
	this.material = material || new VoxelGradientMaterial();

	console.log('Mesh initialized!');
}

/**
 * Mesh extends Object3D
 */
Mesh.prototype = Object.create(Object3D.prototype);

module.exports = Mesh;
