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
	}
}
module.exports = GeometryUtils;