var Geometry = require('../../model/Geometry');

function GeometryOBJParser() {
	console.log('GeometryOBJParser initialized!');
}

GeometryOBJParser.prototype = {
	parse: function(data) {
		var dataLines = data.split('\n');
		var vertices = [];
		for (var i = dataLines.length - 1; i >= 0; i--) {
			if(dataLines[i].indexOf("v ") == 0) {
				var vertData = dataLines[i].split(" ");
				vertices.push(new THREE.Vector3(
						parseFloat(vertData[2]),
						parseFloat(vertData[3]),
						parseFloat(vertData[4])
					)
				);
			}
		};

		var jump = 100;
		var totalSamples = 0;
		var centroid = new THREE.Vector3();
		for (var i = 0; i < vertices.length; i+=jump) {
			totalSamples++;
			centroid.add(vertices[i]);
		};
		centroid.multiplyScalar(1/totalSamples);
		console.log("recentered", centroid);
		for (var i = vertices.length - 1; i >= 0; i--) {
			vertices[i].x -= centroid.x;
			vertices[i].y -= centroid.y;
			vertices[i].z -= centroid.z;
		};
		return new Geometry({
			vertices:vertices
		});
	}
};

module.exports = new GeometryOBJParser();