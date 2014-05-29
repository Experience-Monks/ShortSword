var BaseAnimator = require( './BaseAnimator' );
var VoxelGradient = require( '../model/materials/VoxelGradient' );
var ColorUtil = require( '../utils/Color' );
var FPS = require( '../utils/FPS' );

var AnimatorMaterialGradient = function( mesh ) {

	BaseAnimator.call( this, mesh );

	this.material = mesh.material;
	this.ease = 0.005;

	if( !( this.material instanceof VoxelGradient ) )
		throw new Error( 'The material which is being used needs to be a VoxelGradient' );

	this.colours = this.material.gradientBufferView32uint;
	this.targetColours = new Uint32Array( this.colours.length );
	this.targetColours.set( this.material.gradientBufferView32uint );
};

var p = AnimatorMaterialGradient.prototype = BaseAnimator.prototype;

p.setTarget = function( colours, weights ) {

	ColorUtil.writeGradient( this.targetColours, colours, weights );

	console.log( this.targetColours );

	this.dirty = true;
};

p.update = function() {

	for( var i = 0, len = this.colours.length; i < len; i++ ) {

		this.colours[ i ] = ColorUtil.lerp( this.colours[ i ], this.targetColours[ i ], this.ease * FPS.animSpeedCompensation );
	}

	console.log( '--------', this.colours[ 0 ], this.targetColours[ 0 ] );

	this.dirty = this.colours[ 0 ] != this.targetColours[ 0 ];
};

module.exports = AnimatorMaterialGradient;