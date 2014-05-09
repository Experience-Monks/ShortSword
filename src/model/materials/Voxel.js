function VoxelMaterial(props) {
	props = props || {};
	this.size = props.size || 1;

	this.vertices = props.vertices || [];
	
	console.log('VoxelMaterial initialized!');
}

VoxelMaterial.prototype = {
	init: function(context) {
		if(this.initd) return;

		var a = 255;
		var r = 255;
		var g = 255;
		var b = 255;
		this.pixelColor = (a << 24) | (b << 16) | (g <<  8) | r;

		this.initd = true;

	},

	drawToBuffer: function(buffer, index, z) {
		buffer[index] = this.pixelColor;
	}
}

module.exports = VoxelMaterial;
