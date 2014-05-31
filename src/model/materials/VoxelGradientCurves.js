var ColorUtils = require('../../utils/Color');
var VoxelGradient = require('./VoxelGradient');
function VoxelGradientCurvesMaterial(props) {
	props = props || {};

	VoxelGradient.call( this, props );

	this.color = props.color || 0xFFFFFFFF;
	this.gammaRamp = props.gammaRamp || 1;
	this.gammaColor = props.gammaColor || 1;
	this.remapR = props.remapR;
	this.remapG = props.remapG;
	this.remapB = props.remapB;
};

VoxelGradientCurvesMaterial.prototype = Object.create( VoxelGradient.prototype );

VoxelGradientCurvesMaterial.prototype.init = function(context, clearColor) {

	if( this.clearColor != clearColor ) {

		this.clearColor = clearColor;

		var gradientSteps = this.steps;
		this.gradientBuffer = new ArrayBuffer(gradientSteps*4);
		this.gradientBufferView32uint = new Uint32Array(this.gradientBuffer);

		//generate gradient
		for (var i = 0; i < gradientSteps; i++) {
			var ratio = ( i + 1 ) / gradientSteps;
			ratio = Math.pow(ratio, 1 / this.gammaRamp);
			this.gradientBufferView32uint[i] = ColorUtils.ramp(
				this.clearColor,
				this.color,
				ratio,
				this.remapR,
				this.remapG,
				this.remapB
			);
		};

		//apply gamma
		if(this.gammaColor != 1) {
			for (var i = 0; i < gradientSteps; i++) {
				this.gradientBufferView32uint[i] = ColorUtils.applyGamma(this.gradientBufferView32uint[i], this.gammaColor);
			}
		}

	}
};

module.exports = VoxelGradientCurvesMaterial;
