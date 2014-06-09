var ArrayUtils = require('./Array');
var Geometry = require('../model/Geometry');

var attributeList = ["vertices"];
octTreeModes = {
	NORMAL : 0,
	SUPER_X : 1
};
var GeometryUtils = {
	octTreeSort: function() {
		var tree = [];
		var recurseTreeSortSuperX = function(vertices, loop) {
			loop--;
			vertices.sort(function(a, b) {return b.x - a.x});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) {
				if(loop) tempLow = recurseTreeSortSuperX(tempLow, loop);
				else tempLow = recurseTreeSortY(tempLow);
			}
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) {
				if(loop > 0) tempHigh = recurseTreeSortSuperX(tempHigh, loop);
				else tempHigh = recurseTreeSortY(tempHigh);
			}
			return [tempLow, tempHigh];
		}
		var recurseTreeSortX = function(vertices) {
			vertices.sort(function(a, b) {return b.x - a.x});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSortY(tempLow);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSortY(tempHigh);
			return [tempLow, tempHigh];
		}
		var recurseTreeSortY = function(vertices) {
			vertices.sort(function(a, b) {return b.y - a.y});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSortZ(tempLow);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSortZ(tempHigh);
			return [tempLow, tempHigh];
		}
		var recurseTreeSortZ = function(vertices) {
			vertices.sort(function(a, b) {return b.z - a.z});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSortX(tempLow);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSortX(tempHigh);
			return [tempLow, tempHigh];
		}

		var recurseUnroll = function(arrTree, arrFlat) {
			for (var i = 0; i < arrTree.length; i++) {
				if (arrTree[i] instanceof Array) recurseUnroll(arrTree[i], arrFlat);
				else arrFlat.push(arrTree[i]);
			};
		}

		var mode = octTreeModes.SUPER_X;

		return function(geometry) {
			var timeBefore = new Date;
			var total = geometry.vertices.length;
			
			switch(mode) {
				case octTreeModes.SUPER_X:
					geometry.vertices = recurseTreeSortSuperX(geometry.vertices, 8);
					break;
				default: 
					geometry.vertices = recurseTreeSortX(geometry.vertices);
			}
			var arrFlat = [];
			var timeMiddle = new Date;
			
			recurseUnroll(geometry.vertices, arrFlat);
			geometry.vertices = arrFlat;
			var timeAfter = new Date;
			
			return geometry;
		}
	}(),
	pairGeometry: function(geometry1, geometry2, attributeList) {
		var small = geometry1.vertices.length < geometry2.vertices.length ? geometry1 : geometry2;
		var large = small === geometry1 ? geometry2 : geometry1;
		for (var i = 0; i < attributeList.length; i++) {
			var attributeName = attributeList[i];
			var attributeSmall = small[attributeName];
			var attributeLarge = large[attributeName];
			
			var tS = attributeSmall.length;
			var tL = attributeLarge.length;
			for (var i = tS; i < tL; i++) {
				attributeSmall[i] = new THREE.Vector3().copy(attributeSmall[i%tS]);
			};
		}
	},
	computeGeometryDelta: function(geometry1, geometry2) {
		if(!this.checkIfGeometryAttributesLengthsMatch([geometry1, geometry2])) return;
		var delta = new Geometry();
		var length = geometry1[attributeList[0]].length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			var attrName = attributeList[ia];
			var workingAttribute = delta[attrName];
			var attribute1 = geometry1[attrName];
			var attribute2 = geometry2[attrName];
			for (var i = 0; i < length; i++) {
				workingAttribute[i] = attribute2[i].clone().sub(attribute1[i]);
			}
		}

		return delta;
	},
	updateGeometryDelta: function(delta, geometry1, geometry2, start, end) {
		if(!this.checkIfGeometryAttributesLengthsMatch([geometry1, geometry2])) return;
		var length = geometry1[attributeList[0]].length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			var attrName = attributeList[ia];
			var workingAttribute = delta[attrName];
			var attribute1 = geometry1[attrName];
			var attribute2 = geometry2[attrName];
			for (var i = workingAttribute.length; i < end; i++) {
				workingAttribute[i] = attribute1[i].clone();
			}
			for (var i = start; i < end; i++) {
				workingAttribute[i].copy(attribute2[i]).sub(attribute1[i]);
			}
		}
	},
	orderlyScramble: function(geometries, newOrder) {
		var timeBefore = new Date;
		
		if(!this.checkIfGeometryAttributesLengthsMatch(geometries)) return;
		var length = geometries[0][attributeList[0]].length;
		if(!newOrder) {
			newOrder = ArrayUtils.generateRandomOrder(length);
		}

		for (var ig = 0; ig < geometries.length; ig++) {
			for (var ia = 0; ia < attributeList.length; ia++) {
				var workingArray = geometries[ig][attributeList[ia]];
				var originalArray = geometries[ig][attributeList[ia]].slice(0);
				for (var i = 0; i < length; i++) {
					workingArray[i] = originalArray[newOrder[i]];
				};
			}
		}
		var timeAfter = new Date;

		return newOrder;
	},
	reduce: function(geometry, length) {
		var spliceLength = geometry.vertices.length - length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			geometry[attributeList[ia]].splice(length, spliceLength);
		}
	},
	increase: function(geometry, length) {
		while(geometry.vertices.length < length) {
			geometry.vertices = geometry.vertices.concat(
				geometry.vertices.slice(0, 
					Math.min(
						geometry.vertices.length,
						length - geometry.vertices.length
					)
				)
			)
		}
	},
	checkIfGeometryAttributesLengthsMatch : function(geometries) {
		var length = -1;
		for (var ig = 0; ig < geometries.length; ig++) {
			for (var ia = 0; ia < attributeList.length; ia++) {
				var lengthTemp = geometries[ig][attributeList[ia]].length;
				if(length == -1) {
					length = lengthTemp;
				} else if (length != lengthTemp) {
					console.log("WARNING: Geometries do not have the same length!!");
					return;
				}
			}
		}
		return true;
	},
	fillSurfaces : function(geometry, newTotalVertices) {
		var length = geometry[attributeList[0]].length;
		if(!geometry.faces || geometry.faces.length == 0) {
			console.log("WARNING: Cannot fill geometry unless it has faces defined");
			return -1;
		}
		var proportionalFaces = geometry.proportionalFaces || [];
		if(!geometry.proportionalFaces) {

			var facesByArea = geometry.faces.slice(0);
			facesByArea.sort(function(a, b) { return a.area - b.area; });

			var min = facesByArea[0].area;
			var median = facesByArea[~~(facesByArea.length * .5)].area;
			var max = facesByArea[facesByArea.length-1].area;

			var medianRatio = ~~(median / min);
			var maxRatio = ~~(max / min);
			while(maxRatio > 2000) {
				min *= 5;
				medianRatio = ~~(median / min);
				maxRatio = ~~(max / min);
			}

			
			for (var iF = 0; iF < facesByArea.length; iF++) {
				var face = facesByArea[iF];
				for (var i = ~~(face.area / min); i >= 0; i--) {
					proportionalFaces.push(face);
				};
			};

			ArrayUtils.orderlyScramble(proportionalFaces);
			
			geometry.proportionalFaces = proportionalFaces;
			geometry.lastProportionalFaceVisited = 0;
		}
		var pfLength = proportionalFaces.length;
		var lastProportionalFaceVisited = geometry.lastProportionalFaceVisited;
		for (var i = length; i < newTotalVertices; i++) {
			lastProportionalFaceVisited++;
			geometry.vertices.push(proportionalFaces[lastProportionalFaceVisited%pfLength].createRandomPoint())
		}
		geometry.lastProportionalFaceVisited = lastProportionalFaceVisited;
	},
	fillEitherSurfacesToMatch: function(geometry1, geometry2) {
		if(geometry1.vertices.length < geometry2.vertices.length) this.fillSurfaces(geometry1, geometry2.vertices.length);
		if(geometry2.vertices.length < geometry1.vertices.length) this.fillSurfaces(geometry2, geometry1.vertices.length);
	},
	quickBufferClone : function(dstBuffer, srcBuffer, newTotal) {
		for (var i = dstBuffer.length; i < newTotal; i++) {
			dstBuffer[i] = srcBuffer[i].clone();
		}
	}
}
module.exports = GeometryUtils;