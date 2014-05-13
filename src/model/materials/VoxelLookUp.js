var LookupBase = require( './LookupBase' );

var VoxelLookUp = function( props ) {

	LookupBase.call( this, props );

	props = props || {};

	this.lookupColours = props.lookupColours || [];

	if( !this.hasVertexLookUp || this.lookupColours.length == 0 ) {

		this.drawToBuffer = this.parentDraw;
	}
};

VoxelLookUp.prototype = Object.create( LookupBase.prototype );

VoxelLookUp.prototype.add = function( colour ) {

	var idx = this.addToLookUp( colour, this.lookupColours );
	this.vertexLookUp.push( idx );

	this.drawToBuffer = VoxelLookUp.prototype.drawToBuffer.bind( this );
};

VoxelLookUp.prototype.drawToBuffer = function( buffer, index, vertexIDX, z ) {

	var idx = this.vertexLookUp[ vertexIDX ];

	buffer[ index ] = this.lookupColours[ idx ];
};

module.exports = VoxelLookUp;