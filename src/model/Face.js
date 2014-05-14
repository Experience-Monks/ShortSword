require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Face(v1, v2, v3) {
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;
}

Face.prototype = {
	createRandomPoint: function() {
		return this.v1.clone().lerp(this.v2, Math.random()).lerp(this.v3, Math.pow(Math.random(), 2));
	},
	clone: function() {
		return new Face(this.v1, this.v2, this.v3);
	}
};
module.exports = Face;
