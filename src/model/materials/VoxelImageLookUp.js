var LookupBase = require( './LookupBase' );
var utilImage = require( '../../utils/Image' );

var VoxelLookUp = function( props ) {

	LookupBase.call( this, props );

	props = props || {};

	this.lookupImages = props.lookupImages || [];
	this.lookupImagesWidths = props.lookupImagesWidths || [];
	this.lookupImagesHeights = props.lookupImagesHeights || [];
	this.offX = [];
	this.offY = [];

	if( !this.hasVertexLookUp || this.lookupImages.length == 0 ) {

		this.drawToBuffer = this.parentDraw;
	} else {

		for( var i = 0, len = this.lookupImagesWidths.length; i < len; i++ ) {

			this.offX[ i ] = Math.round( this.lookupImagesWidths[ i ] * - 0.5 );
			this.offY[ i ] = Math.round( this.lookupImagesHeights[ i ] * - 0.5 );
		}
	}
};

VoxelLookUp.prototype = Object.create( LookupBase.prototype );

VoxelLookUp.prototype.addFromImage = function( image ) {

	if( image.$$lookUpIdx === undefined ) {

		image.$$lookUpIdx = this.add( utilImage.getData32( image ) );
	} else {

		this.add( this.lookupImages[ image.$$lookUpIdx ], image.width, image.height )
	}
	
	return image.$$lookUpIdx;
};

VoxelLookUp.prototype.add = function( imageData, width, height ) {

	var idx = this.addToLookUp( imageData, this.lookupImages );
	this.lookupImagesWidths[ idx ] = width;
	this.lookupImagesHeights[ idx ] = height;
	this.offX[ idx ] = Math.round( this.lookupImagesWidths[ idx ] * - 0.5 );
	this.offY[ idx ] = Math.round( this.lookupImagesHeights[ idx ] * - 0.5 );

	this.vertexLookUp.push( idx );

	this.drawToBuffer = VoxelLookUp.prototype.drawToBuffer.bind( this );

	return idx;
};

VoxelLookUp.prototype.drawToBuffer = function( buffer, drawIDX, vertexIDX, bufferWidth, z ) {

	var imgIDX = this.vertexLookUp[ vertexIDX ];
	var img = this.lookupImages[ imgIDX ];
	var imgWidth = this.lookupImagesWidths[ imgIDX ];
	var offX = this.offX[ imgIDX ];
	var offY = this.offY[ imgIDX ];



	var startIdx = drawIDX + offY * bufferWidth + offX;

	for( var i = 0, len = img.length; i < len; i++ ) {
		
		var x = i % imgWidth;
		var y = Math.floor( i / imgWidth ) * bufferWidth;

		var idx = startIdx + y + x;

		if( idx < 0 || idx > buffer.length ) {

			continue;
		} else {

			var buffCol = buffer.get32( idx );
			var alpha = buffCol >>> 24;
			var colour = alphaBlend( img[ i ], buffCol ) | alpha << 24;

			buffer.set32( idx, colour );
		}
	}
};

function alphaBlend( src, dest ) {

	var alpha = ( src >>> 24 ) / 255;

	var r1 = (src >> 16) & 0xFF;
	var g1 = (src >> 8) & 0xFF;
	var b1 = src & 0xFF;
	var r2 = (dest >> 16) & 0xFF;
	var g2 = (dest >> 8) & 0xFF;
	var b2 = dest & 0xFF;
	var ar, ag, ab;

	ar = alpha * (r1 - r2) + r2;
	ag = alpha * (g1 - g2) + g2;
	ab = alpha * (b1 - b2) + b2;

	return (ar << 16) | (ag << 8) | ab;
}

module.exports = VoxelLookUp;