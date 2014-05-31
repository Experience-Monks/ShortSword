var BaseAnimator = require( './BaseAnimator' );
var VoxelGradient = require( '../model/materials/VoxelGradient' );
var ColorUtil = require( '../utils/Color' );
var GradientUtil = require( '../utils/Gradient' );
var FPS = require( '../utils/FPS' );

var AnimatorMaterialGradient = function( mesh ) {

	BaseAnimator.call( this, mesh );

	this.material = mesh.material;
	this.ease = 0.005;

	if( !( this.material instanceof VoxelGradient ) )
		throw new Error( 'The material which is being used needs to be a VoxelGradient' );

	this.colors = this.material.gradientBufferView32uint;
	this.targetColors = new Uint32Array( this.colors.length );
	this.targetColors.set( this.material.gradientBufferView32uint );
};

var p = AnimatorMaterialGradient.prototype = BaseAnimator.prototype;

p.setTarget = function( colors ) {

	for (var i = 0; i < colors.length; i++) {
		this.targetColors[i] = colors[i];
	};

	this.dirty = true;
};

p.update = function() {

	for( var i = 0, len = this.colors.length; i < len; i++ ) {

		this.colors[ i ] = ColorUtil.lerp( this.colors[ i ], this.targetColors[ i ], this.ease * FPS.animSpeedCompensation );
	}

	GradientUtil.makeUnique(this.colors, 0xFF000000);

	//console.log( '--------', ColorUtil.pretty(this.colors[ 0 ]), ColorUtil.pretty(this.targetColors[ 0 ]) );

	this.dirty = this.colors[ 0 ] != this.targetColors[ 0 ];
};

module.exports = AnimatorMaterialGradient;