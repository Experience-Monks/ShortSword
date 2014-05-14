require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Face(v1, v2, v3) {
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;
	if(v1 === undefined || v2 === undefined || v3 === undefined) throw("WTF");
}

Face.prototype = {
	createRandomPoint: function() {
		return this.v1.clone().lerp(this.v2, Math.random()).lerp(this.v3, Math.pow(Math.random(), 2));
	}
};
module.exports = Face;
