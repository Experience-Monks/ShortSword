require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Geometry(props) {
	props = props || {};

	this.vertices = props.vertices || [];
	
	console.log('Geometry initialized!');
}

Geometry.prototype = {
	clone: function() {
		vertices = [];
		for (var i = 0; i < this.vertices.length; i++) {
			vertices[i] = this.vertices[i].clone();
		};
		return new Geometry({
			vertices: vertices
		});
	}
};
module.exports = Geometry;
