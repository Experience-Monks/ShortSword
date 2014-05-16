var BaseAnimator = function( mesh ) {

	this.mesh = mesh;
	this.dirty = true;
};

BaseAnimator.prototype.update = function() {};
BaseAnimator.prototype.updateVertex = function( vertexIDX ) {};

module.exports = BaseAnimator;