var Voxel = require( './Voxel' );

var LookUpMaterial = function( props ) {

	Voxel.call( this, props );

	props = props || {};

	this.vertexLookUp = props.vertexLookUp || [];
	this.hasVertexLookUp = this.vertexLookUp && this.vertexLookUp.length > 0;
};

LookUpMaterial.prototype = Object.create( Voxel.prototype );

LookUpMaterial.prototype.parentDraw = Voxel.prototype.drawToBuffer;

LookUpMaterial.prototype.addToLookUp = function( value, toArr ) {

	var idx = toArr.indexOf( value );

	if( idx == -1 ) {

		idx = toArr.length;
		toArr.push( value );
	}

	return idx;
};

module.exports = LookUpMaterial;