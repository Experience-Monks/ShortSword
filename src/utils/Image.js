var canvas = null;
var ctx = null;

function createAndSetupCanvas( width, height ) {

	if( canvas === null ) {

		canvas = document.createElement( 'canvas' );
		ctx = canvas.getContext( '2d' );
	}

	if( canvas.width < width )
		canvas.width = width;

	if( canvas.height < height )
		canvas.height = height;
}

module.exports = {

	getData: function( image ) {

		createAndSetupCanvas( image.width, image.height );

		ctx.clearRect( 0, 0, image.width, image.height );
		ctx.drawImage( image, 0, 0 );

		return ctx.getImageData( 0, 0, image.width, image.height );
	},

	getData32: function( image ) {

		var imageData = this.getData( image );

		return new Uint32Array( imageData.data.buffer );
	}
};

