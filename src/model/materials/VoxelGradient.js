var ColorUtils = require('../../utils/Color');

function VoxelGradientMaterial(props) {
	props = props || {};

	this.colours = props.colours || [ 0xFFFF0000, 0xFF00FF00, 0xFF0000FF ];
	this.weights = props.weights;
	this.steps = props.steps || 10;

	//if there were no times then we'll just go in and linearly set every colour
	if( this.weights === undefined ) {

		this.weights = [];

		for( var i = 0, len = this.colours.length; i < len; i++ ) {

			this.weights[ i ] = i / ( len - 1 );
		}
	}

	console.log( this.colours );
	console.log( this.weights );

	// this.size = props.size || 1;
	// this.color = props.color || 0xFFFFFFFF;
	// this.gammaRamp = props.gammaRamp || 1;
	// this.gammaColor = props.gammaColor || 1;
	// this.remapR = props.remapR;
	// this.remapG = props.remapG;
	// this.remapB = props.remapB;
	
	console.log('VoxelGradientMaterial initialized!');
}

VoxelGradientMaterial.prototype = {
	init: function(context, clearColor) {

		if( this.clearColor != clearColor ) {

			this.clearColor = clearColor;



			this.gradientBuffer = new ArrayBuffer( this.steps * 4 );
			this.gradientBufferView32uint = new Uint32Array( this.gradientBuffer );

			//generate gradient
			for( var i = 0; i < this.steps; i++ ) {

				this.gradientBufferView32uint[i] = ColorUtils.gradientColour( i / ( this.steps - 1 ), this.colours, this.weights );
			}





			// var gradientSteps = 10;
			// this.gradientBuffer = new ArrayBuffer(gradientSteps*4);
			// this.gradientBufferView32uint = new Uint32Array(this.gradientBuffer);

			// //generate gradient
			// for (var i = 0; i < gradientSteps; i++) {
			// 	var ratio = ( i + 1 ) / gradientSteps;
			// 	ratio = Math.pow(ratio, 1 / this.gammaRamp);
			// 	this.gradientBufferView32uint[i] = ColorUtils.lerp(
			// 		this.clearColor,
			// 		this.color,
			// 		ratio,
			// 		this.remapR,
			// 		this.remapG,
			// 		this.remapB
			// 	);
			// };

			// //apply gamma
			// if(this.gammaColor != 1) {
			// 	for (var i = 0; i < gradientSteps; i++) {
			// 		this.gradientBufferView32uint[i] = ColorUtils.applyGamma(this.gradientBufferView32uint[i], this.gammaColor);
			// 	}
			// }

			// //make sure no 2 colors are the same by bumping color a bit
			// //this also makes all colors unique so you don't get color loops (though fun, not cool here)
			// //
			// //first we need to make sure the gradient doesn't include the clearColor
			// if(this.gradientBufferView32uint[0] == clearColor) {
			// 	var clearColorBumpJustInCase = ColorUtils.bump(clearColor);
			// 	console.log("!", clearColor);
			// 	console.log("!", clearColorBumpJustInCase);
				
				
			// 	for (var i = 0; i < gradientSteps; i++) {
			// 		if(clearColor == this.gradientBufferView32uint[i]) {
			// 			this.gradientBufferView32uint[i] = clearColorBumpJustInCase;
			// 		}
			// 	}
				
			// }
			// //then we step through the gradient and bump as we go to avoid repeated colors
			// for (var i = 1; i < gradientSteps; i++) {
			// 	if(this.gradientBufferView32uint[i-1] == this.gradientBufferView32uint[i]) {
			// 		var bumped = ColorUtils.bump(this.gradientBufferView32uint[i]);
			// 		for (var j = i; j < gradientSteps; j++) {
			// 			if(this.gradientBufferView32uint[i-1] == this.gradientBufferView32uint[j]) {
			// 				this.gradientBufferView32uint[j] = bumped;
			// 			}
			// 		}
			// 	}
			// }
			
			// for (var i = 0; i < this.gradientBufferView32uint.length; i++) {
			// 	console.log(ColorUtils.pretty(this.gradientBufferView32uint[i]));
			// };
			

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
