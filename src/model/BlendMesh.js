var Mesh = require('./Mesh');
var GeometryUtils = require('../utils/Geometry');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');
var AnimatorVertexBlend = require( '../animation/AnimatorVertexBlend' );

function BlendMesh(geometry1, geometry2, material) {
	
	this.attributeList = ["vertices"];
	this._blend = 0;
	
	GeometryUtils.pairGeometry(geometry1, geometry2, this.attributeList);

	this.geometry2 = GeometryUtils.octTreeSort(geometry2);
	
	Mesh.call( this, GeometryUtils.octTreeSort(geometry1), material);

	this.blendAni = this.addAnimator( AnimatorVertexBlend );
	this.blendAni.push( geometry2 );
}

/**
 * BlendMesh extends Object3D
 */
BlendMesh.prototype = Object.create(Mesh.prototype);

Object.defineProperty( BlendMesh.prototype, 'blend', {

	get: function() {

		return this.blendAni.getPercentage();
	},

	set: function( value ) {

		this.blendAni.setPercentage( value );
	}
});

// BlendMesh.prototype.updateGeometry = function() {
// 	var blend = this.blend;
// 	for (var i = 0; i < this.attributeList.length; i++) {
// 		var attributeName = this.attributeList[i];
// 		var attribute = this.geometry[attributeName];
// 		var attribute1 = this.geometry1[attributeName];
// 		var attribute2 = this.geometry2[attributeName];
// 		var t = attribute1.length;
// 		var temp = new THREE.Vector3();
// 		for (var i = 0; i < t; i++) {
// 			attribute[i].copy(
// 				attribute1[i]
// 			).add(
// 				temp.copy(attribute2[i]).sub(
// 					attribute1[i]
// 				).multiplyScalar(blend)
// 			)
// 		};
// 	}
// };

module.exports = BlendMesh;
