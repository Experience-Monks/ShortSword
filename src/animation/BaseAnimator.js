var BaseAnimator = function( mesh ) {

	this.mesh = mesh;
	this.dirty = true;
};

BaseAnimator.prototype.update = function( vertexIDX ) {};

module.exports = BaseAnimator;