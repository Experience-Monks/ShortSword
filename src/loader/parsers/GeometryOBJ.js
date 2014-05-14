var Geometry = require('../../model/Geometry');
var Face = require('../../model/Face');

function GeometryOBJParser() {
	console.log('GeometryOBJParser initialized!');
}

GeometryOBJParser.prototype = {
	parse: function(data, options) {
		options = options || {faces:true};
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
		
		var props = {
			vertices:vertices
		};

		if(options.faces) {
			var faces = [];
			for (var i = dataLines.length - 1; i >= 0; i--) {
				if(dataLines[i].indexOf("f ") == 0) {
					var faceData = dataLines[i].split(" ");
					faces.push(new Face(
							vertices[parseInt(faceData[2].split("/")[0])],
							vertices[parseInt(faceData[3].split("/")[0])],
							vertices[parseInt(faceData[4].split("/")[0])]
						)
					);
					if(faceDate.length == 5){
						faces.push(new Face(
								vertices[parseInt(faceData[4].split("/")[0])],
								vertices[parseInt(faceData[3].split("/")[0])],
								vertices[parseInt(faceData[5].split("/")[0])]
							)
						);
					}
				}
			};
		}

		return new Geometry(props);
	}
};

module.exports = new GeometryOBJParser();