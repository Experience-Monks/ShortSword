var Mesh = require('./Mesh');
var GeometryUtils = require('../utils/Geometry');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');
var PerformanceTweaker = require('../utils/PerformanceTweaker');

function BlendMesh(geometry1, geometry2, material, cacheRelative) {
	cacheRelative = cacheRelative === undefined ? true : false;
	this.attributeList = ["vertices"];
	GeometryUtils.pairGeometry(geometry1, geometry2, this.attributeList);
	this.geometry1 = GeometryUtils.octTreeSort(geometry1);
	this.geometry2 = GeometryUtils.octTreeSort(geometry2);
	GeometryUtils.orderlyScramble([geometry1, geometry2]);
	var geometry = geometry1.clone();
	this.blend = 0;

	if(cacheRelative) {
		this.updateGeometry = this._updateGeometryRelative;
		this.geometryDelta = GeometryUtils.computeGeometryDelta(this.geometry1, this.geometry2);
	} else {
		this.updateGeometry = this._updateGeometry;
	}
	Mesh.call( this, geometry, material);

	console.log('BlendMesh initialized!');
}

/**
 * BlendMesh extends Object3D
 */
BlendMesh.prototype = Object.create(Mesh.prototype);

BlendMesh.prototype._updateGeometry = function() {
	var temp = new THREE.Vector3();
	return function() {
		var blend = this.blend;
		for (var i = 0; i < this.attributeList.length; i++) {
			var attributeName = this.attributeList[i];
			var attribute = this.geometry[attributeName];
			var attribute1 = this.geometry1[attributeName];
			var attribute2 = this.geometry2[attributeName];
			var t = ~~(attribute1.length / PerformanceTweaker.denominatorSquared);
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
	}
}();

BlendMesh.prototype._updateGeometryRelative = function() {
	var temp = new THREE.Vector3();
	return function() {
		var blend = this.blend;
		for (var i = 0; i < this.attributeList.length; i++) {
			var attributeName = this.attributeList[i];
			var attribute = this.geometry[attributeName];
			var attribute1 = this.geometry1[attributeName];
			var attributeDelta = this.geometryDelta[attributeName];
			var t = ~~(attribute1.length / PerformanceTweaker.denominator);
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
