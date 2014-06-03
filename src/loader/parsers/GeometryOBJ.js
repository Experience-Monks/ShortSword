var Geometry = require('../../model/Geometry');
var Face = require('../../model/Face');

function GeometryOBJParser() {
	
}

GeometryOBJParser.prototype = {
	parse: function(data, options) {
		options = options || {};
		options.faces = options.faces === undefined ? true : options.faces;
		options.offset = options.offset !== undefined ? options.offset : {};
		options.offset.x = options.offset.x !== undefined ? options.offset.x : 0;
		options.offset.y = options.offset.y !== undefined ? options.offset.y : 0;
		options.offset.z = options.offset.z !== undefined ? options.offset.z : 0;
		var dataLines = data.split('\n');
		var vertices = [];
		var length = dataLines.length - 1;
		for (var i = 0; i < length; i++) {
			if(dataLines[i].indexOf("v ") == 0) {
				var vertData = dataLines[i].split(" ");
				for (var iVD = vertData.length - 1; iVD >= 0; iVD--) {
					if(vertData[iVD] == "" || vertData[iVD] == " " || vertData[iVD] == "v") vertData.splice(iVD, 1);
				};
				vertices.push(new THREE.Vector3(
						parseFloat(vertData[0]),
						parseFloat(vertData[1]),
						parseFloat(vertData[2])
					)
				);
			}
		};

		var jump = ~~(vertices.length / 1000);
		if(jump == 0) jump = 1;
		var totalSamples = 0;
		var centroid = new THREE.Vector3();
		for (var i = 0; i < vertices.length; i+=jump) {
			totalSamples++;
			centroid.add(vertices[i]);
		};
		centroid.multiplyScalar(1/totalSamples);
		centroid.add(options.offset);
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
					for (var iFD = faceData.length - 1; iFD >= 0; iFD--) {
						var dataChunk = faceData[iFD];
						if(dataChunk == "" || dataChunk == " " || dataChunk == "f") faceData.splice(iFD, 1);
					};
					faces.push(new Face(
							vertices[parseInt(faceData[0].split("/")[0])-1],
							vertices[parseInt(faceData[1].split("/")[0])-1],
							vertices[parseInt(faceData[2].split("/")[0])-1]
						)
					);
					if(faceData.length == 4){
						faces.push(new Face(
								vertices[parseInt(faceData[0].split("/")[0])-1],
								vertices[parseInt(faceData[2].split("/")[0])-1],
								vertices[parseInt(faceData[3].split("/")[0])-1]
							)
						);
					}
				}
			};
			props.faces = faces;
		}

		return new Geometry(props);
	}
};

module.exports = new GeometryOBJParser();