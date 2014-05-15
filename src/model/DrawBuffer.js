var DrawBuffer = function( context, clearColour ) {

	this.context = context;

	this.setClearColour32( clearColour === undefined ? 0xFF00001E : clearColour );
};

DrawBuffer.prototype.set32 = function( index, colour ) {

	this.bufferView32uint[ index ] = colour;
};

DrawBuffer.prototype.get32 = function( index ) {

	return this.bufferView32uint[ index ];
};

DrawBuffer.prototype.set8 = function( index, r, g, b, a ) {

	var i4 = index * 4;

	//todo: this most likely wont work on all systems
	this.bufferView8uint[ i4 ] = a;
	this.bufferView8uint[ i4 + 1 ] = r;
	this.bufferView8uint[ i4 + 2 ] = g;
	this.bufferView8uint[ i4 + 3 ] = b;
};

DrawBuffer.prototype.setClearColour32 = function( colour, doClear ) {

	this.clearColour32 = colour;

	if( this.clearBuffer32 ) {

		for( var i = 0; i < this.clearBuffer32.length; i++ ) {

			this.clearBuffer32[ i ] = this.clearColour32;
		}

		if( doClear ) 
			this.clear();
	}
};

DrawBuffer.prototype.getClearColour32 = function() {

	return this.clearColour32;
};

DrawBuffer.prototype.clear = function() {

	this.bufferView32uint.set( this.clearBuffer32 );
};

DrawBuffer.prototype.reset = function() {

	var width = this.context.canvas.width;
	var height = this.context.canvas.height;

	this.imageData = this.context.getImageData( 0, 0, width, height );
	this.buffer = new ArrayBuffer( this.imageData.data.length );
	this.bufferView8uint = new Uint8ClampedArray( this.buffer );
	this.bufferView32uint = new Uint32Array( this.buffer );
	this.clearBuffer32 = new Uint32Array( this.bufferView32uint.length );

	this.setClearColour32( this.clearColour32 );
};

DrawBuffer.prototype.present = function() {

	this.imageData.data.set( this.bufferView8uint );
	this.context.putImageData( this.imageData, 0, 0 );
};

module.exports = DrawBuffer;