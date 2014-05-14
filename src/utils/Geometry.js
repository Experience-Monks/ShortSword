var Geometry = require('../model/Geometry');

var attributeList = ["vertices"];
var GeometryUtils = {
	octTreeSort: function() {
		var tree = [];
		var axises = ["x", "y", "z"];
		var recurseTreeSort = function(vertices, axis) {
			vertices.sort(function(a, b) {return b[axis] - a[axis]});
			axis = axises[(axises.indexOf(axis) + 1) % axises.length];
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSort(tempLow, axis);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSort(tempHigh, axis);
			return [tempLow, tempHigh];
		}

		var recurseUnroll = function(arrTree, arrFlat) {
			for (var i = 0; i < arrTree.length; i++) {
				if (arrTree[i] instanceof Array) recurseUnroll(arrTree[i], arrFlat);
				else arrFlat.push(arrTree[i]);
			};
		}

		return function(geometry) {
			geometry.vertices = recurseTreeSort(geometry.vertices, "x");
			var arrFlat = [];
			recurseUnroll(geometry.vertices, arrFlat);
			geometry.vertices = arrFlat;
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
	checkIfGeometryAttributesLengthsMatch : function(geometries) {
		var length = -1;
		for (var ig = 0; ig < geometries.length; ig++) {
			for (var ia = 0; ia < attributeList.length; ia++) {
				var lengthTemp = geometries[ig][attributeList[ia]].length;
				if(length == -1) {
					length = lengthTemp;
				} else if (length != lengthTemp) {
					console.log("WARNING: Could not orderly scramble geometries that have inconsistent/varying buffer lengths. Please pairGeometry() them first.");
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
		for (var i = length; i < newTotalVertices; i++) {
			geometry.vertices.push(geometry.faces[~~(Math.random() * geometry.faces.length)].createRandomPoint())
		}
	}
}
module.exports = GeometryUtils;