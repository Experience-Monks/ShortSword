var Object3D = require('./Object3D');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');

function Mesh(geometry, material) {
	Object3D.call( this );
	this.geometry = geometry;
	this.material = material || new VoxelGradientMaterial();
	this.animators = [];

	console.log('Mesh initialized!');
}

/**
 * Mesh extends Object3D
 */
Mesh.prototype = Object.create(Object3D.prototype);

Mesh.prototype.addAnimator = function( animator ) {

	var rVal = animator;

	if( typeof rVal == 'function' ) {

		rVal = new animator( this );
	}

	this.animators.push( rVal );

	return rVal;
};

Mesh.prototype.updateGeometry = function() {};

module.exports = Mesh;
