var Geometry = require('../../model/Geometry');
var Face = require('../../model/Face');

function GeometryJSONParser() {
	
}

GeometryJSONParser.prototype = {
	parse: function(dataString, options) {
		var data = JSON.parse(dataString);
		options = options || {};
		options.faces = options.faces === undefined ? true : options.faces;
		var transform = options.transform = options.transform !== undefined ? options.transform : {};
		var offset = transform.offset = transform.offset !== undefined ? transform.offset : {};
		offset.x = offset.x !== undefined ? offset.x : 0;
		offset.y = offset.y !== undefined ? offset.y : 0;
		offset.z = offset.z !== undefined ? offset.z : 0;
		var scale = transform.scale = transform.scale !== undefined ? transform.scale : 1;
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
		offset.x /= scale;
		offset.y /= scale;
		offset.z /= scale;
		centroid.add(offset);
		for (var i = vertices.length - 1; i >= 0; i--) {
			vertices[i].x -= centroid.x;
			vertices[i].y -= centroid.y;
			vertices[i].z -= centroid.z;
			vertices[i].x *= scale;
			vertices[i].y *= scale;
			vertices[i].z *= scale;
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
						vertices[faceData[0]],
						vertices[faceData[1]],
						vertices[faceData[2]]
					)
				);
			};
			props.faces = faces;
		}

		return new Geometry(props);
	}
};

module.exports = new GeometryJSONParser();