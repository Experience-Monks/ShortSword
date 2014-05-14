var ColorUtils = require('../../utils/Color');

function VoxelGradientMaterial(props) {
	props = props || {};
	this.size = props.size || 1;

	this.vertices = props.vertices || [];
	
	console.log('VoxelGradientMaterial initialized!');
}

VoxelGradientMaterial.prototype = {
	init: function(context, clearColor) {

		if(this.initd || this.clearColor == clearColor) return;
		this.clearColor = clearColor;

		var a = 255;
		var r = 255;
		var g = 255;
		var b = 255;
		this.pixelColor = (a << 24) | (b << 16) | (g <<  8) | r;

		var gradientSteps = 10;
		this.gradientBuffer = new ArrayBuffer(gradientSteps*4);
		this.gradientBufferView32uint = new Uint32Array(this.gradientBuffer);
		for (var i = 0; i < gradientSteps; i++) {
			this.gradientBufferView32uint[i] = ColorUtils.lerp(this.clearColor, this.pixelColor, (i+1)/gradientSteps);
			//console.log(ColorUtils.pretty(this.gradientBufferView32uint[i]));
		};

		this.initd = true;
	},

	drawToBuffer: function(buffer, index, z) {
		gradient = this.gradientBufferView32uint;
		switch(buffer[index]){
			case this.clearColor: buffer[index] = gradient[0]; break;
			case gradient[0]: buffer[index] = gradient[1]; break;
			case gradient[1]: buffer[index] = gradient[2]; break;
			case gradient[2]: buffer[index] = gradient[3]; break;
			case gradient[3]: buffer[index] = gradient[4]; break;
			case gradient[4]: buffer[index] = gradient[5]; break;
			case gradient[5]: buffer[index] = gradient[6]; break;
			case gradient[6]: buffer[index] = gradient[7]; break;
			case gradient[7]: buffer[index] = gradient[8]; break;
			case gradient[8]: buffer[index] = gradient[9]; break;
		}
	}
}

module.exports = VoxelGradientMaterial;
