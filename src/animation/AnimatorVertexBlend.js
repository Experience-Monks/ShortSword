var BaseAnimator = require( './BaseAnimator' );
var Mesh = require( '../model/Mesh' );
var Geometry = require( '../model/Geometry' );

var AnimatorBlendVertex = function( mesh ) {

	BaseAnimator.call( this, mesh );

	this.oVertices = mesh.geometry.vertices;
	this.steps = [ mesh.geometry.clone().vertices ];

	this._percentage = 0;
	this.startIdx = 0;
	this.endIdx = 0;
	this.inBetween = 0;
};

var p = AnimatorBlendVertex.prototype = Object.create( BaseAnimator.prototype );

p.push = function( step ) {

	var vertices = getVertices( step, this.oVertices );

	this.steps.push( vertices );
};

p.unshift = function( data ) {

	var vertices = getVertices( step, this.oVertices );

	this.steps.unshift( vertices );
};

p.addBefore = function( beforeStep, step ) {

	var beforeVertices = getVertices( beforeStep, this.oVertices );
	var vertices = getVertices( step, this.oVertices );

	for( var i = 0, len = this.steps.length; i < len; i++ ) {

		if( this.steps[ i ] == beforeStep ) {

			this.steps.splice( i, vertices );

			break;
		}
	}
};

p.addAfter = function( beforeStep, step ) {

	var beforeVertices = getVertices( beforeStep, this.oVertices );
	var vertices = getVertices( step, this.oVertices );

	for( var i = 0, len = this.steps.length; i < len; i++ ) {

		if( this.steps[ i ] == beforeStep ) {

			this.steps.splice( i + 1, vertices );

			break;
		}
	}
};

p.setPercentage = function( value ) {

	if( this.dirty = this._percentage != value ) {

		this._percentage = value;

		var idx = ( this.steps.length - 1 ) * value;

		this.startIdx = Math.floor( idx );
		this.endIdx = Math.ceil( idx );
		this.inBetween = idx - this.startIdx;
	}
};

p.getPercentage = function() {

	return this._percentage;
};

p.update = function() {
	this.startVertices = this.steps[this.startIdx];
	this.endVertices = this.steps[this.endIdx];
};

p.updateVertex = function() {
	var out, start, end;
	return function( vertexIDX ) {
		out = this.oVertices[ vertexIDX ];
		start = this.startVertices[ vertexIDX ];
		end = this.endVertices[ vertexIDX ];

		out.x = ( end.x - start.x ) * this.inBetween + start.x;
		out.y = ( end.y - start.y ) * this.inBetween + start.y;
		out.z = ( end.z - start.z ) * this.inBetween + start.z;
	}
}();

function getVertices( step, oVertices ) {

	if( step instanceof Mesh ) {

		return step.geometry.vertices;
	} else if( step instanceof Geometry ) {

		return step.vertices;
	} else if( Array.isArray( step ) ) {

		return step;
	} else {

		throw 'The data being added is an incorrect type';
	}	


	if( vertices.length != oVertices.length ) {

		throw 'The vertices of the original mesh and the data being added do not match in length';
	}
}

module.exports = AnimatorBlendVertex;