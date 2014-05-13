function VoxelMaterial(props) {
	props = props || {};

	this.size = props.size || 1;
	this.vertices = props.vertices || [];

	this._a = props.a === undefined ? 255 : props.a;
	this._r = props.r === undefined ? 120 : props.r;
	this._g = props.g === undefined ? 0 : props.g;
	this._b = props.b === undefined ? 0 : props.b;
	
	console.log('VoxelMaterial initialized!');
}

VoxelMaterial.prototype = {
	init: function(context) {
		if(this.initd) return;

		this.pixelColor = (this._a << 24) | (this._b << 16) | (this._g <<  8) | this._r;

		this.initd = true;
	},

	drawToBuffer: function(buffer, index, z) {
		buffer[index] = this.pixelColor;
	}
}

module.exports = VoxelMaterial;
