/**
 * BaseAnimator is the base class for all animators.
 * 
 * @class BaseAnimator
 * @constructor
 * @param {Mesh} mesh This is the mesh on which animation should happen.
 */
var BaseAnimator = function( mesh ) {

	this.mesh = mesh;
	this.dirty = true;
};

/**
 * Update is called immediately before the animator is run over every vertex.
 * 
 * It's handy to for instance reininialize the animator before vertices are updated.
 *
 * @method update
 */
BaseAnimator.prototype.update = function() {};

/**
 * Update vertex is called on every vertex of a mesh. This is where the animator should
 * perform calculations to make things well... animate.
 * 
 * @param  {Number} vertexIDX This is the current vertex index of the mesh the animator is assigned to.
 */
BaseAnimator.prototype.updateVertex = function( vertexIDX ) {};

module.exports = BaseAnimator;