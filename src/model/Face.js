require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Face(v1, v2, v3) {
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;

	var temp = new THREE.Vector3();
	//edge lengths;
	var a = temp.copy(v1).sub(v2).length();
	var b = temp.copy(v2).sub(v3).length();
	var c = temp.copy(v3).sub(v1).length();
	//semiperimeter
	var s = (a + b + c) * .5;

	this.area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
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
