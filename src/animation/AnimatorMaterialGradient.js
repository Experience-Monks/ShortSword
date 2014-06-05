var BaseAnimator = require( './BaseAnimator' );
var VoxelGradient = require( '../model/materials/VoxelGradient' );
var ColorUtil = require( '../utils/Color' );
var GradientUtil = require( '../utils/Gradient' );
var FPS = require( '../utils/FPS' );

var AnimatorMaterialGradient = function( mesh, speed ) {

	this.speed = speed !== undefined ? speed : .005;
	this.animationValue = 0;
	BaseAnimator.call( this, mesh );

	this.material = mesh.material;

	if( !( this.material instanceof VoxelGradient ) )
		throw new Error( 'The material which is being used needs to be a VoxelGradient' );

	this.colors = this.material.gradientBufferView32uint;

	this.startColors = new Uint32Array( this.colors.length );
	this.startColors.set( this.material.gradientBufferView32uint );
	this.targetColors = new Uint32Array( this.colors.length );
	this.targetColors.set( this.material.gradientBufferView32uint );
};

var p = AnimatorMaterialGradient.prototype = BaseAnimator.prototype;

p.setTarget = function( colors ) {
	this.animationValue = 0;
	this.isAnimated = false;
	for (var i = 0; i < colors.length; i++) {
		this.startColors[i] = this.colors[i];
		this.targetColors[i] = colors[i];
	};

	this.dirty = true;
};

p.update = function() {
	if(this.isAnimated) return;
	this.animationValue += this.speed * FPS.animSpeedCompensation;
	if(this.animationValue > 1) this.animationValue = 1;
	if(this.animationValue == 1) this.isAnimated = true;

	for( var i = 0, len = this.colors.length; i < len; i++ ) {
		this.colors[ i ] = ColorUtil.lerp( this.startColors[ i ], this.targetColors[ i ], this.animationValue );
	}

	GradientUtil.makeUnique(this.colors, 0xFF000000);

	//console.log( '--------', ColorUtil.pretty(this.colors[ 0 ]), ColorUtil.pretty(this.targetColors[ 0 ]) );

	this.dirty = this.colors[ 3 ] != this.targetColors[ 3 ] || this.colors[ 6 ] != this.targetColors[ 6 ];
};

module.exports = AnimatorMaterialGradient;