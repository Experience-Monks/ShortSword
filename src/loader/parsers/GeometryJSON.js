var Geometry = require('../../model/Geometry');
var Face = require('../../model/Face');

function GeometryJSONParser() {
	
}

GeometryJSONParser.prototype = {
	parse: function(dataString, options) {
		var data = JSON.parse(dataString);
		options = options || {};
		options.faces = options.faces === undefined ? true : options.faces;
		options.offset = options.offset !== undefined ? options.offset : {};
		options.offset.x = options.offset.x !== undefined ? options.offset.x : 0;
		options.offset.y = options.offset.y !== undefined ? options.offset.y : 0;
		options.offset.z = options.offset.z !== undefined ? options.offset.z : 0;
		var inVertices = data.vertices;
		var vertices = [];
		for (var i = 0, len = data.vertices.length; i < len; i++) {
			var inVertex = inVertices[i];
			vertices.push(new THREE.Vector3(
					inVertex.x,
					inVertex.y,
					inVertex.z
				)
			);
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
			var inFaces = data.faces;
			for (var i = 0, len = inFaces.length; i < len; i++) {
				var faceData = inFaces[i];
				faces.push(new Face(
						vertices[faceData.x-1],
						vertices[faceData.y-1],
						vertices[faceData.z-1]
					)
				);
			};
			props.faces = faces;
		}

		return new Geometry(props);
	}
};

module.exports = new GeometryJSONParser();