var BaseAnimator = require( './BaseAnimator' );

var AnimatorBlendVertex = function( mesh ) {

	BaseAnimator.call( this, mesh );

	this.velocityX = 1;
	this.velocityY = 1;
	this.velocityZ = 1;
};

var p = AnimatorBlendVertex.prototype = Object.create( BaseAnimator.prototype );

p.update = function( vertexIDX ) {

	var out = this.mesh.geometry.vertices[ vertexIDX ];
	
	out.x = ( Math.random() * 2 - 1 ) * this.velocityX;
	out.y = ( Math.random() * 2 - 1 ) * this.velocityY;
	out.z = ( Math.random() * 2 - 1 ) * this.velocityZ;
};