require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Geometry(props) {
	props = props || {};

	this.vertices = props.vertices || [];
	this.drawOrder = [];
	this.faces = props.faces || [];
	this.materialIndex = props.materialIndex || [];
}

Geometry.prototype = {
	updateDrawOrderLength: function(total) {
		if(total == this.vertices.length) return;
		var drawOrder = this.drawOrder;

		for (var i = 0; i < total; i++) {
			drawOrder[i] = i;
		};
		if(drawOrder.length > total) {
			drawOrder.splice(total, drawOrder.length - total);
		}

	},
	clone: function() {
		vertices = [];
		for (var i = 0; i < this.vertices.length; i++) {
			vertices[i] = this.vertices[i].clone();
		};
		faces = [];
		for (var i = 0; i < this.faces.length; i++) {
			faces[i] = this.faces[i].clone();
		};
		drawOrder = this.drawOrder.slice(0);
		materialIndex = this.materialIndex.slice(0);
		return new Geometry({
			vertices: vertices,
			drawOrder: drawOrder,
			faces: faces,
			materialIndex: materialIndex
		});
	}
};
module.exports = Geometry;
