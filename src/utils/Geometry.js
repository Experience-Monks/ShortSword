var Geometry = require('../model/Geometry');

var attributeList = ["vertices"];
var GeometryUtils = {
	octTreeSort: function() {
		var tree = [];
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

		return function(geometry) {
			var timeBefore = new Date;
			console.log("octtree start!!!");
			geometry.vertices = recurseTreeSortX(geometry.vertices);
			var arrFlat = [];
			var timeMiddle = new Date;
			console.log("octree sorted " + geometry.vertices.length + " vertices in " + (timeMiddle-timeBefore) + "ms");
			recurseUnroll(geometry.vertices, arrFlat);
			geometry.vertices = arrFlat;
			var timeAfter = new Date;
			console.log("octreed " + geometry.vertices.length + " vertices in " + (timeAfter-timeBefore) + "ms");
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
			for (var i = attribute1.length; i < end; i++) {
				workingAttribute[i] = attribute1[i].clone();
			}
			for (var i = start; i < end; i++) {
				workingAttribute[i].copy(attribute2[i]).sub(attribute1[i]);
			}
		}
	},
	orderlyScramble: function(geometries) {
		if(!this.checkIfGeometryAttributesLengthsMatch(geometries)) return;
		var length = geometries[0][attributeList[0]].length;
		var order = [];
		for (var i = 0; i < length; i++) {
			order[i] = i;
		};

		var newOrder = [];
		for (var i = 0; i < length; i++) {
			var randomIndex = ~~(Math.random() * order.length);
			newOrder[i] = order[randomIndex];
			order.splice(randomIndex, 1);
		};

		for (var ig = 0; ig < geometries.length; ig++) {
			for (var ia = 0; ia < attributeList.length; ia++) {
				var workingArray = geometries[ig][attributeList[ia]];
				var originalArray = geometries[ig][attributeList[ia]].slice(0);
				for (var i = 0; i < length; i++) {
					workingArray[i] = originalArray[newOrder[i]];
				};
			}
		}
	},
	reduce: function(geometry, length) {
		var spliceLength = geometry.vertices.length - length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			geometry[attributeList[ia]].splice(length, spliceLength);
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
		}

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

		//console.log(medianRatio);
		//console.log(maxRatio);

		var proportionalFaces = [];
		for (var iF = 0; iF < facesByArea.length; iF++) {
			var face = facesByArea[iF];
			for (var i = ~~(face.area / min); i >= 0; i--) {
				proportionalFaces.push(face);
			};
		};
		//console.log(facesByArea.length, proportionalFaces.length);

		var pfLength = proportionalFaces.length;
		for (var i = length; i < newTotalVertices; i++) {
			geometry.vertices.push(proportionalFaces[i%pfLength].createRandomPoint())
		}
	},
	quickBufferClone : function(dstBuffer, srcBuffer, newTotal) {
		for (var i = dstBuffer.length; i < newTotal; i++) {
			dstBuffer[i] = srcBuffer[i].clone();
		}
	}
}
module.exports = GeometryUtils;