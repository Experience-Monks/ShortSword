var ColorUtils = require('../../utils/Color');

function VoxelGradientMaterial(props) {
	props = props || {};
	this.size = props.size || 1;
	this.color = props.color || 0xFFFFFFFF;
	this.gammaRamp = props.gammaRamp || 1;
	this.gammaColor = props.gammaColor || 1;
	
	console.log('VoxelGradientMaterial initialized!');
}

VoxelGradientMaterial.prototype = {
	init: function(context, clearColor) {

		if( this.clearColor != clearColor ) {

			this.clearColor = clearColor;

			var gradientSteps = 10;
			this.gradientBuffer = new ArrayBuffer(gradientSteps*4);
			this.gradientBufferView32uint = new Uint32Array(this.gradientBuffer);

			for (var i = 0; i < gradientSteps; i++) {
				var ratio = ( i + 1 ) / gradientSteps;
				ratio = Math.pow(ratio, 1 / this.gammaRamp);
				this.gradientBufferView32uint[i] = ColorUtils.lerp(
					this.clearColor,
					this.color,
					ratio
				);
			};

			if(this.gammaColor != 1) {
				for (var i = 0; i < gradientSteps; i++) {
					this.gradientBufferView32uint[i] = ColorUtils.applyGamma(this.gradientBufferView32uint[i], this.gammaColor);
				}
			}
		}
	},

	drawToBuffer: function( buffer, index, materialIndex, bufferWidth, z ) {

		gradient = this.gradientBufferView32uint;

		switch( buffer.get32( index ) ){

			case this.clearColor: buffer.set32( index, gradient[0] ); break;
			case gradient[0]: buffer.set32( index, gradient[1] ); break;
			case gradient[1]: buffer.set32( index, gradient[2] ); break;
			case gradient[2]: buffer.set32( index, gradient[3] ); break;
			case gradient[3]: buffer.set32( index, gradient[4] ); break;
			case gradient[4]: buffer.set32( index, gradient[5] ); break;
			case gradient[5]: buffer.set32( index, gradient[6] ); break;
			case gradient[6]: buffer.set32( index, gradient[7] ); break;
			case gradient[7]: buffer.set32( index, gradient[8] ); break;
			case gradient[8]: buffer.set32( index, gradient[9] ); break;
		}
	}
}

module.exports = VoxelGradientMaterial;
