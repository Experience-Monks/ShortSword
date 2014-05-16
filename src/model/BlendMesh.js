var Mesh = require('./Mesh');
var GeometryUtils = require('../utils/Geometry');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');
var PerformanceTweaker = require('../utils/PerformanceTweaker');
var AnimatorVertexBlend = require( '../animation/AnimatorVertexBlend' );

function BlendMesh(geometry1, geometry2, material, cacheRelative) {

	cacheRelative = cacheRelative === undefined ? true : false;
	this.attributeList = ["vertices"];
	this._blend = 0;
	
	GeometryUtils.pairGeometry(geometry1, geometry2, this.attributeList);

	this.geometry1 = GeometryUtils.octTreeSort(geometry1);
	this.geometry2 = GeometryUtils.octTreeSort(geometry2);

	GeometryUtils.orderlyScramble([geometry1, geometry2]);

	if(cacheRelative) {
		this.updateGeometry = this._updateGeometryRelative;
		this.geometryDelta = GeometryUtils.computeGeometryDelta(this.geometry1, this.geometry2);

		Mesh.call( this, this.geometry1.clone(), material );
	} else {

		this.blendAni = this.addAnimator( AnimatorVertexBlend );
		this.blendAni.push( geometry2 );

		Mesh.call( this, this.geometry1, material );
	}
}

/**
 * BlendMesh extends Object3D
 */
BlendMesh.prototype = Object.create(Mesh.prototype);

Object.defineProperty( BlendMesh.prototype, 'blend', {

	get: function() {

		return this._blend;
	},

	set: function( value ) {

		this._blend = value;

		if( this.blendAni )
			this.blendAni.setPercentage( value );
	}
});

// BlendMesh.prototype._updateGeometry = function() {
// 	var temp = new THREE.Vector3();
// 	return function() {
// 		var blend = this.blend;
// 		for (var i = 0; i < this.attributeList.length; i++) {
// 			var attributeName = this.attributeList[i];
// 			var attribute = this.geometry[attributeName];
// 			var attribute1 = this.geometry1[attributeName];
// 			var attribute2 = this.geometry2[attributeName];
// 			var t = ~~(attribute1.length / PerformanceTweaker.denominatorSquared);
// 			for (var i = 0; i < t; i++) {
// 				attribute[i].copy(
// 					attribute1[i]
// 				).add(
// 					temp.copy(attribute2[i]).sub(
// 						attribute1[i]
// 					).multiplyScalar(blend)
// 				)
// 			};
// 		}
// 	}
// }();

BlendMesh.prototype._updateGeometryRelative = function() {
	var temp = new THREE.Vector3();
	return function() {
		var blend = this.blend;
		for (var i = 0; i < this.attributeList.length; i++) {
			var attributeName = this.attributeList[i];
			var attribute = this.geometry[attributeName];
			var attribute1 = this.geometry1[attributeName];
			var attributeDelta = this.geometryDelta[attributeName];
			var t = ~~(attribute1.length / PerformanceTweaker.denominatorSquared);
			//var t = attribute1.length;
			for (var i = 0; i < t; i++) {
				attribute[i].copy(
					attribute1[i]
				).add(
					temp.copy(attributeDelta[i]).multiplyScalar(blend)
				)
			};
		}
	}
}();

module.exports = BlendMesh;
