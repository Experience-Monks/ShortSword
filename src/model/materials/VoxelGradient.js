var ColorUtils = require('../../utils/Color');
var GradientUtils = require('../../utils/Gradient');

var steps = 10;
function VoxelGradientMaterial(props) {
	props = props || {};
	if(props.bumpFirst === undefined) props.bumpFirst = true;

	this.steps = 10;

	props.colors = props.colors || [
		0xFF333333,
		0xFF555555,
		0xFF777777,
		0xFF888888,
		0xFFAAAAAA,
		0xFFBBBBBB,
		0xFFCCCCCC,
		0xFFDDDDDD,
		0xFFEEEEEE,
		0xFFFFFFFF
	];

	if (props.colors.length != this.steps) {
		throw("Number of colors in gradient is not correct.");
	};



	this.gradientBuffer = new ArrayBuffer( this.steps * 4 );
	this.gradientBufferView32uint = new Uint32Array( this.gradientBuffer );

	for (var i = 0; i < props.colors.length; i++) {
		this.gradientBufferView32uint[i] = props.colors[i];
	};

	if(props.bumpFirst) {
		GradientUtils.bump(this.gradientBufferView32uint);
	}
}

VoxelGradientMaterial.prototype = {
	init: function(context, clearColor) {

		if( this.clearColor != clearColor ) {

			this.clearColor = clearColor;

			GradientUtils.preventColor(this.gradientBufferView32uint, clearColor);

			GradientUtils.makeUnique(this.gradientBufferView32uint);
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
VoxelGradientMaterial.steps = steps;

module.exports = VoxelGradientMaterial;
