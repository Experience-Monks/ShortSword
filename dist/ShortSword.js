(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var BaseAnimator = require( './BaseAnimator' );
var VoxelGradient = require( '../model/materials/VoxelGradient' );
var ColorUtil = require( '../utils/Color' );
var GradientUtil = require( '../utils/Gradient' );
var FPS = require( '../utils/FPS' );

var AnimatorMaterialGradient = function( mesh ) {

	BaseAnimator.call( this, mesh );

	this.material = mesh.material;
	this.ease = 0.005;

	if( !( this.material instanceof VoxelGradient ) )
		throw new Error( 'The material which is being used needs to be a VoxelGradient' );

	this.colors = this.material.gradientBufferView32uint;
	this.targetColors = new Uint32Array( this.colors.length );
	this.targetColors.set( this.material.gradientBufferView32uint );
};

var p = AnimatorMaterialGradient.prototype = BaseAnimator.prototype;

p.setTarget = function( colors ) {
	for (var i = 0; i < colors.length; i++) {
		this.targetColors[i] = colors[i];
	};

	this.dirty = true;
};

p.update = function() {

	for( var i = 0, len = this.colors.length; i < len; i++ ) {

		this.colors[ i ] = ColorUtil.lerp( this.colors[ i ], this.targetColors[ i ], this.ease * FPS.animSpeedCompensation );
	}

	GradientUtil.makeUnique(this.colors, 0xFF000000);

	//console.log( '--------', ColorUtil.pretty(this.colors[ 0 ]), ColorUtil.pretty(this.targetColors[ 0 ]) );

	this.dirty = this.colors[ 3 ] != this.targetColors[ 3 ] || this.colors[ 6 ] != this.targetColors[ 6 ];
};

module.exports = AnimatorMaterialGradient;
},{"../model/materials/VoxelGradient":19,"../utils/Color":26,"../utils/FPS":28,"../utils/Gradient":31,"./BaseAnimator":4}],2:[function(require,module,exports){
var BaseAnimator = require( './BaseAnimator' );
var Mesh = require( '../model/Mesh' );
var Geometry = require( '../model/Geometry' );

/**
 * AnimatorBlendVertex will animate vertices from one model to another. It can animate between an infinite number
 * of models.
 *
 * Models are added using array like manipulation functions push, unshift. Or can be added according to another model
 * using the functions addBefore, addAfter.
 *
 * @class AnimatorBlendVertex
 * @extends {BaseAnimator}
 * @constructor
 * @param {[type]} mesh [description]
 */
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

/**
 * push can be used to add a new Mesh/vertices to animate between. This function will add
 * the Mesh/vertices to the end of the list of items to animate between.
 *
 * @method push
 * @param  {Object} step This should be either an array of vertices or a Mesh that we'd like to animate to or from
 */
p.push = function( step ) {

	var vertices = getVertices( step, this.oVertices );

	this.steps.push( vertices );
};

/**
 * unshift can be used to add a new Mesh/vertices to animate between. This function will add
 * the Mesh/vertices to the start of the list of items to animate between.
 *
 * @method unshift
 * @param  {Object} step This should be either an array of vertices or a Mesh that we'd like to animate to or from
 */
p.unshift = function( data ) {

	var vertices = getVertices( step, this.oVertices );

	this.steps.unshift( vertices );
};

/**
 * addBefore will add vertices to the list of vertices to animate. The new vertices will be added before the vertices
 * specified.
 * 
 * @param {[type]} beforeStep [description]
 * @param {[type]} step       [description]
 * @return {Boolean} This value will be true if the vertices or mesh passed in was added to the list of vertices
 *                   to animate between.
 */
p.addBefore = function( beforeStep, step ) {

	var beforeVertices = getVertices( beforeStep, this.oVertices );
	var vertices = getVertices( step, this.oVertices );
	var added = false;

	for( var i = 0, len = this.steps.length; i < len; i++ ) {

		if( this.steps[ i ] == beforeStep ) {

			added = true;

			this.steps.splice( i, vertices );

			break;
		}
	}

	return added;
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
},{"../model/Geometry":12,"../model/Mesh":13,"./BaseAnimator":4}],3:[function(require,module,exports){
var BaseAnimator = require( './BaseAnimator' );

var AnimatorVertexRandom = function( mesh ) {

	BaseAnimator.call( this, mesh );

	this.velocityX = .1;
	this.velocityY = .1;
	this.velocityZ = .1;
};

var p = AnimatorVertexRandom.prototype = Object.create( BaseAnimator.prototype );

p.update = function() {
	this.vertices = this.mesh.geometry.vertices;
};

p.updateVertex = function(){
	var out;

	return function( vertexIDX ) {
		out = this.vertices[ vertexIDX ];
		
		out.x += ( Math.random() * 2 - 1 ) * this.velocityX;
		out.y += ( Math.random() * 2 - 1 ) * this.velocityY;
		out.z += ( Math.random() * 2 - 1 ) * this.velocityZ;
	}
}();

module.exports = AnimatorVertexRandom;
},{"./BaseAnimator":4}],4:[function(require,module,exports){
/**
 * BaseAnimator is the base class for all animators.
 * 
 * @class BaseAnimator
 * @constructor
 * @param {Mesh} mesh This is the mesh on which animation should happen.
 */
var BaseAnimator = function( mesh ) {

	this.mesh = mesh;
	this.dirty = true;
};

/**
 * Update is called immediately before the animator is run over every vertex.
 * 
 * It's handy to for instance reininialize the animator before vertices are updated.
 *
 * @method update
 */
BaseAnimator.prototype.update = function() {};

/**
 * Update vertex is called on every vertex of a mesh. This is where the animator should
 * perform calculations to make things well... animate.
 * 
 * @param  {Number} vertexIDX This is the current vertex index of the mesh the animator is assigned to.
 */
BaseAnimator.prototype.updateVertex = function( vertexIDX ) {};

module.exports = BaseAnimator;
},{}],5:[function(require,module,exports){
var GeometryOBJParser = require('./parsers/GeometryOBJ');
function Loader() {
	
}

Loader.prototype = {
	queue: [],
	current: undefined,
	loadGeometryOBJ:function (url, callback) {
		this.load(url, callback, GeometryOBJParser);
	},
	load: function (url, callback, parser) {
		this.queue.push({
			url: url,
			callback: callback,
			parser: GeometryOBJParser
		});
		this.next();
	},
	next: function() {
		if(this.queue.length == 0) return;
		this.current = this.queue.shift();
		this.requestFile(this.current);
	},
	requestFile: function(item) {
	    var xmlhttp;
	    if (window.XMLHttpRequest) {
	        // code for IE7+, Firefox, Chrome, Opera, Safari
	        xmlhttp = new XMLHttpRequest();
	    } else {
	        // code for IE6, IE5
	        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	    }

	    xmlhttp.onreadystatechange = function() {
	        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
	            item.callback(item.parser.parse(xmlhttp.responseText));
	            this.next();
	        }
	    }.bind(this);

	    xmlhttp.open("GET", item.url, true);
	    xmlhttp.send();
	}
};

module.exports = new Loader();
},{"./parsers/GeometryOBJ":6}],6:[function(require,module,exports){
var Geometry = require('../../model/Geometry');
var Face = require('../../model/Face');

function GeometryOBJParser() {
	
}

GeometryOBJParser.prototype = {
	parse: function(data, options) {
		options = options || {faces:true};
		var dataLines = data.split('\n');
		var vertices = [];
		var length = dataLines.length - 1;
		for (var i = 0; i < length; i++) {
			if(dataLines[i].indexOf("v ") == 0) {
				var vertData = dataLines[i].split(" ");
				for (var iVD = vertData.length - 1; iVD >= 0; iVD--) {
					if(vertData[iVD] == "" || vertData[iVD] == " " || vertData[iVD] == "v") vertData.splice(iVD, 1);
				};
				vertices.push(new THREE.Vector3(
						parseFloat(vertData[0]),
						parseFloat(vertData[1]),
						parseFloat(vertData[2])
					)
				);
			}
		};

		var jump = ~~(vertices.length / 1000);
		if(jump == 0) jump = 1;
		var totalSamples = 0;
		var centroid = new THREE.Vector3();
		for (var i = 0; i < vertices.length; i+=jump) {
			totalSamples++;
			centroid.add(vertices[i]);
		};
		centroid.multiplyScalar(1/totalSamples);
		
		for (var i = vertices.length - 1; i >= 0; i--) {
			vertices[i].x -= centroid.x;
			vertices[i].y -= centroid.y;
			vertices[i].z -= centroid.z;
		};
		
		var props = {
			vertices:vertices
		};

		if(options.faces) {
			var faces = [];
			for (var i = dataLines.length - 1; i >= 0; i--) {
				if(dataLines[i].indexOf("f ") == 0) {
					var faceData = dataLines[i].split(" ");
					for (var iFD = faceData.length - 1; iFD >= 0; iFD--) {
						var dataChunk = faceData[iFD];
						if(dataChunk == "" || dataChunk == " " || dataChunk == "f") faceData.splice(iFD, 1);
					};
					faces.push(new Face(
							vertices[parseInt(faceData[0].split("/")[0])-1],
							vertices[parseInt(faceData[1].split("/")[0])-1],
							vertices[parseInt(faceData[2].split("/")[0])-1]
						)
					);
					if(faceData.length == 4){
						faces.push(new Face(
								vertices[parseInt(faceData[0].split("/")[0])-1],
								vertices[parseInt(faceData[2].split("/")[0])-1],
								vertices[parseInt(faceData[3].split("/")[0])-1]
							)
						);
					}
				}
			};
			props.faces = faces;
		}

		return new Geometry(props);
	}
};

module.exports = new GeometryOBJParser();
},{"../../model/Face":11,"../../model/Geometry":12}],7:[function(require,module,exports){
/**
 * ShortSword is a library for rendering realtime animated voxels to a canvas.
 * Supports standard canvas element.
 *
 * Special Notes
 * =============
 * 
 * Math:
 * This uses a custom build of a subset of threejs. Specifically the math objects/methods.
 * math.js was considered but it lacks any convenience functions like rotate() or translate().
 */
SHORTSWORD = {
	View : require('./view/View'),
	Scene : require('./model/Scene'),
	BlendMesh : require('./model/BlendMesh'),
	Mesh : require('./model/Mesh'),
	Face : require('./model/Face'),
	Object3D : require('./model/Object3D'),
	Camera3D : require('./model/Camera3D'),
	Loader : require('./loader/Loader'),
	GradientUtils : require('./utils/Gradient'),
	ColorUtils : require('./utils/Color'),
	ImageUtils : require('./utils/Image'),
	URLParamUtils : require('./utils/URLParams'),
	GeometryUtils : require('./utils/Geometry'),
	GeometryGarage : require('./utils/GeometryGarage'),
	TestFactory : require('./utils/TestFactory'),
	RemapCurves : require('./utils/RemapCurves'),
	FPS : require('./utils/FPS'),
	CanvasGraph : require('./utils/CanvasGraph'),
	PerformanceTweaker : require('./utils/PerformanceTweaker'),
	parsers: {
		GeometryOBJ: require('./loader/parsers/GeometryOBJ')
	},
	materials: {
		Voxel: require( './model/materials/Voxel' ),
		VoxelGradient: require( './model/materials/VoxelGradient' ),
		VoxelGradientLerp: require( './model/materials/VoxelGradientLerp' ),
		VoxelGradientCurves: require( './model/materials/VoxelGradientCurves' ),
		VoxelLookUp: require( './model/materials/VoxelLookUp' ),
		VoxelImageLookUp: require( './model/materials/VoxelImageLookUp' )
	},
	animators: {
		VertexBlend: require('./animation/AnimatorVertexBlend'),
		VertexRandom: require('./animation/AnimatorVertexRandom'),
		MaterialGradient: require('./animation/AnimatorMaterialGradient')
	},
	effects: {
		GlitchOffset : require('./view/effects/GlitchOffset'),
		GlitchOffsetSmearBlock : require('./view/effects/GlitchOffsetSmearBlock')
	}
}
},{"./animation/AnimatorMaterialGradient":1,"./animation/AnimatorVertexBlend":2,"./animation/AnimatorVertexRandom":3,"./loader/Loader":5,"./loader/parsers/GeometryOBJ":6,"./model/BlendMesh":8,"./model/Camera3D":9,"./model/Face":11,"./model/Mesh":13,"./model/Object3D":14,"./model/Scene":16,"./model/materials/Voxel":18,"./model/materials/VoxelGradient":19,"./model/materials/VoxelGradientCurves":20,"./model/materials/VoxelGradientLerp":21,"./model/materials/VoxelImageLookUp":22,"./model/materials/VoxelLookUp":23,"./utils/CanvasGraph":25,"./utils/Color":26,"./utils/FPS":28,"./utils/Geometry":29,"./utils/GeometryGarage":30,"./utils/Gradient":31,"./utils/Image":32,"./utils/PerformanceTweaker":33,"./utils/RemapCurves":34,"./utils/TestFactory":35,"./utils/URLParams":36,"./view/View":41,"./view/effects/GlitchOffset":42,"./view/effects/GlitchOffsetSmearBlock":43}],8:[function(require,module,exports){
var Mesh = require('./Mesh');
var GeometryUtils = require('../utils/Geometry');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');
var PerformanceTweaker = require('../utils/PerformanceTweaker');
var AnimatorVertexBlend = require( '../animation/AnimatorVertexBlend' );

function BlendMesh(geometry1, geometry2, material, cacheRelative) {

	cacheRelative = cacheRelative === undefined ? true : false;
	this.attributeList = ["vertices"];
	this._blend = 0;
	
	if(geometry1 !== geometry2) {
		GeometryUtils.pairGeometry(geometry1, geometry2, this.attributeList);
		this.geometry1 = GeometryUtils.octTreeSort(geometry1);
		this.geometry2 = GeometryUtils.octTreeSort(geometry2);
		this.scrambleOrder = GeometryUtils.orderlyScramble([geometry1, geometry2]);
	} else {
		this.geometry1 = GeometryUtils.octTreeSort(geometry1);
		this.geometry2 = this.geometry1;
		this.scrambleOrder = GeometryUtils.orderlyScramble([geometry1]);
	}

	this.geometryBlendBuffer = this.geometry1.clone();


	if(cacheRelative) {
		this.updateGeometry = this._updateGeometryRelative;
		this.geometryDelta = GeometryUtils.computeGeometryDelta(this.geometry1, this.geometry2);

		Mesh.call( this, this.geometry1, material );
	} else {

		this.blendAni = this.addAnimator( AnimatorVertexBlend );
		this.blendAni.push( geometry2 );

		Mesh.call( this, this.geometry1, material );
	}
}

/**
 * BlendMesh extends Object3D
 */
BlendMesh.prototype = Object.create(Mesh.prototype);

Object.defineProperty( BlendMesh.prototype, 'blend', {

	get: function() {

		return this._blend;
	},

	set: function( value ) {

		this._blend = value;

		if( this.blendAni ) {
			this.blendAni.setPercentage( value );
		}
	}
});

// BlendMesh.prototype._updateGeometry = function() {
// 	var temp = new THREE.Vector3();
// 	return function() {
// 		var blend = this.blend;
// 		for (var i = 0; i < this.attributeList.length; i++) {
// 			var attributeName = this.attributeList[i];
// 			var attribute = this.geometry[attributeName];
// 			var attribute1 = this.geometry1[attributeName];
// 			var attribute2 = this.geometry2[attributeName];
// 			var t = ~~(attribute1.length / PerformanceTweaker.denominatorSquared);
// 			for (var i = 0; i < t; i++) {
// 				attribute[i].copy(
// 					attribute1[i]
// 				).add(
// 					temp.copy(attribute2[i]).sub(
// 						attribute1[i]
// 					).multiplyScalar(blend)
// 				)
// 			};
// 		}
// 	}
// }();

var RemapFunctions = require('./RemapFunctions');


BlendMesh.prototype._updateGeometryRelative = function() {
	var temp = new THREE.Vector3();
	return function() {
		switch(this.blend) {
			case 0:
				this.geometry = this.geometry1;
				break;
			case 1:
				this.geometry = this.geometry2;
				break;
			default:
				this.geometry = this.geometryBlendBuffer;
				var geometry = this.geometry;
				var blend = this.blend;
				var blendRemap = RemapFunctions.remapRippleSine;

				if(this.geometry.vertices.length < this.geometry1.vertices.length) {
					GeometryUtils.quickBufferClone(this.geometry.vertices, this.geometry1.vertices, this.geometry1.vertices.length);
				}

				if(!this.remapExtra) this.remapExtra = [];
				var remapExtra = this.remapExtra;
				var vertices = geometry.vertices;
				for (var i = remapExtra.length; i < this.geometry.vertices.length; i++) {
					remapExtra[i] = vertices[i].x;
				};

				for (var i = 0; i < this.attributeList.length; i++) {
					var attributeName = this.attributeList[i];
					var attribute = this.geometry[attributeName];
					var attribute1 = this.geometry1[attributeName];
					var attributeDelta = this.geometryDelta[attributeName];
					//var t = attribute1.length;
					var t = ~~(attribute.length / PerformanceTweaker.denominatorSquared);
					for (var i = 0; i < t; i++) {
						attribute[i].copy(
							attribute1[i]
						).add(
							temp.copy(attributeDelta[i]).multiplyScalar(blendRemap(blend, remapExtra[i]))
						)
					};
				}
		}
	}
}();

BlendMesh.prototype.updateGeometryDelta = function() {
	GeometryUtils.updateGeometryDelta(this.geometryDelta, this.geometry1, this.geometry2, 0, this.geometry1.vertices.length);
};

module.exports = BlendMesh;

},{"../animation/AnimatorVertexBlend":2,"../utils/Geometry":29,"../utils/PerformanceTweaker":33,"../vendor/three":38,"./Mesh":13,"./RemapFunctions":15,"./materials/VoxelGradient":19}],9:[function(require,module,exports){
var Object3D = require('./Object3D');
require('../vendor/three');
/**
 * A camera to render a scene from
 * @param {Object} props an object of properties to override default dehaviours
 */
function Camera3D(props) {
	Object3D.call( this );
	props = props || {};
	this.fov = props.fov !== undefined ? fov : 50;
	this.aspect = props.aspect !== undefined ? aspect : 1;
	this.near = props.near !== undefined ? near : 0.1;
	this.far = props.far !== undefined ? far : 2000;

	this.matrixWorldInverse = new THREE.Matrix4();

	this.projectionMatrix = new THREE.Matrix4();
	this.projectionMatrixInverse = new THREE.Matrix4();
	this.translationMatrix = new THREE.Matrix4();

	this.updateProjectionMatrix();
}

/**
 * Camera3D extends Object3D
 */
Camera3D.prototype = Object.create(Object3D.prototype);

Camera3D.prototype.setLens = function ( focalLength, frameHeight ) {

	if ( frameHeight === undefined ) frameHeight = 24;

	this.fov = 2 * THREE.Math.radToDeg( Math.atan( frameHeight / ( focalLength * 2 ) ) );
	this.updateProjectionMatrix();
}

Camera3D.prototype.setLensHorizontalFit = function ( frameWidth, frameHeight ) {

	if ( frameHeight === undefined ) frameHeight = 24;

	this.fov = 2 * THREE.Math.radToDeg( Math.atan( frameHeight / ( frameWidth * 2 ) ) );
	this.translationMatrix.makeTranslation(0, 20 * frameHeight / frameWidth, 0);
	this.updateProjectionMatrix();
}

Camera3D.prototype.updateProjectionMatrix = function () {

	this.projectionMatrix.makePerspective( this.fov, this.aspect, this.near, this.far );
	this.projectionMatrix.multiply(this.translationMatrix);
};

Camera3D.prototype.setAspect = function(aspect) {
	this.aspect = aspect;
	this.updateProjectionMatrix();
}

module.exports = Camera3D;

},{"../vendor/three":38,"./Object3D":14}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Face(v1, v2, v3) {
	this.createRandomPoint = this._defaultCreateRandomPoint;
	this.v1 = v1;
	this.v2 = v2;
	this.v3 = v3;

	var temp = new THREE.Vector3();
	//edge lengths;
	var a = temp.copy(v1).sub(v2).length();
	var b = temp.copy(v2).sub(v3).length();
	var c = temp.copy(v3).sub(v1).length();
	//semiperimeter
	var s = (a + b + c) * .5;

	this.area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
	this.edgeIndex = 0;
}

Face.edgeIndex = 0;
Face.defaultEdgePower = 4;

Face.prototype = {
	_createRandomPointEdgy: function(edgePower) {
		switch(this.edgeIndex%3) {
			case 0:
				v1 = this.v1;
				v2 = this.v2;
				v3 = this.v3;
				break;
			case 1:
				v1 = this.v2;
				v2 = this.v3;
				v3 = this.v1;
				break;
			case 2:
				v1 = this.v3;
				v2 = this.v1;
				v3 = this.v2;
				break;
		}
		this.edgeIndex++;

		return v1.clone().lerp(
				v2, 
				Math.random()
			).lerp(
				v3, 
				Math.pow(Math.random(), edgePower || Face.defaultEdgePower)
			);
	},
	_createRandomPoint: function() {
		var r2 = Math.random();
		return this.v1.clone().lerp(
				this.v2, 
				Math.random()
			).lerp(
				this.v3, 
				1 - (r2 * (1 - r2) * 4)
			);
	},
	_createRandomPointRandomDelta: function() {
		return this.v1.clone().lerp(
				this.v2, 
				Math.random()
			).lerp(
				this.v3, 
				Math.abs(Math.random() - Math.random())
			);
	},
	clone: function() {
		return new Face(this.v1, this.v2, this.v3);
	}
};
Face.prototype._defaultCreateRandomPoint = Face.prototype._createRandomPointRandomDelta;
module.exports = Face;

},{"../vendor/three":38}],12:[function(require,module,exports){
require('../vendor/three');
/**
 * geometry is a collection of buffers
 * vertices, edges, faces, indexes, etc
 */
function Geometry(props) {
	props = props || {};

	this.vertices = props.vertices || [];
	this.drawOrder = [];
	this.faces = props.faces || [];
	this.materialIndex = props.materialIndex || [];
}

Geometry.prototype = {
	updateDrawOrderLength: function(total) {
		if(total == this.vertices.length) return;
		var drawOrder = this.drawOrder;

		for (var i = 0; i < total; i++) {
			drawOrder[i] = i;
		};
		if(drawOrder.length > total) {
			drawOrder.splice(total, drawOrder.length - total);
		}

	},
	clone: function() {
		vertices = [];
		for (var i = 0; i < this.vertices.length; i++) {
			vertices[i] = this.vertices[i].clone();
		};
		faces = [];
		for (var i = 0; i < this.faces.length; i++) {
			faces[i] = this.faces[i].clone();
		};
		drawOrder = this.drawOrder.slice(0);
		materialIndex = this.materialIndex.slice(0);
		return new Geometry({
			vertices: vertices,
			drawOrder: drawOrder,
			faces: faces,
			materialIndex: materialIndex
		});
	}
};
module.exports = Geometry;

},{"../vendor/three":38}],13:[function(require,module,exports){
var Object3D = require('./Object3D');
require('../vendor/three');
var VoxelGradientMaterial = require('./materials/VoxelGradient');
var PerformanceTweaker = require('../utils/PerformanceTweaker');

function Mesh(geometry, material) {
	
	Object3D.call( this );
	this.geometry = geometry;
	this.material = material || new VoxelGradientMaterial();
	this.animators = [];
}

/**
 * Mesh extends Object3D
 */
Mesh.prototype = Object.create(Object3D.prototype);

Mesh.prototype.addAnimator = function( animator ) {

	var rVal = animator;

	if( typeof rVal == 'function' ) {

		rVal = new animator( this );
	}

	this.animators.push( rVal );

	return rVal;
};

Mesh.prototype.updateGeometry = function() {};

module.exports = Mesh;

},{"../utils/PerformanceTweaker":33,"../vendor/three":38,"./Object3D":14,"./materials/VoxelGradient":19}],14:[function(require,module,exports){
require('../vendor/three');
/**
 * Basic 3D object
 * Acts as base for other objects
 */
function Object3D() {

	this.children = [];
	this.parent = undefined;

	this.up = new THREE.Vector3( 0, 1, 0 );

	this.position = new THREE.Vector3();
	this._rotation = new THREE.Euler();
	this._quaternion = new THREE.Quaternion();
	this.scale = new THREE.Vector3( 1, 1, 1 );

	// keep rotation and quaternion in sync

	this._rotation._quaternion = this.quaternion;
	this._quaternion._euler = this.rotation;

	this.rotationAutoUpdate = true;

	this.matrix = new THREE.Matrix4();
	this.matrixWorld = new THREE.Matrix4();

	this.matrixAutoUpdate = true;
	this.matrixWorldNeedsUpdate = true;

	this.visible = true;

}

Object3D.prototype = {

	get rotation () { 
		return this._rotation; 
	},

	set rotation ( value ) {
		
		this._rotation = value;
		this._rotation._quaternion = this._quaternion;
		this._quaternion._euler = this._rotation;
		this._rotation._updateQuaternion();
		
	},

	get quaternion () { 
		return this._quaternion; 
	},
	
	set quaternion ( value ) {
		
		this._quaternion = value;
		this._quaternion._euler = this._rotation;
		this._rotation._quaternion = this._quaternion;
		this._quaternion._updateEuler();
		
	},

	applyMatrix: function () {

		var m1 = new THREE.Matrix4();

		return function ( matrix ) {

			this.matrix.multiplyMatrices( matrix, this.matrix );

			this.position.setFromMatrixPosition( this.matrix );

			this.scale.setFromMatrixScale( this.matrix );

			m1.extractRotation( this.matrix );

			this.quaternion.setFromRotationMatrix( m1 );

		}

	}(),

	setRotationFromAxisAngle: function ( axis, angle ) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle( axis, angle );

	},

	setRotationFromEuler: function ( euler ) {

		this.quaternion.setFromEuler( euler, true );

	},

	setRotationFromMatrix: function ( m ) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix( m );

	},

	setRotationFromQuaternion: function ( q ) {

		// assumes q is normalized

		this.quaternion.copy( q );

	},

	rotateOnAxis: function() {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		var q1 = new THREE.Quaternion();

		return function ( axis, angle ) {

			q1.setFromAxisAngle( axis, angle );

			this.quaternion.multiply( q1 );

			return this;

		}

	}(),

	rotateX: function () {

		var v1 = new THREE.Vector3( 1, 0, 0 );

		return function ( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	rotateY: function () {

		var v1 = new THREE.Vector3( 0, 1, 0 );

		return function ( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	rotateZ: function () {

		var v1 = new THREE.Vector3( 0, 0, 1 );

		return function ( angle ) {

			return this.rotateOnAxis( v1, angle );

		};

	}(),

	translateOnAxis: function () {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		var v1 = new THREE.Vector3();

		return function ( axis, distance ) {

			v1.copy( axis );

			v1.applyQuaternion( this.quaternion );

			this.position.add( v1.multiplyScalar( distance ) );

			return this;

		}

	}(),

	translate: function ( distance, axis ) {

		console.warn( 'DEPRECATED: Object3D\'s .translate() has been removed. Use .translateOnAxis( axis, distance ) instead. Note args have been changed.' );
		return this.translateOnAxis( axis, distance );

	},

	translateX: function () {

		var v1 = new THREE.Vector3( 1, 0, 0 );

		return function ( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	translateY: function () {

		var v1 = new THREE.Vector3( 0, 1, 0 );

		return function ( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	translateZ: function () {

		var v1 = new THREE.Vector3( 0, 0, 1 );

		return function ( distance ) {

			return this.translateOnAxis( v1, distance );

		};

	}(),

	localToWorld: function ( vector ) {

		return vector.applyMatrix4( this.matrixWorld );

	},

	worldToLocal: function () {

		var m1 = new THREE.Matrix4();

		return function ( vector ) {

			return vector.applyMatrix4( m1.getInverse( this.matrixWorld ) );

		};

	}(),

	lookAt: function () {

		// This routine does not support objects with rotated and/or translated parent(s)

		var m1 = new THREE.Matrix4();

		return function ( vector ) {

			m1.lookAt( vector, this.position, this.up );

			this.quaternion.setFromRotationMatrix( m1 );

		};

	}(),

	add: function ( object ) {

		if ( object === this ) {

			console.warn( 'Object3D.add: An object can\'t be added as a child of itself.' );
			return;

		}

		if ( object instanceof Object3D ) {

			if ( object.parent !== undefined ) {

				object.parent.remove( object );

			}

			object.parent = this;

			this.children.push( object );

		}

	},

	remove: function ( object ) {

		var index = this.children.indexOf( object );

		if ( index !== - 1 ) {

			object.parent = undefined;

			this.children.splice( index, 1 );

		}

	},

	traverse: function ( callback ) {

		callback( this );

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			this.children[ i ].traverse( callback );

		}

	},

	getDescendants: function ( array ) {

		if ( array === undefined ) array = [];

		Array.prototype.push.apply( array, this.children );

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			this.children[ i ].getDescendants( array );

		}

		return array;

	},

	updateMatrix: function () {

		this.matrix.compose( this.position, this.quaternion, this.scale );

		this.matrixWorldNeedsUpdate = true;

	},

	updateMatrixWorld: function ( force ) {

		if ( this.matrixAutoUpdate === true ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate === true || force === true ) {

			if ( this.parent === undefined ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		for ( var i = 0, l = this.children.length; i < l; i ++ ) {

			this.children[ i ].updateMatrixWorld( force );

		}

	},

	clone: function ( object, recursive ) {

		if ( object === undefined ) object = new Object3D();
		if ( recursive === undefined ) recursive = true;

		object.up.copy( this.up );

		object.position.copy( this.position );
		object.quaternion.copy( this.quaternion );
		object.scale.copy( this.scale );

		object.rotationAutoUpdate = this.rotationAutoUpdate;

		object.matrix.copy( this.matrix );
		object.matrixWorld.copy( this.matrixWorld );

		object.matrixAutoUpdate = this.matrixAutoUpdate;
		object.matrixWorldNeedsUpdate = this.matrixWorldNeedsUpdate;

		object.visible = this.visible;

		if ( recursive === true ) {

			for ( var i = 0; i < this.children.length; i ++ ) {

				var child = this.children[ i ];
				object.add( child.clone() );

			}

		}

		return object;

	}

};

module.exports = Object3D;

},{"../vendor/three":38}],15:[function(require,module,exports){
var RemapFunctions = {
	remapLinear : function (valIn, extra) {
		return valIn;
	},
	remapRippleSine: function() {
		var range = 4;
		var rangeHalf = range * .5 - .5;
		var quickSinCurveLookupSteps = 1000;
		var quickSinCurveLookupTable = [];
		for (var i = 0; i < quickSinCurveLookupSteps; i++) {
			
			quickSinCurveLookupTable[i] = 1 - (Math.cos(i/quickSinCurveLookupSteps * Math.PI) * .5 + .5);
		};
		quickSinCurveLookupTable[quickSinCurveLookupSteps] = 1;
		function quickSinCurveLookup(valIn) {
			return quickSinCurveLookupTable[~~(valIn * quickSinCurveLookupSteps)];
		};
		return function (valIn, extra) {
			return quickSinCurveLookup(Math.min(1, Math.max(0, (range * valIn) - rangeHalf + extra)));
		};
	}()
}

module.exports = RemapFunctions;
},{}],16:[function(require,module,exports){
var Object3D = require('./Object3D');
/**
 * The basic root Object3D to build a scene
 */
function Scene() {
	Object3D.call( this );

}

/**
 * Scene extends Object3D
 */
Scene.prototype = Object.create(Object3D.prototype);

module.exports = Scene;

},{"./Object3D":14}],17:[function(require,module,exports){
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
},{"./Voxel":18}],18:[function(require,module,exports){
function VoxelMaterial(props) {
	props = props || {};

	this.size = props.size || 1;
	this.vertices = props.vertices || [];

	this._a = props.a === undefined ? 255 : props.a;
	this._r = props.r === undefined ? 120 : props.r;
	this._g = props.g === undefined ? 0 : props.g;
	this._b = props.b === undefined ? 0 : props.b;
}

VoxelMaterial.prototype = {

	init: function(context) {
		if(this.initd) return;

		this.pixelColor = (this._a << 24) | (this._b << 16) | (this._g <<  8) | this._r;

		this.initd = true;
	},

	drawToBuffer: function( buffer, index, vertexIDX, bufferWidth, z) {

		buffer.set32( index, this.pixelColor );
	}
}

module.exports = VoxelMaterial;

},{}],19:[function(require,module,exports){
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

},{"../../utils/Color":26,"../../utils/Gradient":31}],20:[function(require,module,exports){
var ColorUtils = require('../../utils/Color');
var VoxelGradient = require('./VoxelGradient');
function VoxelGradientCurvesMaterial(props) {
	props = props || {};

	VoxelGradient.call( this, props );

	this.color = props.color || 0xFFFFFFFF;
	this.gammaRamp = props.gammaRamp || 1;
	this.gammaColor = props.gammaColor || 1;
	this.remapR = props.remapR;
	this.remapG = props.remapG;
	this.remapB = props.remapB;
};

VoxelGradientCurvesMaterial.prototype = Object.create( VoxelGradient.prototype );

VoxelGradientCurvesMaterial.prototype.init = function(context, clearColor) {

	if( this.clearColor != clearColor ) {

		this.clearColor = clearColor;

		var gradientSteps = this.steps;
		this.gradientBuffer = new ArrayBuffer(gradientSteps*4);
		this.gradientBufferView32uint = new Uint32Array(this.gradientBuffer);

		//generate gradient
		for (var i = 0; i < gradientSteps; i++) {
			var ratio = ( i + 1 ) / gradientSteps;
			ratio = Math.pow(ratio, 1 / this.gammaRamp);
			this.gradientBufferView32uint[i] = ColorUtils.ramp(
				this.clearColor,
				this.color,
				ratio,
				this.remapR,
				this.remapG,
				this.remapB
			);
		};

		//apply gamma
		if(this.gammaColor != 1) {
			for (var i = 0; i < gradientSteps; i++) {
				this.gradientBufferView32uint[i] = ColorUtils.applyGamma(this.gradientBufferView32uint[i], this.gammaColor);
			}
		}

	}
};

module.exports = VoxelGradientCurvesMaterial;

},{"../../utils/Color":26,"./VoxelGradient":19}],21:[function(require,module,exports){
var ColorUtils = require('../../utils/Color');
var VoxelGradient = require('./VoxelGradient');

function VoxelGradientLerpMaterial(props) {
	props = props || {};

	props.colors = props.colors || [ 0xFFFF0000, 0xFF00FF00, 0xFF0000FF ];
	props.weights = props.weights;


	//if there were no times then we'll just go in and linearly set every colour
	if( props.weights === undefined ) {

		props.weights = [];

		for( var i = 0, len = props.colors.length; i < len; i++ ) {

			props.weights[ i ] = i / ( len - 1 );
		}
	} else {
		if(props.colors.length != props.weights.length) throw("You need an equal number of colors and weights to generate a gradient this way.");
	}

	props.colors = ColorUtils.sampleGradient( props.colors, props.weights, VoxelGradient.steps );

	VoxelGradient.call(this, props);
}

VoxelGradientLerpMaterial.prototype = Object.create( VoxelGradient.prototype );

module.exports = VoxelGradientLerpMaterial;
},{"../../utils/Color":26,"./VoxelGradient":19}],22:[function(require,module,exports){
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
	this.zsort = true;

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

		image.$$lookUpIdx = this.add( utilImage.getData32( image ), image.width, image.height);
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

VoxelLookUp.prototype.drawToBuffer = function( buffer, drawIDX, imgIDX, bufferWidth, z ) {

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
},{"../../utils/Image":32,"./LookupBase":17}],23:[function(require,module,exports){
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

VoxelLookUp.prototype.drawToBuffer = function( buffer, index, vertexIDX, screenWidth, z ) {

	var idx = this.vertexLookUp[ vertexIDX ];

	buffer.set32( index, this.lookupColours[ idx ] );
};

module.exports = VoxelLookUp;
},{"./LookupBase":17}],24:[function(require,module,exports){
module.exports = {
	orderlyScramble: function(array, newOrder) {
		var length = array.length;
		if(!newOrder) {
			var order = [];
			for (var i = 0; i < length; i++) {
				order[i] = i;
			};

			newOrder = [];
			for (var i = 0; i < length; i++) {
				var randomIndex = ~~(Math.random() * order.length);
				newOrder[i] = order[randomIndex];
				order.splice(randomIndex, 1);
			};
		}

		originalArray = array.slice(0);
		for (var i = 0; i < length; i++) {
			array[i] = originalArray[newOrder[i]];
		}
		return newOrder;
	}
}
},{}],25:[function(require,module,exports){
function CanvasGraph(props) {
	this.addCanvasToDOMBody = this.addCanvasToDOMBody.bind(this);
	this.animationFrame = this.animationFrame.bind(this);

	props = props ? props : {};
	this.width = props.width ? props.width : this.width;
	this.height = props.height ? props.height : this.height;
	this.colorBG = props.colorBG !== undefined ? props.colorBG : "#222222";
	this.colorLine = props.colorLine !== undefined ? props.colorLine : "#FF2222";

	this.lastTime = this.time = new Date;

	this.canvas = this.createCanvas();
	this.values = [];
	this.setDOMRules();
	this.animationFrame();

	this.addValue(this, "fps", "red", "FPS");
};
CanvasGraph.prototype = {
	canvasID: "graphCanvas",
	width: 200,
	height: 60,
	range: {
		top: 60,
		bottom: 0
	},
	pixelsPerSecondScroll: 60,
	scrollPosition: 0,
	skipFrames: 0,
	skipFramesCounter: 0,
	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		canvas.width = this.width;
		canvas.height = this.height;
		this.context = canvas.getContext("2d");
		this.context.fillStyle = this.colorBG;
		this.context.fillRect(0, 0, this.width, this.height);
		this.addCanvasToDOMBody(canvas);
		return canvas;
	},
	clear: function() {

	},
	addCanvasToDOMBody: function(canvas) {
		canvas = canvas || this.canvas;
		if(document.body) {
			
			document.body.appendChild(canvas);
		} else {
			
			setTimeout(this.addCanvasToDOMBody, 50);
		}
	},
	setDOMRules: function(mode) {
		var style = this.canvas.style;
		style.position = "fixed";
		style.left = "0px";
		style.top = "0px";
		style.width = this.width;
		style.height = this.height;
	},
	animationFrame : function() {
		if(this.skipFramesCounter < this.skipFrames) {
			this.skipFramesCounter++;
		} else {
			this.render();
			this.skipFramesCounter = 0;
		}
		if(!this._requestStop) requestAnimationFrame(this.animationFrame);
	},
	addValue: function(object, valueKey, colorString, name) {
		this.values.push({
			name: name,
			object:object,
			valueKey:valueKey,
			color: colorString
		})
	},
	render: function() {
		this.lastTime = this.time;
		this.time = new Date;
		var deltaTime = this.time - this.lastTime;
		this.fps = ~~(1000 / deltaTime)
		var scrollPositionDelta = deltaTime * .001 * this.pixelsPerSecondScroll;
		var scrollPositionLastInt = ~~this.scrollPosition;
		this.scrollPosition += scrollPositionDelta;
		var scrollPositionInt = ~~this.scrollPosition;
		var scrollPositionDeltaInt = scrollPositionInt - scrollPositionLastInt;
		if(scrollPositionDeltaInt < this.width) {
			this.context.putImageData(
				this.context.getImageData(scrollPositionDeltaInt, 0, this.width-scrollPositionDeltaInt, this.height),
				0, 0
			);
		}
		this.context.fillStyle = this.colorBG;
		this.context.fillRect(
			this.width - scrollPositionDeltaInt,
			0,
			scrollPositionDeltaInt,
			this.height
		);
		this.context.globalCompositeOperation = "lighter";
		for (var i = 0; i < this.values.length; i++) {
			var val = this.values[i];

			this.context.fillStyle = val.color;
			this.context.fillRect(
				this.width - scrollPositionDeltaInt,
				this.height - val.object[val.valueKey],
				scrollPositionDeltaInt,
				1
			);
		}
		this.context.globalCompositeOperation = "source-over";
	}
};

module.exports = CanvasGraph;
},{}],26:[function(require,module,exports){
var RemapCurves = require('./RemapCurves');

bumpRotation = 0;

var defaultRemapR = RemapCurves.makeGamma(2);
var defaultRemapG = RemapCurves.makeGamma(1);
var defaultRemapB = RemapCurves.makeGamma(.5);
module.exports = {
	lerp: function(color1, color2, ratio, remapR, remapG, remapB) {
		var a1 = (color1 >> 24) & 0xff;
		var r1 = (color1 >> 16) & 0xff;
		var g1 = (color1 >> 8) & 0xff;
		var b1 = color1 & 0xff;
		var a2 = (color2 >>> 24) & 0xff;
		var r2 = (color2 >> 16) & 0xff;
		var g2 = (color2 >> 8) & 0xff;
		var b2 = color2 & 0xff;

		return ((~~(a1 + (a2 - a1) * ratio)) << 24 |
			   (~~(r1 + (r2 - r1) * ratio)) << 16 |
			   (~~(g1 + (g2 - g1) * ratio)) << 8 |
			   ~~(b1 + (b2 - b1) * ratio)) >>> 0;
	},
	ramp: function(color1, color2, ratio, remapR, remapG, remapB) {

		var a1 = (color1 >> 24) & 0xff;
		var r1 = (color1 >> 16) & 0xff;
		var g1 = (color1 >> 8) & 0xff;
		var b1 = color1 & 0xff;
		var a2 = (color2 >>> 24) & 0xff;
		var r2 = (color2 >> 16) & 0xff;
		var g2 = (color2 >> 8) & 0xff;
		var b2 = color2 & 0xff;
		
		remapR = remapR || defaultRemapR;
		remapG = remapG || defaultRemapG;
		remapB = remapB || defaultRemapB;

		var ratioR = remapR(ratio);
		var ratioG = remapG(ratio);
		var ratioB = remapB(ratio);

		return (~~(a1 + (a2 - a1) * ratio) << 24) |
		 	(~~(r1 + (r2 - r1) * ratioB) << 16) |
		 	(~~(g1 + (g2 - g1) * ratioG) << 8) |
		 	~~(b1 + (b2 - b1) * ratioR);
	},
	gradientColor: function( percentage, colors, weights ) {

		var startIdx = 0,
			endIdx = 1,
			startPerc = 0,
			endPerc = 0,
			ratio = 0,
			startColor = 0,
			endColor = 0,
			sa, ea, sr, er, sg, eg, sb, eb;

		for( var i = 0, len = weights.length; i < len; i++ ) {

			if( percentage > weights[ i ] ) {

				startIdx = i;
				endIdx = i + 1;
			} else {

				break;
			}
		}

		if( endIdx > weights.length - 1 ) 
			endIdx = weights.length - 1;

		startPerc = weights[ startIdx ];
		endPerc = weights[ endIdx ];
		startColor = colors[ startIdx ];
		endColor = colors[ endIdx ];

		ratio = ( percentage - startPerc ) / ( endPerc - startPerc );

		return this.lerp( startColor, endColor, ratio );
	},
	sampleGradient: function( colors, weights, steps ) {
		var array = [];
		for( var i = 0, num = steps - 1; i < steps; i++ ) {
			array[ i ] = this.gradientColor( i / num, colors, weights );
		}
		return array;
	},
	pretty: function (color) {
		var a = (color >> 24) & 0xff;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;
		return "A:"+a+" R:"+r+" G:"+g+" B:"+b;
	},
	applyGamma: function(color, gamma) {
		var invGamma = 1 / gamma;

		var a = ((color >> 24) & 0xff) / 255;
		var r = ((color >> 16) & 0xff) / 255;
		var g = ((color >> 8) & 0xff) / 255;
		var b = (color & 0xff) / 255;

		a = Math.pow(a, invGamma);
		r = Math.pow(r, invGamma);
		g = Math.pow(g, invGamma);
		b = Math.pow(b, invGamma);

		return (~~(a * 255) << 24) |
			(~~(r * 255) << 16) |
			(~~(g * 255) << 8) |
			~~(b * 255);

	},
	bump: function(color, rInt, gInt, bInt) {
		var a = (color >> 24) & 0xff;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;

		bumpRotation = (bumpRotation+1) % 3;
		switch(bumpRotation) {
			case 0: r = Math.min(255, r+1); break;
			case 1: g = Math.min(255, g+1); break;
			case 2: b = Math.min(255, b+1); break;
		};

		return (~~a << 24) |
			(~~r << 16) |
			(~~g << 8) |
			~~b;

	},
	extractRowFromCanvas: function(canvas, y) {
		var row = [];
		var w = canvas.width;
		var context = canvas.getContext('2d');
		if(y > canvas.height) throw("Cannot grab row " + y + " from an image of height " + canvas.height);
		var rowData = context.getImageData(0, y, canvas.width, 1);
		var rowData32 = new Uint32Array(rowData.data.buffer);
		return rowData32;
	}
}
},{"./RemapCurves":34}],27:[function(require,module,exports){
var Events = {
	addEvent : function(elem, type, eventHandle) {
	    if (elem == null || typeof(elem) == 'undefined') return;
	    if ( elem.addEventListener ) {
	        elem.addEventListener( type, eventHandle, false );
	    } else if ( elem.attachEvent ) {
	        elem.attachEvent( "on" + type, eventHandle );
	    } else {
	        elem["on"+type]=eventHandle;
	    }
	}
}

module.exports = Events;
},{}],28:[function(require,module,exports){
function FPS() {
	this.lastTime = new Date;
	this.animationFrame = this.animationFrame.bind(this);
	requestAnimationFrame(this.animationFrame);
};

FPS.prototype = {
	filterStrength: 20,
	frameTime: 0,
	lastTime: 0,
	thisTime: new Date,
	fps: 0,
	idealFrameDuration: 1000 / 60,
	animSpeedCompensation: 1,
	
	animationFrame: function() {
		this.update();
		requestAnimationFrame(this.animationFrame);
	},
	update: function(){
		var frameTimeRaw = this.thisTime;
		this.thisTime = new Date;
		frameTimeRaw = this.thisTime - frameTimeRaw;
		var thisFrameDuration = this.thisTime - this.lastTime;
		if(thisFrameDuration > 100) thisFrameDuration = 100;
		var delta = this.frameTime - thisFrameDuration;
		this.frameTime -= delta / this.filterStrength;
		this.lastTime = this.thisTime;
		this.fps = 1000 / this.frameTime;
		this.animSpeedCompensation = frameTimeRaw / this.idealFrameDuration;
	}
};

module.exports = new FPS();
},{}],29:[function(require,module,exports){
var ArrayUtils = require('./Array');
var Geometry = require('../model/Geometry');

var attributeList = ["vertices"];
var GeometryUtils = {
	octTreeSort: function() {
		var tree = [];
		var recurseTreeSortX = function(vertices) {
			vertices.sort(function(a, b) {return b.x - a.x});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSortY(tempLow);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSortY(tempHigh);
			return [tempLow, tempHigh];
		}
		var recurseTreeSortY = function(vertices) {
			vertices.sort(function(a, b) {return b.y - a.y});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSortZ(tempLow);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSortZ(tempHigh);
			return [tempLow, tempHigh];
		}
		var recurseTreeSortZ = function(vertices) {
			vertices.sort(function(a, b) {return b.z - a.z});
			var tempLow = vertices.slice(0, ~~(vertices.length * .5));
			if (tempLow.length >= 2) tempLow = recurseTreeSortX(tempLow);
			var tempHigh = vertices.slice(~~(vertices.length * .5), vertices.length);
			if (tempHigh.length >= 2) tempHigh = recurseTreeSortX(tempHigh);
			return [tempLow, tempHigh];
		}

		var recurseUnroll = function(arrTree, arrFlat) {
			for (var i = 0; i < arrTree.length; i++) {
				if (arrTree[i] instanceof Array) recurseUnroll(arrTree[i], arrFlat);
				else arrFlat.push(arrTree[i]);
			};
		}

		return function(geometry) {
			var timeBefore = new Date;
			var total = geometry.vertices.length;
			
			geometry.vertices = recurseTreeSortX(geometry.vertices);
			var arrFlat = [];
			var timeMiddle = new Date;
			
			recurseUnroll(geometry.vertices, arrFlat);
			geometry.vertices = arrFlat;
			var timeAfter = new Date;
			
			return geometry;
		}
	}(),
	pairGeometry: function(geometry1, geometry2, attributeList) {
		var small = geometry1.vertices.length < geometry2.vertices.length ? geometry1 : geometry2;
		var large = small === geometry1 ? geometry2 : geometry1;
		for (var i = 0; i < attributeList.length; i++) {
			var attributeName = attributeList[i];
			var attributeSmall = small[attributeName];
			var attributeLarge = large[attributeName];
			
			var tS = attributeSmall.length;
			var tL = attributeLarge.length;
			for (var i = tS; i < tL; i++) {
				attributeSmall[i] = new THREE.Vector3().copy(attributeSmall[i%tS]);
			};
		}
	},
	computeGeometryDelta: function(geometry1, geometry2) {
		if(!this.checkIfGeometryAttributesLengthsMatch([geometry1, geometry2])) return;
		var delta = new Geometry();
		var length = geometry1[attributeList[0]].length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			var attrName = attributeList[ia];
			var workingAttribute = delta[attrName];
			var attribute1 = geometry1[attrName];
			var attribute2 = geometry2[attrName];
			for (var i = 0; i < length; i++) {
				workingAttribute[i] = attribute2[i].clone().sub(attribute1[i]);
			}
		}

		return delta;
	},
	updateGeometryDelta: function(delta, geometry1, geometry2, start, end) {
		if(!this.checkIfGeometryAttributesLengthsMatch([geometry1, geometry2])) return;
		var length = geometry1[attributeList[0]].length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			var attrName = attributeList[ia];
			var workingAttribute = delta[attrName];
			var attribute1 = geometry1[attrName];
			var attribute2 = geometry2[attrName];
			for (var i = workingAttribute.length; i < end; i++) {
				workingAttribute[i] = attribute1[i].clone();
			}
			for (var i = start; i < end; i++) {
				workingAttribute[i].copy(attribute2[i]).sub(attribute1[i]);
			}
		}
	},
	orderlyScramble: function(geometries, newOrder) {
		var timeBefore = new Date;
		console.log("orderlyScramble start!!!");
		if(!this.checkIfGeometryAttributesLengthsMatch(geometries)) return;
		var length = geometries[0][attributeList[0]].length;
		if(!newOrder) {
			var order = [];
			for (var i = 0; i < length; i++) {
				order[i] = i;
			};

			newOrder = [];
			for (var i = 0; i < length; i++) {
				var randomIndex = ~~(Math.random() * order.length);
				newOrder[i] = order[randomIndex];
				order.splice(randomIndex, 1);
			};
		}

		for (var ig = 0; ig < geometries.length; ig++) {
			for (var ia = 0; ia < attributeList.length; ia++) {
				var workingArray = geometries[ig][attributeList[ia]];
				var originalArray = geometries[ig][attributeList[ia]].slice(0);
				for (var i = 0; i < length; i++) {
					workingArray[i] = originalArray[newOrder[i]];
				};
			}
		}
		var timeAfter = new Date;

		return newOrder;
	},
	reduce: function(geometry, length) {
		var spliceLength = geometry.vertices.length - length;
		for (var ia = 0; ia < attributeList.length; ia++) {
			geometry[attributeList[ia]].splice(length, spliceLength);
		}
	},
	checkIfGeometryAttributesLengthsMatch : function(geometries) {
		var length = -1;
		for (var ig = 0; ig < geometries.length; ig++) {
			for (var ia = 0; ia < attributeList.length; ia++) {
				var lengthTemp = geometries[ig][attributeList[ia]].length;
				if(length == -1) {
					length = lengthTemp;
				} else if (length != lengthTemp) {
					console.log("WARNING: Geometries do not have the same length!!");
					return;
				}
			}
		}
		return true;
	},
	fillSurfaces : function(geometry, newTotalVertices) {
		var length = geometry[attributeList[0]].length;
		if(!geometry.faces || geometry.faces.length == 0) {
			console.log("WARNING: Cannot fill geometry unless it has faces defined");
		}
		var proportionalFaces = geometry.proportionalFaces || [];
		if(!geometry.proportionalFaces) {

			var facesByArea = geometry.faces.slice(0);
			facesByArea.sort(function(a, b) { return a.area - b.area; });

			var min = facesByArea[0].area;
			var median = facesByArea[~~(facesByArea.length * .5)].area;
			var max = facesByArea[facesByArea.length-1].area;

			var medianRatio = ~~(median / min);
			var maxRatio = ~~(max / min);
			while(maxRatio > 2000) {
				min *= 5;
				medianRatio = ~~(median / min);
				maxRatio = ~~(max / min);
			}

			
			for (var iF = 0; iF < facesByArea.length; iF++) {
				var face = facesByArea[iF];
				for (var i = ~~(face.area / min); i >= 0; i--) {
					proportionalFaces.push(face);
				};
			};

			ArrayUtils.orderlyScramble(proportionalFaces);
			
			geometry.proportionalFaces = proportionalFaces;
			geometry.lastProportionalFaceVisited = 0;
		}
		var pfLength = proportionalFaces.length;
		var lastProportionalFaceVisited = geometry.lastProportionalFaceVisited;
		for (var i = length; i < newTotalVertices; i++) {
			lastProportionalFaceVisited++;
			geometry.vertices.push(proportionalFaces[lastProportionalFaceVisited%pfLength].createRandomPoint())
		}
		geometry.lastProportionalFaceVisited = lastProportionalFaceVisited;
	},
	quickBufferClone : function(dstBuffer, srcBuffer, newTotal) {
		for (var i = dstBuffer.length; i < newTotal; i++) {
			dstBuffer[i] = srcBuffer[i].clone();
		}
	}
}
module.exports = GeometryUtils;
},{"../model/Geometry":12,"./Array":24}],30:[function(require,module,exports){
var Geometry = require('../model/Geometry');
var GeometryUtils = require('./Geometry');
var work = [];
var GeometryGarage = {
	fillSurfaces : function() {
		var verticesPerWorkRun = 10000;
		var verticesPerWorkRunMin = 1000;
		var targetWorkRunDuration = 6;
		var targetTweakRatio = 1.2;
		return function(geometries, newTotalVertices, callback) {
			if(!GeometryUtils.checkIfGeometryAttributesLengthsMatch(geometries)) {
				return;
			}
			var workLoad = {
				timeToProcess: 0,
				done: false,
				currentTotalVertices: geometries[0].vertices.length,
				targetTotalVertices: newTotalVertices,
				callback: callback,
				run: function() {
					var timeBefore = new Date;
					var nextTotal = Math.min(this.targetTotalVertices, this.currentTotalVertices + verticesPerWorkRun);
					for (var i = 0; i < geometries.length; i++) {
						GeometryUtils.fillSurfaces(geometries[i], nextTotal);
					};
					this.currentTotalVertices = nextTotal;
					var timeAfter = new Date;
					var duration = timeAfter - timeBefore;
					if(duration < targetWorkRunDuration) {
						verticesPerWorkRun = ~~(verticesPerWorkRun * targetTweakRatio);
					} else if(duration > targetWorkRunDuration) { 
						verticesPerWorkRun = ~~(verticesPerWorkRun / targetTweakRatio);
					}
					verticesPerWorkRun = Math.max(verticesPerWorkRun, verticesPerWorkRunMin);
					
					if(this.targetTotalVertices == this.currentTotalVertices) {
						this.done = true;
						if(this.callback) this.callback();
					}
				}
			};
			work.push(workLoad);
		};
	}(),
	octTreeSort: function() {
		return function() {

		}
	}(),
	doSomeWork: function() {
		for (var i = work.length - 1; i >= 0; i--) {
			work[i].run();
			if(work[i].done) work.splice(i, 1);
		};
	}
};

module.exports = GeometryGarage;
},{"../model/Geometry":12,"./Geometry":29}],31:[function(require,module,exports){
var ColorUtils = require('./Color');
module.exports = {
	bump: function(gradient) {
		for (var i = 0, steps = gradient.length - 1; i < steps; i++) {
			gradient[i] = gradient[i+1];
		};
	},
	preventColor: function(gradient, clearColor) {
		var gradientSteps = gradient.length;
		//make sure the gradient doesn't include the clearColor
		if(gradient[0] == clearColor) {
			var clearColorBumpJustInCase = ColorUtils.bump(clearColor);
			
			for (var i = 0; i < gradientSteps; i++) {
				if(clearColor == gradient[i]) {
					gradient[i] = clearColorBumpJustInCase;
				}
			}
		}
	},
	makeUnique: function(gradient){
		//make sure no 2 colors are the same by bumping color a bit
		//this also makes all colors unique so you don't get color loops (though fun, not cool here)

		var gradientSteps = gradient.length;

		//step through the gradient and bump as we go to avoid repeated colors
		for (var i = 1; i < gradientSteps; i++) {
			if(gradient[i-1] == gradient[i]) {
				var bumped = ColorUtils.bump(gradient[i]);
				for (var j = i; j < gradientSteps; j++) {
					if(gradient[i-1] == gradient[j]) {
						gradient[j] = bumped;
					}
				}
			}
		}
	},
	pretty: function (gradient) {
		var string = "GRADIENT\n";
		var gradientSteps = gradient.length;
		for (var i = 1; i < gradientSteps; i++) {
			string += ColorUtils.pretty(gradient[i]) + "\n";
		}
		return string;
	},
};
},{"./Color":26}],32:[function(require,module,exports){
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
	},
	
	loadAsCanvas: function(url, callback) {
		var img = new Image();
		var canvas = document.createElement('canvas');
		canvas.id = "voxelColors";
		var canvasContext = canvas.getContext('2d');
		img.onload = function(){
		    canvas.width = img.width;
		    canvas.height = img.height;
		    canvasContext.drawImage(img, 0, 0, img.width, img.height);
		    callback(canvas);
		}
		img.src = url;
	}
};


},{}],33:[function(require,module,exports){
var signals = require('../vendor/signals');
var FPS = require('./FPS');

function PerformanceTweaker(props) {
	props = props || {};
	this.degradeWhen = props.degradeWhen !== undefined ? props.degradeWhen : this.degradeWhen;
	this.upgradeWhen = props.upgradeWhen !== undefined ? props.upgradeWhen : this.upgradeWhen;
	this.lastLoop = new Date;
	this.onChange = new signals.Signal();
};

PerformanceTweaker.prototype = {
	denominator: 1,
	degradeWhen: 16,
	upgradeWhen: 28,
	denominatorMax: 8,
	dirty: 0,
	updateFrequency: 5,
	changeFactor: 1.25,
	onChange: undefined,
	update: function(){
		if(this.dirty == 0) {
			if(FPS.fps <= this.degradeWhen) {
			  	this.denominator *= this.changeFactor;
				if(this.denominator <= this.denominatorMax) {

					this.makeDirty();
				} else {
					this.denominator = this.denominatorMax;
				}
			} else if (FPS.fps >= this.upgradeWhen) {
				this.denominator /= this.changeFactor;
				if(this.denominator >= .99) {
					
					this.makeDirty();
				} else {
					this.denominator = 1;
				}
			}
		}
		this.denominatorSquared = this.denominator * this.denominator;

		if(this.dirty > 0) {
			this.dirty--;
		}
	},
	makeDirty: function(){
	  	this.onChange.dispatch(1/this.denominator);
	  	this.dirty = this.updateFrequency;
	}
}

module.exports = new PerformanceTweaker();
},{"../vendor/signals":37,"./FPS":28}],34:[function(require,module,exports){
function makeGamma(pow) {
	pow = Math.min(8, Math.max(0.01, pow));
	return function(inVal) {
		return Math.pow(inVal, 1/pow);
	}
};
function sine(inVal) {
	return Math.sin(inVal * Math.PI - Math.PI * .5) * .5 + .5;
};
function makePowerSine(pow) {
	return function(inVal) {
		for (var i = 0; i < pow; i++) {
			inVal = sine(inVal);
		};
		return inVal;
	}
};
function cosine(inVal) {
	return inVal + inVal - (Math.sin(inVal * Math.PI - Math.PI * .5) * .5 + .5);
};
function makePowerCosine(pow) {
	return function(inVal) {
		for (var i = 0; i < pow; i++) {
			inVal = cosine(inVal);
		};
		return inVal;
	}
};
function makeInvertedGamma(pow) {
	var gamma = makeGamma(pow);
	return function(inVal) {
		return 1 - gamma(inVal);
	}
};
function makeGammaSine(pow) {
	var gamma = makeGamma(pow);
	return function(inVal) {
		return gamma(sine(inVal));
	}
};
function linear(inVal) {
	return inVal;
};
function interpret(str){
	
	return linear;
};
module.exports = {
	linear: linear,
	makeGamma: makeGamma,
	makeInvertedGamma: makeInvertedGamma,
	sine: sine,
	makePowerSine: makePowerSine,
	cosine: cosine,
	makePowerCosine: makePowerCosine,
	makeGammaSine: makeGammaSine,
	interpret: interpret
}
},{}],35:[function(require,module,exports){
var Geometry = require('../model/Geometry');
var Mesh = require('../model/Mesh');
function TestFactory() {
	
}

TestFactory.prototype = {
	createVoxelClusterMesh: function(totalVoxels, rangeBox3) {
		rangeBox3 = rangeBox3 || new THREE.Box3(
			new THREE.Vector3(-10, -10, -10),
			new THREE.Vector3(10, 10, 10)
		);
		var vertices = [];
		var basePos = rangeBox3.min;
		var rangeBox3Size = rangeBox3.max.clone().sub(rangeBox3.min);
		for (var i = 0; i < totalVoxels; i++) {
			vertices[i] = new THREE.Vector3(
				basePos.x + Math.random() * rangeBox3Size.x,
				basePos.y + Math.random() * rangeBox3Size.y,
				basePos.z + Math.random() * rangeBox3Size.z
			);
		};
		var geometry = new Geometry({
			vertices : vertices
		});
		return new Mesh(geometry);
	},
	createVoxelCubeMesh: function(totalVoxels, size) {
		size = size || 10;
		var sizeHalf = size * .5;
		return this.createVoxelClusterMesh(
			totalVoxels,
			new THREE.Box3(
				new THREE.Vector3(-sizeHalf, -sizeHalf, -sizeHalf),
				new THREE.Vector3(sizeHalf, sizeHalf, sizeHalf)
			)
		);
	}
};

module.exports = new TestFactory();
},{"../model/Geometry":12,"../model/Mesh":13}],36:[function(require,module,exports){
module.exports = {
	getParam : function(name) {
		var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
		var results = regex.exec(window.location.href);
		
		if (results==null){
		   return undefined;
		} else if(results[1] == "true"){
			return true;
		} else if(results[1] == "false"){
			return false;
		} else if(!isNaN(results[1])){
			return parseInt(results[1]);
		} else {
			return results[1] || false;
		}
	}
}
},{}],37:[function(require,module,exports){
/**
 * Signals for Node.js
 * Node.js version of JS Signals <http://millermedeiros.github.com/js-signals/> by Miller Medeiros <http://millermedeiros.com/>
 * Released under the MIT license <http://www.opensource.org/licenses/mit-license.php>
 * @author Miller Medeiros
 * @author Igor Urmincek
 * @version 0.5.1
 */

	
/**
 * @namespace Signals Namespace - Custom event/messaging system based on AS3 Signals
 * @name signals
 */
var signals = {};

/**
 * Signals Version Number
 * @type string
 * @const
 */
exports.VERSION = '0.5.1';


/**
 * Object that represents a binding between a Signal and a listener function.
 * <br />- <strong>This is an internall constructor and shouldn't be called by regular user.</strong>
 * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
 * @author Miller Medeiros
 * @constructor
 * @name exports.SignalBinding
 * @param {exports.Signal} signal	Reference to Signal object that listener is currently bound to.
 * @param {Function} listener	Handler function bound to the signal.
 * @param {boolean} isOnce	If binding should be executed just once.
 * @param {Object} [listenerContext]	Context on which listener will be executed (object that should represent the `this` variable inside listener function).
 */
 function SignalBinding(signal, listener, isOnce, listenerContext){
	
	/**
	 * Handler function bound to the signal.
	 * @type Function
	 * @private
	 */
	this._listener = listener;
	
	/**
	 * If binding should be executed just once.
	 * @type boolean
	 * @private
	 */
	this._isOnce = isOnce;
	
	/**
	 * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
	 * @memberOf exports.SignalBinding.prototype
	 * @name context
	 * @type {Object|undefined}
	 */
	this.context = listenerContext;
	
	/**
	 * Reference to Signal object that listener is currently bound to.
	 * @type exports.Signal
	 * @private
	 */
	this._signal = signal;
}

SignalBinding.prototype = /** @lends exports.SignalBinding.prototype */ {
	
	/**
	 * @type boolean
	 * @private
	 */
	_isEnabled : true,
	
	/**
	 * Call listener passing arbitrary parameters.
	 * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p> 
	 * @param {Array} [paramsArr]	Array of parameters that should be passed to the listener
	 * @return {*} Value returned by the listener.
	 */
	execute : function(paramsArr){
		var r;
		if(this._isEnabled){
			r = this._listener.apply(this.context, paramsArr);
			if(this._isOnce){
				this.detach();
			}
		}
		return r; //avoid warnings on some editors
	},
	
	/**
	 * Detach binding from signal.
	 * - alias to: mySignal.remove(myBinding.getListener());
	 * @return {Function} Handler function bound to the signal.
	 */
	detach : function(){
		return this._signal.remove(this._listener);
	},
	
	/**
	 * @return {Function} Handler function bound to the signal.
	 */
	getListener : function(){
		return this._listener;
	},
	
	/**
	 * Remove binding from signal and destroy any reference to external Objects (destroy SignalBinding object).
	 * <p><strong>IMPORTANT:</strong> calling methods on the binding instance after calling dispose will throw errors.</p>
	 */
	dispose : function(){
		this.detach();
		this._destroy();
	},
	
	/**
	 * Delete all instance properties
	 * @private
	 */
	_destroy : function(){
		delete this._signal;
		delete this._isOnce;
		delete this._listener;
		delete this.context;
	},
	
	/**
	 * Disable SignalBinding, block listener execution. Listener will only be executed after calling `enable()`.  
	 * @see exports.SignalBinding.enable()
	 */
	disable : function(){
		this._isEnabled = false;
	},
	
	/**
	 * Enable SignalBinding. Enable listener execution.
	 * @see exports.SignalBinding.disable()
	 */
	enable : function(){
		this._isEnabled = true;
	},
	
	/**
	 * @return {boolean} If SignalBinding is currently paused and won't execute listener during dispatch.
	 */
	isEnabled : function(){
		return this._isEnabled;
	},
	
	/**
	 * @return {boolean} If SignalBinding will only be executed once.
	 */
	isOnce : function(){
		return this._isOnce;
	},
	
	/**
	 * @return {string} String representation of the object.
	 */
	toString : function(){
		return '[SignalBinding isOnce: '+ this._isOnce +', isEnabled: '+ this._isEnabled +']';
	}
	
};

/**
 * Custom event broadcaster
 * <br />- inspired by Robert Penner's AS3 Signals.
 * @author Miller Medeiros
 * @constructor
 */
exports.Signal = function(){
	/**
	 * @type Array.<SignalBinding>
	 * @private
	 */
	this._bindings = [];
};


exports.Signal.prototype = {
	
	/**
	 * @type boolean
	 * @private
	 */
	_shouldPropagate : true,
	
	/**
	 * @type boolean
	 * @private
	 */
	_isEnabled : true,
	
	/**
	 * @param {Function} listener
	 * @param {boolean} isOnce
	 * @param {Object} [scope]
	 * @return {SignalBinding}
	 * @private
	 */
	_registerListener : function(listener, isOnce, scope){
		
		if(typeof listener !== 'function'){
			throw new Error('listener is a required param of add() and addOnce().');
		}
		
		var prevIndex = this._indexOfListener(listener),
			binding;
		
		if(prevIndex !== -1){ //avoid creating a new Binding for same listener if already added to list
			binding = this._bindings[prevIndex];
			if(binding.isOnce() !== isOnce){
				throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
			}
		} else {
			binding = new SignalBinding(this, listener, isOnce, scope);
			this._addBinding(binding);
		}
		
		return binding;
	},
	
	/**
	 * @param {SignalBinding} binding
	 * @private
	 */
	_addBinding : function(binding){
		this._bindings.push(binding);
	},
	
	/**
	 * @param {Function} listener
	 * @return {number}
	 * @private
	 */
	_indexOfListener : function(listener){
		var n = this._bindings.length;
		while(n--){
			if(this._bindings[n]._listener === listener){
				return n;
			}
		}
		return -1;
	},
	
	/**
	 * Add a listener to the signal.
	 * @param {Function} listener	Signal handler function.
	 * @param {Object} [scope]	Context on which listener will be executed (object that should represent the `this` variable inside listener function).
	 * @return {SignalBinding} An Object representing the binding between the Signal and listener.
	 */
	add : function(listener, scope){
		return this._registerListener(listener, false, scope);
	},
	
	/**
	 * Add listener to the signal that should be removed after first execution (will be executed only once).
	 * @param {Function} listener	Signal handler function.
	 * @param {Object} [scope]	Context on which listener will be executed (object that should represent the `this` variable inside listener function).
	 * @return {SignalBinding} An Object representing the binding between the Signal and listener.
	 */
	addOnce : function(listener, scope){
		return this._registerListener(listener, true, scope);
	},
	
	/**
	 * @private
	 */
	_removeByIndex : function(i){
		this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
		this._bindings.splice(i, 1);
	},
	
	/**
	 * Remove a single listener from the dispatch queue.
	 * @param {Function} listener	Handler function that should be removed.
	 * @return {Function} Listener handler function.
	 */
	remove : function(listener){
		if(typeof listener !== 'function'){
			throw new Error('listener is a required param of remove().');
		}
		
		var i = this._indexOfListener(listener);
		if(i !== -1){
			this._removeByIndex(i);
		}
		return listener;
	},
	
	/**
	 * Remove all listeners from the Signal.
	 */
	removeAll : function(){
		var n = this._bindings.length;
		while(n--){
			this._removeByIndex(n);
		}
	},
	
	/**
	 * @return {number} Number of listeners attached to the Signal.
	 */
	getNumListeners : function(){
		return this._bindings.length;
	},
	
	/**
	 * Disable Signal. Block dispatch to listeners until `enable()` is called.
	 * <p><strong>IMPORTANT:</strong> If this method is called during a dispatch it will only have effect on the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
	 * @see exports.Signal.prototype.enable
	 * @see exports.Signal.prototype.halt
	 */
	disable : function(){
		this._isEnabled = false;
	},
	
	/**
	 * Enable broadcast to listeners.
	 * @see exports.Signal.prototype.disable
	 */
	enable : function(){
		this._isEnabled = true;
	}, 
	
	/**
	 * @return {boolean} If Signal is currently enabled and will broadcast message to listeners.
	 */
	isEnabled : function(){
		return this._isEnabled;
	},
	
	/**
	 * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
	 * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
	 * @see exports.Signal.prototype.disable 
	 */
	halt : function(){
		this._shouldPropagate = false;
	},
	
	/**
	 * Dispatch/Broadcast Signal to all listeners added to the queue. 
	 * @param {...*} [params]	Parameters that should be passed to each handler.
	 */
	dispatch : function(params){
		if(! this._isEnabled){
			return;
		}
		
		var paramsArr = Array.prototype.slice.call(arguments),
			bindings = this._bindings.slice(), //clone array in case add/remove items during dispatch
			i,
			n = this._bindings.length;
		
		this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.
					
		for(i=0; i<n; i++){
			//execute all callbacks until end of the list or until a callback returns `false` or stops propagation
			if(bindings[i].execute(paramsArr) === false || !this._shouldPropagate){
				break;
			}
		}
	},
	
	/**
	 * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
	 * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
	 */
	dispose : function(){
		this.removeAll();
		delete this._bindings;
	},
	
	/**
	 * @return {string} String representation of the object.
	 */
	toString : function(){
		return '[Signal isEnabled: '+ this._isEnabled +' numListeners: '+ this.getNumListeners() +']';
	}
	
};

},{}],38:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 * @author Larry Battle / http://bateru.com/news
 * @author bhouston / http://exocortex.com
 */

THREE = { REVISION: '67' };

self.console = self.console || {

	info: function () {},
	log: function () {},
	debug: function () {},
	warn: function () {},
	error: function () {}

};

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
// using 'self' instead of 'window' for compatibility with both NodeJS and IE10.
( function () {

	var lastTime = 0;
	var vendors = [ 'ms', 'moz', 'webkit', 'o' ];

	for ( var x = 0; x < vendors.length && !self.requestAnimationFrame; ++ x ) {

		self.requestAnimationFrame = self[ vendors[ x ] + 'RequestAnimationFrame' ];
		self.cancelAnimationFrame = self[ vendors[ x ] + 'CancelAnimationFrame' ] || self[ vendors[ x ] + 'CancelRequestAnimationFrame' ];

	}

	if ( self.requestAnimationFrame === undefined && self['setTimeout'] !== undefined ) {

		self.requestAnimationFrame = function ( callback ) {

			var currTime = Date.now(), timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
			var id = self.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
			lastTime = currTime + timeToCall;
			return id;

		};

	}

	if( self.cancelAnimationFrame === undefined && self['clearTimeout'] !== undefined ) {

		self.cancelAnimationFrame = function ( id ) { self.clearTimeout( id ) };

	}

}() );

// GL STATE CONSTANTS

THREE.CullFaceNone = 0;
THREE.CullFaceBack = 1;
THREE.CullFaceFront = 2;
THREE.CullFaceFrontBack = 3;

THREE.FrontFaceDirectionCW = 0;
THREE.FrontFaceDirectionCCW = 1;

// SHADOWING TYPES

THREE.BasicShadowMap = 0;
THREE.PCFShadowMap = 1;
THREE.PCFSoftShadowMap = 2;

// MATERIAL CONSTANTS

// side

THREE.FrontSide = 0;
THREE.BackSide = 1;
THREE.DoubleSide = 2;

// shading

THREE.NoShading = 0;
THREE.FlatShading = 1;
THREE.SmoothShading = 2;

// colors

THREE.NoColors = 0;
THREE.FaceColors = 1;
THREE.VertexColors = 2;

// blending modes

THREE.NoBlending = 0;
THREE.NormalBlending = 1;
THREE.AdditiveBlending = 2;
THREE.SubtractiveBlending = 3;
THREE.MultiplyBlending = 4;
THREE.CustomBlending = 5;

// custom blending equations
// (numbers start from 100 not to clash with other
//  mappings to OpenGL constants defined in Texture.js)

THREE.AddEquation = 100;
THREE.SubtractEquation = 101;
THREE.ReverseSubtractEquation = 102;

// custom blending destination factors

THREE.ZeroFactor = 200;
THREE.OneFactor = 201;
THREE.SrcColorFactor = 202;
THREE.OneMinusSrcColorFactor = 203;
THREE.SrcAlphaFactor = 204;
THREE.OneMinusSrcAlphaFactor = 205;
THREE.DstAlphaFactor = 206;
THREE.OneMinusDstAlphaFactor = 207;

// custom blending source factors

//THREE.ZeroFactor = 200;
//THREE.OneFactor = 201;
//THREE.SrcAlphaFactor = 204;
//THREE.OneMinusSrcAlphaFactor = 205;
//THREE.DstAlphaFactor = 206;
//THREE.OneMinusDstAlphaFactor = 207;
THREE.DstColorFactor = 208;
THREE.OneMinusDstColorFactor = 209;
THREE.SrcAlphaSaturateFactor = 210;


// TEXTURE CONSTANTS

THREE.MultiplyOperation = 0;
THREE.MixOperation = 1;
THREE.AddOperation = 2;

// Mapping modes

THREE.UVMapping = function () {};

THREE.CubeReflectionMapping = function () {};
THREE.CubeRefractionMapping = function () {};

THREE.SphericalReflectionMapping = function () {};
THREE.SphericalRefractionMapping = function () {};

// Wrapping modes

THREE.RepeatWrapping = 1000;
THREE.ClampToEdgeWrapping = 1001;
THREE.MirroredRepeatWrapping = 1002;

// Filters

THREE.NearestFilter = 1003;
THREE.NearestMipMapNearestFilter = 1004;
THREE.NearestMipMapLinearFilter = 1005;
THREE.LinearFilter = 1006;
THREE.LinearMipMapNearestFilter = 1007;
THREE.LinearMipMapLinearFilter = 1008;

// Data types

THREE.UnsignedByteType = 1009;
THREE.ByteType = 1010;
THREE.ShortType = 1011;
THREE.UnsignedShortType = 1012;
THREE.IntType = 1013;
THREE.UnsignedIntType = 1014;
THREE.FloatType = 1015;

// Pixel types

//THREE.UnsignedByteType = 1009;
THREE.UnsignedShort4444Type = 1016;
THREE.UnsignedShort5551Type = 1017;
THREE.UnsignedShort565Type = 1018;

// Pixel formats

THREE.AlphaFormat = 1019;
THREE.RGBFormat = 1020;
THREE.RGBAFormat = 1021;
THREE.LuminanceFormat = 1022;
THREE.LuminanceAlphaFormat = 1023;

// Compressed texture formats

THREE.RGB_S3TC_DXT1_Format = 2001;
THREE.RGBA_S3TC_DXT1_Format = 2002;
THREE.RGBA_S3TC_DXT3_Format = 2003;
THREE.RGBA_S3TC_DXT5_Format = 2004;

/*
// Potential future PVRTC compressed texture formats
THREE.RGB_PVRTC_4BPPV1_Format = 2100;
THREE.RGB_PVRTC_2BPPV1_Format = 2101;
THREE.RGBA_PVRTC_4BPPV1_Format = 2102;
THREE.RGBA_PVRTC_2BPPV1_Format = 2103;
*/

/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.Color = function ( color ) {

	if ( arguments.length === 3 ) {

		return this.setRGB( arguments[ 0 ], arguments[ 1 ], arguments[ 2 ] );

	}

	return this.set( color )

};

THREE.Color.prototype = {

	constructor: THREE.Color,

	r: 1, g: 1, b: 1,

	set: function ( value ) {

		if ( value instanceof THREE.Color ) {

			this.copy( value );

		} else if ( typeof value === 'number' ) {

			this.setHex( value );

		} else if ( typeof value === 'string' ) {

			this.setStyle( value );

		}

		return this;

	},

	setHex: function ( hex ) {

		hex = Math.floor( hex );

		this.r = ( hex >> 16 & 255 ) / 255;
		this.g = ( hex >> 8 & 255 ) / 255;
		this.b = ( hex & 255 ) / 255;

		return this;

	},

	setRGB: function ( r, g, b ) {

		this.r = r;
		this.g = g;
		this.b = b;

		return this;

	},

	setHSL: function ( h, s, l ) {

		// h,s,l ranges are in 0.0 - 1.0

		if ( s === 0 ) {

			this.r = this.g = this.b = l;

		} else {

			var hue2rgb = function ( p, q, t ) {

				if ( t < 0 ) t += 1;
				if ( t > 1 ) t -= 1;
				if ( t < 1 / 6 ) return p + ( q - p ) * 6 * t;
				if ( t < 1 / 2 ) return q;
				if ( t < 2 / 3 ) return p + ( q - p ) * 6 * ( 2 / 3 - t );
				return p;

			};

			var p = l <= 0.5 ? l * ( 1 + s ) : l + s - ( l * s );
			var q = ( 2 * l ) - p;

			this.r = hue2rgb( q, p, h + 1 / 3 );
			this.g = hue2rgb( q, p, h );
			this.b = hue2rgb( q, p, h - 1 / 3 );

		}

		return this;

	},

	setStyle: function ( style ) {

		// rgb(255,0,0)

		if ( /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.test( style ) ) {

			var color = /^rgb\((\d+), ?(\d+), ?(\d+)\)$/i.exec( style );

			this.r = Math.min( 255, parseInt( color[ 1 ], 10 ) ) / 255;
			this.g = Math.min( 255, parseInt( color[ 2 ], 10 ) ) / 255;
			this.b = Math.min( 255, parseInt( color[ 3 ], 10 ) ) / 255;

			return this;

		}

		// rgb(100%,0%,0%)

		if ( /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.test( style ) ) {

			var color = /^rgb\((\d+)\%, ?(\d+)\%, ?(\d+)\%\)$/i.exec( style );

			this.r = Math.min( 100, parseInt( color[ 1 ], 10 ) ) / 100;
			this.g = Math.min( 100, parseInt( color[ 2 ], 10 ) ) / 100;
			this.b = Math.min( 100, parseInt( color[ 3 ], 10 ) ) / 100;

			return this;

		}

		// #ff0000

		if ( /^\#([0-9a-f]{6})$/i.test( style ) ) {

			var color = /^\#([0-9a-f]{6})$/i.exec( style );

			this.setHex( parseInt( color[ 1 ], 16 ) );

			return this;

		}

		// #f00

		if ( /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.test( style ) ) {

			var color = /^\#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec( style );

			this.setHex( parseInt( color[ 1 ] + color[ 1 ] + color[ 2 ] + color[ 2 ] + color[ 3 ] + color[ 3 ], 16 ) );

			return this;

		}

		// red

		if ( /^(\w+)$/i.test( style ) ) {

			this.setHex( THREE.ColorKeywords[ style ] );

			return this;

		}


	},

	copy: function ( color ) {

		this.r = color.r;
		this.g = color.g;
		this.b = color.b;

		return this;

	},

	copyGammaToLinear: function ( color ) {

		this.r = color.r * color.r;
		this.g = color.g * color.g;
		this.b = color.b * color.b;

		return this;

	},

	copyLinearToGamma: function ( color ) {

		this.r = Math.sqrt( color.r );
		this.g = Math.sqrt( color.g );
		this.b = Math.sqrt( color.b );

		return this;

	},

	convertGammaToLinear: function () {

		var r = this.r, g = this.g, b = this.b;

		this.r = r * r;
		this.g = g * g;
		this.b = b * b;

		return this;

	},

	convertLinearToGamma: function () {

		this.r = Math.sqrt( this.r );
		this.g = Math.sqrt( this.g );
		this.b = Math.sqrt( this.b );

		return this;

	},

	getHex: function () {

		return ( this.r * 255 ) << 16 ^ ( this.g * 255 ) << 8 ^ ( this.b * 255 ) << 0;

	},

	getHexString: function () {

		return ( '000000' + this.getHex().toString( 16 ) ).slice( - 6 );

	},

	getHSL: function ( optionalTarget ) {

		// h,s,l ranges are in 0.0 - 1.0

		var hsl = optionalTarget || { h: 0, s: 0, l: 0 };

		var r = this.r, g = this.g, b = this.b;

		var max = Math.max( r, g, b );
		var min = Math.min( r, g, b );

		var hue, saturation;
		var lightness = ( min + max ) / 2.0;

		if ( min === max ) {

			hue = 0;
			saturation = 0;

		} else {

			var delta = max - min;

			saturation = lightness <= 0.5 ? delta / ( max + min ) : delta / ( 2 - max - min );

			switch ( max ) {

				case r: hue = ( g - b ) / delta + ( g < b ? 6 : 0 ); break;
				case g: hue = ( b - r ) / delta + 2; break;
				case b: hue = ( r - g ) / delta + 4; break;

			}

			hue /= 6;

		}

		hsl.h = hue;
		hsl.s = saturation;
		hsl.l = lightness;

		return hsl;

	},

	getStyle: function () {

		return 'rgb(' + ( ( this.r * 255 ) | 0 ) + ',' + ( ( this.g * 255 ) | 0 ) + ',' + ( ( this.b * 255 ) | 0 ) + ')';

	},

	offsetHSL: function ( h, s, l ) {

		var hsl = this.getHSL();

		hsl.h += h; hsl.s += s; hsl.l += l;

		this.setHSL( hsl.h, hsl.s, hsl.l );

		return this;

	},

	add: function ( color ) {

		this.r += color.r;
		this.g += color.g;
		this.b += color.b;

		return this;

	},

	addColors: function ( color1, color2 ) {

		this.r = color1.r + color2.r;
		this.g = color1.g + color2.g;
		this.b = color1.b + color2.b;

		return this;

	},

	addScalar: function ( s ) {

		this.r += s;
		this.g += s;
		this.b += s;

		return this;

	},

	multiply: function ( color ) {

		this.r *= color.r;
		this.g *= color.g;
		this.b *= color.b;

		return this;

	},

	multiplyScalar: function ( s ) {

		this.r *= s;
		this.g *= s;
		this.b *= s;

		return this;

	},

	lerp: function ( color, alpha ) {

		this.r += ( color.r - this.r ) * alpha;
		this.g += ( color.g - this.g ) * alpha;
		this.b += ( color.b - this.b ) * alpha;

		return this;

	},

	equals: function ( c ) {

		return ( c.r === this.r ) && ( c.g === this.g ) && ( c.b === this.b );

	},

	fromArray: function ( array ) {

		this.r = array[ 0 ];
		this.g = array[ 1 ];
		this.b = array[ 2 ];

		return this;

	},

	toArray: function () {

		return [ this.r, this.g, this.b ];

	},

	clone: function () {

		return new THREE.Color().setRGB( this.r, this.g, this.b );

	}

};

THREE.ColorKeywords = { "aliceblue": 0xF0F8FF, "antiquewhite": 0xFAEBD7, "aqua": 0x00FFFF, "aquamarine": 0x7FFFD4, "azure": 0xF0FFFF,
"beige": 0xF5F5DC, "bisque": 0xFFE4C4, "black": 0x000000, "blanchedalmond": 0xFFEBCD, "blue": 0x0000FF, "blueviolet": 0x8A2BE2,
"brown": 0xA52A2A, "burlywood": 0xDEB887, "cadetblue": 0x5F9EA0, "chartreuse": 0x7FFF00, "chocolate": 0xD2691E, "coral": 0xFF7F50,
"cornflowerblue": 0x6495ED, "cornsilk": 0xFFF8DC, "crimson": 0xDC143C, "cyan": 0x00FFFF, "darkblue": 0x00008B, "darkcyan": 0x008B8B,
"darkgoldenrod": 0xB8860B, "darkgray": 0xA9A9A9, "darkgreen": 0x006400, "darkgrey": 0xA9A9A9, "darkkhaki": 0xBDB76B, "darkmagenta": 0x8B008B,
"darkolivegreen": 0x556B2F, "darkorange": 0xFF8C00, "darkorchid": 0x9932CC, "darkred": 0x8B0000, "darksalmon": 0xE9967A, "darkseagreen": 0x8FBC8F,
"darkslateblue": 0x483D8B, "darkslategray": 0x2F4F4F, "darkslategrey": 0x2F4F4F, "darkturquoise": 0x00CED1, "darkviolet": 0x9400D3,
"deeppink": 0xFF1493, "deepskyblue": 0x00BFFF, "dimgray": 0x696969, "dimgrey": 0x696969, "dodgerblue": 0x1E90FF, "firebrick": 0xB22222,
"floralwhite": 0xFFFAF0, "forestgreen": 0x228B22, "fuchsia": 0xFF00FF, "gainsboro": 0xDCDCDC, "ghostwhite": 0xF8F8FF, "gold": 0xFFD700,
"goldenrod": 0xDAA520, "gray": 0x808080, "green": 0x008000, "greenyellow": 0xADFF2F, "grey": 0x808080, "honeydew": 0xF0FFF0, "hotpink": 0xFF69B4,
"indianred": 0xCD5C5C, "indigo": 0x4B0082, "ivory": 0xFFFFF0, "khaki": 0xF0E68C, "lavender": 0xE6E6FA, "lavenderblush": 0xFFF0F5, "lawngreen": 0x7CFC00,
"lemonchiffon": 0xFFFACD, "lightblue": 0xADD8E6, "lightcoral": 0xF08080, "lightcyan": 0xE0FFFF, "lightgoldenrodyellow": 0xFAFAD2, "lightgray": 0xD3D3D3,
"lightgreen": 0x90EE90, "lightgrey": 0xD3D3D3, "lightpink": 0xFFB6C1, "lightsalmon": 0xFFA07A, "lightseagreen": 0x20B2AA, "lightskyblue": 0x87CEFA,
"lightslategray": 0x778899, "lightslategrey": 0x778899, "lightsteelblue": 0xB0C4DE, "lightyellow": 0xFFFFE0, "lime": 0x00FF00, "limegreen": 0x32CD32,
"linen": 0xFAF0E6, "magenta": 0xFF00FF, "maroon": 0x800000, "mediumaquamarine": 0x66CDAA, "mediumblue": 0x0000CD, "mediumorchid": 0xBA55D3,
"mediumpurple": 0x9370DB, "mediumseagreen": 0x3CB371, "mediumslateblue": 0x7B68EE, "mediumspringgreen": 0x00FA9A, "mediumturquoise": 0x48D1CC,
"mediumvioletred": 0xC71585, "midnightblue": 0x191970, "mintcream": 0xF5FFFA, "mistyrose": 0xFFE4E1, "moccasin": 0xFFE4B5, "navajowhite": 0xFFDEAD,
"navy": 0x000080, "oldlace": 0xFDF5E6, "olive": 0x808000, "olivedrab": 0x6B8E23, "orange": 0xFFA500, "orangered": 0xFF4500, "orchid": 0xDA70D6,
"palegoldenrod": 0xEEE8AA, "palegreen": 0x98FB98, "paleturquoise": 0xAFEEEE, "palevioletred": 0xDB7093, "papayawhip": 0xFFEFD5, "peachpuff": 0xFFDAB9,
"peru": 0xCD853F, "pink": 0xFFC0CB, "plum": 0xDDA0DD, "powderblue": 0xB0E0E6, "purple": 0x800080, "red": 0xFF0000, "rosybrown": 0xBC8F8F,
"royalblue": 0x4169E1, "saddlebrown": 0x8B4513, "salmon": 0xFA8072, "sandybrown": 0xF4A460, "seagreen": 0x2E8B57, "seashell": 0xFFF5EE,
"sienna": 0xA0522D, "silver": 0xC0C0C0, "skyblue": 0x87CEEB, "slateblue": 0x6A5ACD, "slategray": 0x708090, "slategrey": 0x708090, "snow": 0xFFFAFA,
"springgreen": 0x00FF7F, "steelblue": 0x4682B4, "tan": 0xD2B48C, "teal": 0x008080, "thistle": 0xD8BFD8, "tomato": 0xFF6347, "turquoise": 0x40E0D0,
"violet": 0xEE82EE, "wheat": 0xF5DEB3, "white": 0xFFFFFF, "whitesmoke": 0xF5F5F5, "yellow": 0xFFFF00, "yellowgreen": 0x9ACD32 };

/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

THREE.Quaternion = function ( x, y, z, w ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._w = ( w !== undefined ) ? w : 1;

};

THREE.Quaternion.prototype = {

	constructor: THREE.Quaternion,

	_x: 0,_y: 0, _z: 0, _w: 0,

	get x () {

		return this._x;

	},

	set x ( value ) {

		this._x = value;
		this.onChangeCallback();

	},

	get y () {

		return this._y;

	},

	set y ( value ) {

		this._y = value;
		this.onChangeCallback();

	},

	get z () {

		return this._z;

	},

	set z ( value ) {

		this._z = value;
		this.onChangeCallback();

	},

	get w () {

		return this._w;

	},

	set w ( value ) {

		this._w = value;
		this.onChangeCallback();

	},

	set: function ( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this.onChangeCallback();

		return this;

	},

	copy: function ( quaternion ) {

		this._x = quaternion._x;
		this._y = quaternion._y;
		this._z = quaternion._z;
		this._w = quaternion._w;

		this.onChangeCallback();

		return this;

	},

	setFromEuler: function ( euler, update ) {

		if ( euler instanceof THREE.Euler === false ) {

			throw new Error( 'ERROR: Quaternion\'s .setFromEuler() now expects a Euler rotation rather than a Vector3 and order.  Please update your code.' );
		}

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		var c1 = Math.cos( euler._x / 2 );
		var c2 = Math.cos( euler._y / 2 );
		var c3 = Math.cos( euler._z / 2 );
		var s1 = Math.sin( euler._x / 2 );
		var s2 = Math.sin( euler._y / 2 );
		var s3 = Math.sin( euler._z / 2 );

		if ( euler.order === 'XYZ' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( euler.order === 'YXZ' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( euler.order === 'ZXY' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( euler.order === 'ZYX' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( euler.order === 'YZX' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( euler.order === 'XZY' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		}

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	setFromAxisAngle: function ( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		var halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements,

			m11 = te[0], m12 = te[4], m13 = te[8],
			m21 = te[1], m22 = te[5], m23 = te[9],
			m31 = te[2], m32 = te[6], m33 = te[10],

			trace = m11 + m22 + m33,
			s;

		if ( trace > 0 ) {

			s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = (m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = (m12 + m21 ) / s;
			this._z = (m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = (m13 - m31 ) / s;
			this._x = (m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = (m23 + m32 ) / s;

		} else {

			s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this.onChangeCallback();

		return this;

	},

	setFromUnitVectors: function () {

		// http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final

		// assumes direction vectors vFrom and vTo are normalized

		var v1, r;

		var EPS = 0.000001;

		return function( vFrom, vTo ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			r = vFrom.dot( vTo ) + 1;

			if ( r < EPS ) {

				r = 0;

				if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

					v1.set( - vFrom.y, vFrom.x, 0 );

				} else {

					v1.set( 0, - vFrom.z, vFrom.y );

				}

			} else {

				v1.crossVectors( vFrom, vTo );

			}

			this._x = v1.x;
			this._y = v1.y;
			this._z = v1.z;
			this._w = r;

			this.normalize();

			return this;

		}

	}(),

	inverse: function () {

		this.conjugate().normalize();

		return this;

	},

	conjugate: function () {

		this._x *= -1;
		this._y *= -1;
		this._z *= -1;

		this.onChangeCallback();

		return this;

	},

	lengthSq: function () {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	},

	length: function () {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	},

	normalize: function () {

		var l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this.onChangeCallback();

		return this;

	},

	multiply: function ( q, p ) {

		if ( p !== undefined ) {

			console.warn( 'DEPRECATED: Quaternion\'s .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
			return this.multiplyQuaternions( q, p );

		}

		return this.multiplyQuaternions( this, q );

	},

	multiplyQuaternions: function ( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		var qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		var qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this.onChangeCallback();

		return this;

	},

	multiplyVector3: function ( vector ) {

		console.warn( 'DEPRECATED: Quaternion\'s .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead.' );
		return vector.applyQuaternion( this );

	},

	slerp: function ( qb, t ) {

		var x = this._x, y = this._y, z = this._z, w = this._w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		var cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

		if ( cosHalfTheta < 0 ) {

			this._w = -qb._w;
			this._x = -qb._x;
			this._y = -qb._y;
			this._z = -qb._z;

			cosHalfTheta = -cosHalfTheta;

		} else {

			this.copy( qb );

		}

		if ( cosHalfTheta >= 1.0 ) {

			this._w = w;
			this._x = x;
			this._y = y;
			this._z = z;

			return this;

		}

		var halfTheta = Math.acos( cosHalfTheta );
		var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

		if ( Math.abs( sinHalfTheta ) < 0.001 ) {

			this._w = 0.5 * ( w + this._w );
			this._x = 0.5 * ( x + this._x );
			this._y = 0.5 * ( y + this._y );
			this._z = 0.5 * ( z + this._z );

			return this;

		}

		var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
		ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		this._w = ( w * ratioA + this._w * ratioB );
		this._x = ( x * ratioA + this._x * ratioB );
		this._y = ( y * ratioA + this._y * ratioB );
		this._z = ( z * ratioA + this._z * ratioB );

		this.onChangeCallback();

		return this;

	},

	equals: function ( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	},

	fromArray: function ( array ) {

		this._x = array[ 0 ];
		this._y = array[ 1 ];
		this._z = array[ 2 ];
		this._w = array[ 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function () {

		return [ this._x, this._y, this._z, this._w ];

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {},

	clone: function () {

		return new THREE.Quaternion( this._x, this._y, this._z, this._w );

	}

};

THREE.Quaternion.slerp = function ( qa, qb, qm, t ) {

	return qm.copy( qa ).slerp( qb, t );

}

/**
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

THREE.Vector2 = function ( x, y ) {

	this.x = x || 0;
	this.y = y || 0;

};

THREE.Vector2.prototype = {

	constructor: THREE.Vector2,

	set: function ( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( "index is out of range: " + index );

		}

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( "index is out of range: " + index );

		}

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector2\'s .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector2\'s .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	},
	
	multiply: function ( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	},

	multiplyScalar: function ( s ) {

		this.x *= s;
		this.y *= s;

		return this;

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	},

	divideScalar: function ( scalar ) {

		if ( scalar !== 0 ) {

			var invScalar = 1 / scalar;

			this.x *= invScalar;
			this.y *= invScalar;

		} else {

			this.x = 0;
			this.y = 0;

		}

		return this;

	},

	min: function ( v ) {

		if ( this.x > v.x ) {

			this.x = v.x;

		}

		if ( this.y > v.y ) {

			this.y = v.y;

		}

		return this;

	},

	max: function ( v ) {

		if ( this.x < v.x ) {

			this.x = v.x;

		}

		if ( this.y < v.y ) {

			this.y = v.y;

		}

		return this;

	},

	clamp: function ( min, max ) {

		// This function assumes min < max, if this assumption isn't true it will not operate correctly

		if ( this.x < min.x ) {

			this.x = min.x;

		} else if ( this.x > max.x ) {

			this.x = max.x;

		}

		if ( this.y < min.y ) {

			this.y = min.y;

		} else if ( this.y > max.y ) {

			this.y = max.y;

		}

		return this;
	},

	clampScalar: ( function () {

		var min, max;

		return function ( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new THREE.Vector2();
				max = new THREE.Vector2();

			}

			min.set( minVal, minVal );
			max.set( maxVal, maxVal );

			return this.clamp( min, max );

		};
		
	} )(),

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

		return this;

	},

	negate: function () {

		return this.multiplyScalar( - 1 );

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	},

	setLength: function ( l ) {

		var oldLength = this.length();

		if ( oldLength !== 0 && l !== oldLength ) {

			this.multiplyScalar( l / oldLength );
		}

		return this;

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	},

	equals: function( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	},

	fromArray: function ( array ) {

		this.x = array[ 0 ];
		this.y = array[ 1 ];

		return this;

	},

	toArray: function () {

		return [ this.x, this.y ];

	},

	clone: function () {

		return new THREE.Vector2( this.x, this.y );

	}

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author *kile / http://kile.stravaganza.org/
 * @author philogb / http://blog.thejit.org/
 * @author mikael emtinger / http://gomo.se/
 * @author egraether / http://egraether.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.Vector3 = function ( x, y, z ) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;

};

THREE.Vector3.prototype = {

	constructor: THREE.Vector3,

	set: function ( x, y, z ) {

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setZ: function ( z ) {

		this.z = z;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( "index is out of range: " + index );

		}

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( "index is out of range: " + index );

		}

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector3\'s .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector3\'s .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	},

	multiply: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector3\'s .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
			return this.multiplyVectors( v, w );

		}

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	},

	multiplyVectors: function ( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	},

	applyEuler: function () {

		var quaternion;

		return function ( euler ) {

			if ( euler instanceof THREE.Euler === false ) {

				console.error( 'ERROR: Vector3\'s .applyEuler() now expects a Euler rotation rather than a Vector3 and order.  Please update your code.' );

			}

			if ( quaternion === undefined ) quaternion = new THREE.Quaternion();

			this.applyQuaternion( quaternion.setFromEuler( euler ) );

			return this;

		};

	}(),

	applyAxisAngle: function () {

		var quaternion;

		return function ( axis, angle ) {

			if ( quaternion === undefined ) quaternion = new THREE.Quaternion();

			this.applyQuaternion( quaternion.setFromAxisAngle( axis, angle ) );

			return this;

		};

	}(),

	applyMatrix3: function ( m ) {

		var x = this.x;
		var y = this.y;
		var z = this.z;

		var e = m.elements;

		this.x = e[0] * x + e[3] * y + e[6] * z;
		this.y = e[1] * x + e[4] * y + e[7] * z;
		this.z = e[2] * x + e[5] * y + e[8] * z;

		return this;

	},

	applyMatrix4: function ( m ) {

		// input: THREE.Matrix4 affine matrix

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8]  * z + e[12];
		this.y = e[1] * x + e[5] * y + e[9]  * z + e[13];
		this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

		return this;

	},

	applyProjection: function ( m ) {

		// input: THREE.Matrix4 projection matrix

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;
		var d = 1 / ( e[3] * x + e[7] * y + e[11] * z + e[15] ); // perspective divide

		this.x = ( e[0] * x + e[4] * y + e[8]  * z + e[12] ) * d;
		this.y = ( e[1] * x + e[5] * y + e[9]  * z + e[13] ) * d;
		this.z = ( e[2] * x + e[6] * y + e[10] * z + e[14] ) * d;

		return this;

	},

	applyQuaternion: function ( q ) {

		var x = this.x;
		var y = this.y;
		var z = this.z;

		var qx = q.x;
		var qy = q.y;
		var qz = q.z;
		var qw = q.w;

		// calculate quat * vector

		var ix =  qw * x + qy * z - qz * y;
		var iy =  qw * y + qz * x - qx * z;
		var iz =  qw * z + qx * y - qy * x;
		var iw = -qx * x - qy * y - qz * z;

		// calculate result * inverse quat

		this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
		this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
		this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

		return this;

	},

	transformDirection: function ( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8]  * z;
		this.y = e[1] * x + e[5] * y + e[9]  * z;
		this.z = e[2] * x + e[6] * y + e[10] * z;

		this.normalize();

		return this;

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	},

	divideScalar: function ( scalar ) {

		if ( scalar !== 0 ) {

			var invScalar = 1 / scalar;

			this.x *= invScalar;
			this.y *= invScalar;
			this.z *= invScalar;

		} else {

			this.x = 0;
			this.y = 0;
			this.z = 0;

		}

		return this;

	},

	min: function ( v ) {

		if ( this.x > v.x ) {

			this.x = v.x;

		}

		if ( this.y > v.y ) {

			this.y = v.y;

		}

		if ( this.z > v.z ) {

			this.z = v.z;

		}

		return this;

	},

	max: function ( v ) {

		if ( this.x < v.x ) {

			this.x = v.x;

		}

		if ( this.y < v.y ) {

			this.y = v.y;

		}

		if ( this.z < v.z ) {

			this.z = v.z;

		}

		return this;

	},

	clamp: function ( min, max ) {

		// This function assumes min < max, if this assumption isn't true it will not operate correctly

		if ( this.x < min.x ) {

			this.x = min.x;

		} else if ( this.x > max.x ) {

			this.x = max.x;

		}

		if ( this.y < min.y ) {

			this.y = min.y;

		} else if ( this.y > max.y ) {

			this.y = max.y;

		}

		if ( this.z < min.z ) {

			this.z = min.z;

		} else if ( this.z > max.z ) {

			this.z = max.z;

		}

		return this;

	},

	clampScalar: ( function () {

		var min, max;

		return function ( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new THREE.Vector3();
				max = new THREE.Vector3();

			}

			min.set( minVal, minVal, minVal );
			max.set( maxVal, maxVal, maxVal );

			return this.clamp( min, max );

		};

	} )(),

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
		this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

		return this;

	},

	negate: function () {

		return this.multiplyScalar( - 1 );

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	},

	lengthManhattan: function () {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	setLength: function ( l ) {

		var oldLength = this.length();

		if ( oldLength !== 0 && l !== oldLength  ) {

			this.multiplyScalar( l / oldLength );
		}

		return this;

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	},

	cross: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector3\'s .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
			return this.crossVectors( v, w );

		}

		var x = this.x, y = this.y, z = this.z;

		this.x = y * v.z - z * v.y;
		this.y = z * v.x - x * v.z;
		this.z = x * v.y - y * v.x;

		return this;

	},

	crossVectors: function ( a, b ) {

		var ax = a.x, ay = a.y, az = a.z;
		var bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	},

	projectOnVector: function () {

		var v1, dot;

		return function ( vector ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			v1.copy( vector ).normalize();

			dot = this.dot( v1 );

			return this.copy( v1 ).multiplyScalar( dot );

		};

	}(),

	projectOnPlane: function () {

		var v1;

		return function ( planeNormal ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			v1.copy( this ).projectOnVector( planeNormal );

			return this.sub( v1 );

		}

	}(),

	reflect: function () {

		// reflect incident vector off plane orthogonal to normal
		// normal is assumed to have unit length

		var v1;

		return function ( normal ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			return this.sub( v1.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

		}

	}(),

	angleTo: function ( v ) {

		var theta = this.dot( v ) / ( this.length() * v.length() );

		// clamp, to handle numerical problems

		return Math.acos( THREE.Math.clamp( theta, -1, 1 ) );

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x;
		var dy = this.y - v.y;
		var dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	},

	setEulerFromRotationMatrix: function ( m, order ) {

		console.error( "REMOVED: Vector3\'s setEulerFromRotationMatrix has been removed in favor of Euler.setFromRotationMatrix(), please update your code.");

	},

	setEulerFromQuaternion: function ( q, order ) {

		console.error( "REMOVED: Vector3\'s setEulerFromQuaternion: has been removed in favor of Euler.setFromQuaternion(), please update your code.");

	},

	getPositionFromMatrix: function ( m ) {

		console.warn( "DEPRECATED: Vector3\'s .getPositionFromMatrix() has been renamed to .setFromMatrixPosition(). Please update your code." );

		return this.setFromMatrixPosition( m );

	},

	getScaleFromMatrix: function ( m ) {

		console.warn( "DEPRECATED: Vector3\'s .getScaleFromMatrix() has been renamed to .setFromMatrixScale(). Please update your code." );

		return this.setFromMatrixScale( m );
	},

	getColumnFromMatrix: function ( index, matrix ) {

		console.warn( "DEPRECATED: Vector3\'s .getColumnFromMatrix() has been renamed to .setFromMatrixColumn(). Please update your code." );

		return this.setFromMatrixColumn( index, matrix );

	},

	setFromMatrixPosition: function ( m ) {

		this.x = m.elements[ 12 ];
		this.y = m.elements[ 13 ];
		this.z = m.elements[ 14 ];

		return this;

	},

	setFromMatrixScale: function ( m ) {

		var sx = this.set( m.elements[ 0 ], m.elements[ 1 ], m.elements[  2 ] ).length();
		var sy = this.set( m.elements[ 4 ], m.elements[ 5 ], m.elements[  6 ] ).length();
		var sz = this.set( m.elements[ 8 ], m.elements[ 9 ], m.elements[ 10 ] ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;
	},

	setFromMatrixColumn: function ( index, matrix ) {

		var offset = index * 4;

		var me = matrix.elements;

		this.x = me[ offset ];
		this.y = me[ offset + 1 ];
		this.z = me[ offset + 2 ];

		return this;

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	},

	fromArray: function ( array ) {

		this.x = array[ 0 ];
		this.y = array[ 1 ];
		this.z = array[ 2 ];

		return this;

	},

	toArray: function () {

		return [ this.x, this.y, this.z ];

	},

	clone: function () {

		return new THREE.Vector3( this.x, this.y, this.z );

	}

};
/**
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author philogb / http://blog.thejit.org/
 * @author mikael emtinger / http://gomo.se/
 * @author egraether / http://egraether.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.Vector4 = function ( x, y, z, w ) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;
	this.w = ( w !== undefined ) ? w : 1;

};

THREE.Vector4.prototype = {

	constructor: THREE.Vector4,

	set: function ( x, y, z, w ) {

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setZ: function ( z ) {

		this.z = z;

		return this;

	},

	setW: function ( w ) {

		this.w = w;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			case 3: this.w = value; break;
			default: throw new Error( "index is out of range: " + index );

		}

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			case 3: return this.w;
			default: throw new Error( "index is out of range: " + index );

		}

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.w = ( v.w !== undefined ) ? v.w : 1;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector4\'s .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;
		this.w += v.w;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;
		this.z += s;
		this.w += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;
		this.w = a.w + b.w;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'DEPRECATED: Vector4\'s .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;
		this.w -= v.w;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;
		this.w = a.w - b.w;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;
		this.w *= scalar;

		return this;

	},

	applyMatrix4: function ( m ) {

		var x = this.x;
		var y = this.y;
		var z = this.z;
		var w = this.w;

		var e = m.elements;

		this.x = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
		this.y = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
		this.z = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
		this.w = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

		return this;

	},

	divideScalar: function ( scalar ) {

		if ( scalar !== 0 ) {

			var invScalar = 1 / scalar;

			this.x *= invScalar;
			this.y *= invScalar;
			this.z *= invScalar;
			this.w *= invScalar;

		} else {

			this.x = 0;
			this.y = 0;
			this.z = 0;
			this.w = 1;

		}

		return this;

	},

	setAxisAngleFromQuaternion: function ( q ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/index.htm

		// q is assumed to be normalized

		this.w = 2 * Math.acos( q.w );

		var s = Math.sqrt( 1 - q.w * q.w );

		if ( s < 0.0001 ) {

			 this.x = 1;
			 this.y = 0;
			 this.z = 0;

		} else {

			 this.x = q.x / s;
			 this.y = q.y / s;
			 this.z = q.z / s;

		}

		return this;

	},

	setAxisAngleFromRotationMatrix: function ( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToAngle/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var angle, x, y, z,		// variables for result
			epsilon = 0.01,		// margin to allow for rounding errors
			epsilon2 = 0.1,		// margin to distinguish between 0 and 180 degrees

			te = m.elements,

			m11 = te[0], m12 = te[4], m13 = te[8],
			m21 = te[1], m22 = te[5], m23 = te[9],
			m31 = te[2], m32 = te[6], m33 = te[10];

		if ( ( Math.abs( m12 - m21 ) < epsilon )
		  && ( Math.abs( m13 - m31 ) < epsilon )
		  && ( Math.abs( m23 - m32 ) < epsilon ) ) {

			// singularity found
			// first check for identity matrix which must have +1 for all terms
			// in leading diagonal and zero in other terms

			if ( ( Math.abs( m12 + m21 ) < epsilon2 )
			  && ( Math.abs( m13 + m31 ) < epsilon2 )
			  && ( Math.abs( m23 + m32 ) < epsilon2 )
			  && ( Math.abs( m11 + m22 + m33 - 3 ) < epsilon2 ) ) {

				// this singularity is identity matrix so angle = 0

				this.set( 1, 0, 0, 0 );

				return this; // zero angle, arbitrary axis

			}

			// otherwise this singularity is angle = 180

			angle = Math.PI;

			var xx = ( m11 + 1 ) / 2;
			var yy = ( m22 + 1 ) / 2;
			var zz = ( m33 + 1 ) / 2;
			var xy = ( m12 + m21 ) / 4;
			var xz = ( m13 + m31 ) / 4;
			var yz = ( m23 + m32 ) / 4;

			if ( ( xx > yy ) && ( xx > zz ) ) { // m11 is the largest diagonal term

				if ( xx < epsilon ) {

					x = 0;
					y = 0.707106781;
					z = 0.707106781;

				} else {

					x = Math.sqrt( xx );
					y = xy / x;
					z = xz / x;

				}

			} else if ( yy > zz ) { // m22 is the largest diagonal term

				if ( yy < epsilon ) {

					x = 0.707106781;
					y = 0;
					z = 0.707106781;

				} else {

					y = Math.sqrt( yy );
					x = xy / y;
					z = yz / y;

				}

			} else { // m33 is the largest diagonal term so base result on this

				if ( zz < epsilon ) {

					x = 0.707106781;
					y = 0.707106781;
					z = 0;

				} else {

					z = Math.sqrt( zz );
					x = xz / z;
					y = yz / z;

				}

			}

			this.set( x, y, z, angle );

			return this; // return 180 deg rotation

		}

		// as we have reached here there are no singularities so we can handle normally

		var s = Math.sqrt( ( m32 - m23 ) * ( m32 - m23 )
						 + ( m13 - m31 ) * ( m13 - m31 )
						 + ( m21 - m12 ) * ( m21 - m12 ) ); // used to normalize

		if ( Math.abs( s ) < 0.001 ) s = 1;

		// prevent divide by zero, should not happen if matrix is orthogonal and should be
		// caught by singularity test above, but I've left it in just in case

		this.x = ( m32 - m23 ) / s;
		this.y = ( m13 - m31 ) / s;
		this.z = ( m21 - m12 ) / s;
		this.w = Math.acos( ( m11 + m22 + m33 - 1 ) / 2 );

		return this;

	},

	min: function ( v ) {

		if ( this.x > v.x ) {

			this.x = v.x;

		}

		if ( this.y > v.y ) {

			this.y = v.y;

		}

		if ( this.z > v.z ) {

			this.z = v.z;

		}

		if ( this.w > v.w ) {

			this.w = v.w;

		}

		return this;

	},

	max: function ( v ) {

		if ( this.x < v.x ) {

			this.x = v.x;

		}

		if ( this.y < v.y ) {

			this.y = v.y;

		}

		if ( this.z < v.z ) {

			this.z = v.z;

		}

		if ( this.w < v.w ) {

			this.w = v.w;

		}

		return this;

	},

	clamp: function ( min, max ) {

		// This function assumes min < max, if this assumption isn't true it will not operate correctly

		if ( this.x < min.x ) {

			this.x = min.x;

		} else if ( this.x > max.x ) {

			this.x = max.x;

		}

		if ( this.y < min.y ) {

			this.y = min.y;

		} else if ( this.y > max.y ) {

			this.y = max.y;

		}

		if ( this.z < min.z ) {

			this.z = min.z;

		} else if ( this.z > max.z ) {

			this.z = max.z;

		}

		if ( this.w < min.w ) {

			this.w = min.w;

		} else if ( this.w > max.w ) {

			this.w = max.w;

		}

		return this;

	},

	clampScalar: ( function () {

		var min, max;

		return function ( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new THREE.Vector4();
				max = new THREE.Vector4();

			}

			min.set( minVal, minVal, minVal, minVal );
			max.set( maxVal, maxVal, maxVal, maxVal );

			return this.clamp( min, max );

		};

	} )(),

    floor: function () {

        this.x = Math.floor( this.x );
        this.y = Math.floor( this.y );
        this.z = Math.floor( this.z );
        this.w = Math.floor( this.w );

        return this;

    },

    ceil: function () {

        this.x = Math.ceil( this.x );
        this.y = Math.ceil( this.y );
        this.z = Math.ceil( this.z );
        this.w = Math.ceil( this.w );

        return this;

    },

    round: function () {

        this.x = Math.round( this.x );
        this.y = Math.round( this.y );
        this.z = Math.round( this.z );
        this.w = Math.round( this.w );

        return this;

    },

    roundToZero: function () {

        this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
        this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
        this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );
        this.w = ( this.w < 0 ) ? Math.ceil( this.w ) : Math.floor( this.w );

        return this;

    },

	negate: function () {

		return this.multiplyScalar( -1 );

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

	},

	lengthManhattan: function () {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z ) + Math.abs( this.w );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	setLength: function ( l ) {

		var oldLength = this.length();

		if ( oldLength !== 0 && l !== oldLength ) {

			this.multiplyScalar( l / oldLength );

		}

		return this;

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;
		this.w += ( v.w - this.w ) * alpha;

		return this;

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) && ( v.w === this.w ) );

	},

	fromArray: function ( array ) {

		this.x = array[ 0 ];
		this.y = array[ 1 ];
		this.z = array[ 2 ];
		this.w = array[ 3 ];

		return this;

	},

	toArray: function () {

		return [ this.x, this.y, this.z, this.w ];

	},

	clone: function () {

		return new THREE.Vector4( this.x, this.y, this.z, this.w );

	}

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

THREE.Euler = function ( x, y, z, order ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._order = order || THREE.Euler.DefaultOrder;

};

THREE.Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

THREE.Euler.DefaultOrder = 'XYZ';

THREE.Euler.prototype = {

	constructor: THREE.Euler,

	_x: 0, _y: 0, _z: 0, _order: THREE.Euler.DefaultOrder,

	get x () {

		return this._x;

	},

	set x ( value ) {

		this._x = value;
		this.onChangeCallback();

	},

	get y () {

		return this._y;

	},

	set y ( value ) {

		this._y = value;
		this.onChangeCallback();

	},

	get z () {

		return this._z;

	},

	set z ( value ) {

		this._z = value;
		this.onChangeCallback();

	},

	get order () {

		return this._order;

	},

	set order ( value ) {

		this._order = value;
		this.onChangeCallback();

	},

	set: function ( x, y, z, order ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._order = order || this._order;

		this.onChangeCallback();

		return this;

	},

	copy: function ( euler ) {

		this._x = euler._x;
		this._y = euler._y;
		this._z = euler._z;
		this._order = euler._order;

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m, order ) {

		var clamp = THREE.Math.clamp;

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements;
		var m11 = te[0], m12 = te[4], m13 = te[8];
		var m21 = te[1], m22 = te[5], m23 = te[9];
		var m31 = te[2], m32 = te[6], m33 = te[10];

		order = order || this._order;

		if ( order === 'XYZ' ) {

			this._y = Math.asin( clamp( m13, -1, 1 ) );

			if ( Math.abs( m13 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m33 );
				this._z = Math.atan2( - m12, m11 );

			} else {

				this._x = Math.atan2( m32, m22 );
				this._z = 0;

			}

		} else if ( order === 'YXZ' ) {

			this._x = Math.asin( - clamp( m23, -1, 1 ) );

			if ( Math.abs( m23 ) < 0.99999 ) {

				this._y = Math.atan2( m13, m33 );
				this._z = Math.atan2( m21, m22 );

			} else {

				this._y = Math.atan2( - m31, m11 );
				this._z = 0;

			}

		} else if ( order === 'ZXY' ) {

			this._x = Math.asin( clamp( m32, -1, 1 ) );

			if ( Math.abs( m32 ) < 0.99999 ) {

				this._y = Math.atan2( - m31, m33 );
				this._z = Math.atan2( - m12, m22 );

			} else {

				this._y = 0;
				this._z = Math.atan2( m21, m11 );

			}

		} else if ( order === 'ZYX' ) {

			this._y = Math.asin( - clamp( m31, -1, 1 ) );

			if ( Math.abs( m31 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m33 );
				this._z = Math.atan2( m21, m11 );

			} else {

				this._x = 0;
				this._z = Math.atan2( - m12, m22 );

			}

		} else if ( order === 'YZX' ) {

			this._z = Math.asin( clamp( m21, -1, 1 ) );

			if ( Math.abs( m21 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m22 );
				this._y = Math.atan2( - m31, m11 );

			} else {

				this._x = 0;
				this._y = Math.atan2( m13, m33 );

			}

		} else if ( order === 'XZY' ) {

			this._z = Math.asin( - clamp( m12, -1, 1 ) );

			if ( Math.abs( m12 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m22 );
				this._y = Math.atan2( m13, m11 );

			} else {

				this._x = Math.atan2( - m23, m33 );
				this._y = 0;

			}

		} else {

			console.warn( 'WARNING: Euler.setFromRotationMatrix() given unsupported order: ' + order )

		}

		this._order = order;

		this.onChangeCallback();

		return this;

	},

	setFromQuaternion: function ( q, order, update ) {

		var clamp = THREE.Math.clamp;

		// q is assumed to be normalized

		// http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m

		var sqx = q.x * q.x;
		var sqy = q.y * q.y;
		var sqz = q.z * q.z;
		var sqw = q.w * q.w;

		order = order || this._order;

		if ( order === 'XYZ' ) {

			this._x = Math.atan2( 2 * ( q.x * q.w - q.y * q.z ), ( sqw - sqx - sqy + sqz ) );
			this._y = Math.asin(  clamp( 2 * ( q.x * q.z + q.y * q.w ), -1, 1 ) );
			this._z = Math.atan2( 2 * ( q.z * q.w - q.x * q.y ), ( sqw + sqx - sqy - sqz ) );

		} else if ( order ===  'YXZ' ) {

			this._x = Math.asin(  clamp( 2 * ( q.x * q.w - q.y * q.z ), -1, 1 ) );
			this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.w ), ( sqw - sqx - sqy + sqz ) );
			this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqw - sqx + sqy - sqz ) );

		} else if ( order === 'ZXY' ) {

			this._x = Math.asin(  clamp( 2 * ( q.x * q.w + q.y * q.z ), -1, 1 ) );
			this._y = Math.atan2( 2 * ( q.y * q.w - q.z * q.x ), ( sqw - sqx - sqy + sqz ) );
			this._z = Math.atan2( 2 * ( q.z * q.w - q.x * q.y ), ( sqw - sqx + sqy - sqz ) );

		} else if ( order === 'ZYX' ) {

			this._x = Math.atan2( 2 * ( q.x * q.w + q.z * q.y ), ( sqw - sqx - sqy + sqz ) );
			this._y = Math.asin(  clamp( 2 * ( q.y * q.w - q.x * q.z ), -1, 1 ) );
			this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.w ), ( sqw + sqx - sqy - sqz ) );

		} else if ( order === 'YZX' ) {

			this._x = Math.atan2( 2 * ( q.x * q.w - q.z * q.y ), ( sqw - sqx + sqy - sqz ) );
			this._y = Math.atan2( 2 * ( q.y * q.w - q.x * q.z ), ( sqw + sqx - sqy - sqz ) );
			this._z = Math.asin(  clamp( 2 * ( q.x * q.y + q.z * q.w ), -1, 1 ) );

		} else if ( order === 'XZY' ) {

			this._x = Math.atan2( 2 * ( q.x * q.w + q.y * q.z ), ( sqw - sqx + sqy - sqz ) );
			this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.w ), ( sqw + sqx - sqy - sqz ) );
			this._z = Math.asin(  clamp( 2 * ( q.z * q.w - q.x * q.y ), -1, 1 ) );

		} else {

			console.warn( 'WARNING: Euler.setFromQuaternion() given unsupported order: ' + order )

		}

		this._order = order;

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	reorder: function () {

		// WARNING: this discards revolution information -bhouston

		var q = new THREE.Quaternion();

		return function ( newOrder ) {

			q.setFromEuler( this );
			this.setFromQuaternion( q, newOrder );

		};


	}(),

	equals: function ( euler ) {

		return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

	},

	fromArray: function ( array ) {

		this._x = array[ 0 ];
		this._y = array[ 1 ];
		this._z = array[ 2 ];
		if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function () {

		return [ this._x, this._y, this._z, this._order ];

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {},

	clone: function () {

		return new THREE.Euler( this._x, this._y, this._z, this._order );

	}

};

/**
 * @author bhouston / http://exocortex.com
 */

THREE.Line3 = function ( start, end ) {

	this.start = ( start !== undefined ) ? start : new THREE.Vector3();
	this.end = ( end !== undefined ) ? end : new THREE.Vector3();

};

THREE.Line3.prototype = {

	constructor: THREE.Line3,

	set: function ( start, end ) {

		this.start.copy( start );
		this.end.copy( end );

		return this;

	},

	copy: function ( line ) {

		this.start.copy( line.start );
		this.end.copy( line.end );

		return this;

	},

	center: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.addVectors( this.start, this.end ).multiplyScalar( 0.5 );

	},

	delta: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.subVectors( this.end, this.start );

	},

	distanceSq: function () {

		return this.start.distanceToSquared( this.end );

	},

	distance: function () {

		return this.start.distanceTo( this.end );

	},

	at: function ( t, optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();

		return this.delta( result ).multiplyScalar( t ).add( this.start );

	},

	closestPointToPointParameter: function() {

		var startP = new THREE.Vector3();
		var startEnd = new THREE.Vector3();

		return function ( point, clampToLine ) {

			startP.subVectors( point, this.start );
			startEnd.subVectors( this.end, this.start );

			var startEnd2 = startEnd.dot( startEnd );
			var startEnd_startP = startEnd.dot( startP );

			var t = startEnd_startP / startEnd2;

			if ( clampToLine ) {

				t = THREE.Math.clamp( t, 0, 1 );

			}

			return t;

		};

	}(),

	closestPointToPoint: function ( point, clampToLine, optionalTarget ) {

		var t = this.closestPointToPointParameter( point, clampToLine );

		var result = optionalTarget || new THREE.Vector3();

		return this.delta( result ).multiplyScalar( t ).add( this.start );

	},

	applyMatrix4: function ( matrix ) {

		this.start.applyMatrix4( matrix );
		this.end.applyMatrix4( matrix );

		return this;

	},

	equals: function ( line ) {

		return line.start.equals( this.start ) && line.end.equals( this.end );

	},

	clone: function () {

		return new THREE.Line3().copy( this );

	}

};

/**
 * @author bhouston / http://exocortex.com
 */

THREE.Box2 = function ( min, max ) {

	this.min = ( min !== undefined ) ? min : new THREE.Vector2( Infinity, Infinity );
	this.max = ( max !== undefined ) ? max : new THREE.Vector2( -Infinity, -Infinity );

};

THREE.Box2.prototype = {

	constructor: THREE.Box2,

	set: function ( min, max ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	},

	setFromPoints: function ( points ) {

		if ( points.length > 0 ) {

			var point = points[ 0 ];

			this.min.copy( point );
			this.max.copy( point );

			for ( var i = 1, il = points.length; i < il; i ++ ) {

				point = points[ i ];

				if ( point.x < this.min.x ) {

					this.min.x = point.x;

				} else if ( point.x > this.max.x ) {

					this.max.x = point.x;

				}

				if ( point.y < this.min.y ) {

					this.min.y = point.y;

				} else if ( point.y > this.max.y ) {

					this.max.y = point.y;

				}

			}

		} else {

			this.makeEmpty();

		}

		return this;

	},

	setFromCenterAndSize: function () {

		var v1 = new THREE.Vector2();

		return function ( center, size ) {

			var halfSize = v1.copy( size ).multiplyScalar( 0.5 );
			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		};

	}(),

	copy: function ( box ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	},

	makeEmpty: function () {

		this.min.x = this.min.y = Infinity;
		this.max.x = this.max.y = -Infinity;

		return this;

	},

	empty: function () {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y );

	},

	center: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector2();
		return result.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	},

	size: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector2();
		return result.subVectors( this.max, this.min );

	},

	expandByPoint: function ( point ) {

		this.min.min( point );
		this.max.max( point );

		return this;
	},

	expandByVector: function ( vector ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;
	},

	expandByScalar: function ( scalar ) {

		this.min.addScalar( -scalar );
		this.max.addScalar( scalar );

		return this;
	},

	containsPoint: function ( point ) {

		if ( point.x < this.min.x || point.x > this.max.x ||
		     point.y < this.min.y || point.y > this.max.y ) {

			return false;

		}

		return true;

	},

	containsBox: function ( box ) {

		if ( ( this.min.x <= box.min.x ) && ( box.max.x <= this.max.x ) &&
		     ( this.min.y <= box.min.y ) && ( box.max.y <= this.max.y ) ) {

			return true;

		}

		return false;

	},

	getParameter: function ( point, optionalTarget ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		var result = optionalTarget || new THREE.Vector2();

		return result.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y )
		);

	},

	isIntersectionBox: function ( box ) {

		// using 6 splitting planes to rule out intersections.

		if ( box.max.x < this.min.x || box.min.x > this.max.x ||
		     box.max.y < this.min.y || box.min.y > this.max.y ) {

			return false;

		}

		return true;

	},

	clampPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new THREE.Vector2();
		return result.copy( point ).clamp( this.min, this.max );

	},

	distanceToPoint: function () {

		var v1 = new THREE.Vector2();

		return function ( point ) {

			var clampedPoint = v1.copy( point ).clamp( this.min, this.max );
			return clampedPoint.sub( point ).length();

		};

	}(),

	intersect: function ( box ) {

		this.min.max( box.min );
		this.max.min( box.max );

		return this;

	},

	union: function ( box ) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	},

	translate: function ( offset ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	},

	equals: function ( box ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	},

	clone: function () {

		return new THREE.Box2().copy( this );

	}

};

/**
 * @author bhouston / http://exocortex.com
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.Box3 = function ( min, max ) {

	this.min = ( min !== undefined ) ? min : new THREE.Vector3( Infinity, Infinity, Infinity );
	this.max = ( max !== undefined ) ? max : new THREE.Vector3( -Infinity, -Infinity, -Infinity );

};

THREE.Box3.prototype = {

	constructor: THREE.Box3,

	set: function ( min, max ) {

		this.min.copy( min );
		this.max.copy( max );

		return this;

	},

	addPoint: function ( point ) {

		if ( point.x < this.min.x ) {

			this.min.x = point.x;

		} else if ( point.x > this.max.x ) {

			this.max.x = point.x;

		}

		if ( point.y < this.min.y ) {

			this.min.y = point.y;

		} else if ( point.y > this.max.y ) {

			this.max.y = point.y;

		}

		if ( point.z < this.min.z ) {

			this.min.z = point.z;

		} else if ( point.z > this.max.z ) {

			this.max.z = point.z;

		}
		
		return this;

	},

	setFromPoints: function ( points ) {

		if ( points.length > 0 ) {

			var point = points[ 0 ];

			this.min.copy( point );
			this.max.copy( point );

			for ( var i = 1, il = points.length; i < il; i ++ ) {

				this.addPoint( points[ i ] )

			}

		} else {

			this.makeEmpty();

		}

		return this;

	},

	setFromCenterAndSize: function() {

		var v1 = new THREE.Vector3();

		return function ( center, size ) {

			var halfSize = v1.copy( size ).multiplyScalar( 0.5 );

			this.min.copy( center ).sub( halfSize );
			this.max.copy( center ).add( halfSize );

			return this;

		};

	}(),

	setFromObject: function() {

		// Computes the world-axis-aligned bounding box of an object (including its children),
		// accounting for both the object's, and childrens', world transforms

		var v1 = new THREE.Vector3();

		return function( object ) {

			var scope = this;

			object.updateMatrixWorld( true );

			this.makeEmpty();

			object.traverse( function ( node ) {

				if ( node.geometry !== undefined && node.geometry.vertices !== undefined ) {

					var vertices = node.geometry.vertices;

					for ( var i = 0, il = vertices.length; i < il; i++ ) {

						v1.copy( vertices[ i ] );

						v1.applyMatrix4( node.matrixWorld );

						scope.expandByPoint( v1 );

					}

				}

			} );

			return this;

		};

	}(),

	copy: function ( box ) {

		this.min.copy( box.min );
		this.max.copy( box.max );

		return this;

	},

	makeEmpty: function () {

		this.min.x = this.min.y = this.min.z = Infinity;
		this.max.x = this.max.y = this.max.z = -Infinity;

		return this;

	},

	empty: function () {

		// this is a more robust check for empty than ( volume <= 0 ) because volume can get positive with two negative axes

		return ( this.max.x < this.min.x ) || ( this.max.y < this.min.y ) || ( this.max.z < this.min.z );

	},

	center: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.addVectors( this.min, this.max ).multiplyScalar( 0.5 );

	},

	size: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.subVectors( this.max, this.min );

	},

	expandByPoint: function ( point ) {

		this.min.min( point );
		this.max.max( point );

		return this;

	},

	expandByVector: function ( vector ) {

		this.min.sub( vector );
		this.max.add( vector );

		return this;

	},

	expandByScalar: function ( scalar ) {

		this.min.addScalar( -scalar );
		this.max.addScalar( scalar );

		return this;

	},

	containsPoint: function ( point ) {

		if ( point.x < this.min.x || point.x > this.max.x ||
		     point.y < this.min.y || point.y > this.max.y ||
		     point.z < this.min.z || point.z > this.max.z ) {

			return false;

		}

		return true;

	},

	containsBox: function ( box ) {

		if ( ( this.min.x <= box.min.x ) && ( box.max.x <= this.max.x ) &&
			 ( this.min.y <= box.min.y ) && ( box.max.y <= this.max.y ) &&
			 ( this.min.z <= box.min.z ) && ( box.max.z <= this.max.z ) ) {

			return true;

		}

		return false;

	},

	getParameter: function ( point, optionalTarget ) {

		// This can potentially have a divide by zero if the box
		// has a size dimension of 0.

		var result = optionalTarget || new THREE.Vector3();

		return result.set(
			( point.x - this.min.x ) / ( this.max.x - this.min.x ),
			( point.y - this.min.y ) / ( this.max.y - this.min.y ),
			( point.z - this.min.z ) / ( this.max.z - this.min.z )
		);

	},

	isIntersectionBox: function ( box ) {

		// using 6 splitting planes to rule out intersections.

		if ( box.max.x < this.min.x || box.min.x > this.max.x ||
		     box.max.y < this.min.y || box.min.y > this.max.y ||
		     box.max.z < this.min.z || box.min.z > this.max.z ) {

			return false;

		}

		return true;

	},

	clampPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.copy( point ).clamp( this.min, this.max );

	},

	distanceToPoint: function() {

		var v1 = new THREE.Vector3();

		return function ( point ) {

			var clampedPoint = v1.copy( point ).clamp( this.min, this.max );
			return clampedPoint.sub( point ).length();

		};

	}(),

	getBoundingSphere: function() {

		var v1 = new THREE.Vector3();

		return function ( optionalTarget ) {

			var result = optionalTarget || new THREE.Sphere();

			result.center = this.center();
			result.radius = this.size( v1 ).length() * 0.5;

			return result;

		};

	}(),

	intersect: function ( box ) {

		this.min.max( box.min );
		this.max.min( box.max );

		return this;

	},

	union: function ( box ) {

		this.min.min( box.min );
		this.max.max( box.max );

		return this;

	},

	applyMatrix4: function() {

		var points = [
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3(),
			new THREE.Vector3()
		];

		return function ( matrix ) {

			// NOTE: I am using a binary pattern to specify all 2^3 combinations below
			points[0].set( this.min.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 000
			points[1].set( this.min.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 001
			points[2].set( this.min.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 010
			points[3].set( this.min.x, this.max.y, this.max.z ).applyMatrix4( matrix ); // 011
			points[4].set( this.max.x, this.min.y, this.min.z ).applyMatrix4( matrix ); // 100
			points[5].set( this.max.x, this.min.y, this.max.z ).applyMatrix4( matrix ); // 101
			points[6].set( this.max.x, this.max.y, this.min.z ).applyMatrix4( matrix ); // 110
			points[7].set( this.max.x, this.max.y, this.max.z ).applyMatrix4( matrix );  // 111

			this.makeEmpty();
			this.setFromPoints( points );

			return this;

		};

	}(),

	translate: function ( offset ) {

		this.min.add( offset );
		this.max.add( offset );

		return this;

	},

	equals: function ( box ) {

		return box.min.equals( this.min ) && box.max.equals( this.max );

	},

	clone: function () {

		return new THREE.Box3().copy( this );

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

THREE.Matrix3 = function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

	this.elements = new Float32Array( 9 );

	var te = this.elements;

	te[0] = ( n11 !== undefined ) ? n11 : 1; te[3] = n12 || 0; te[6] = n13 || 0;
	te[1] = n21 || 0; te[4] = ( n22 !== undefined ) ? n22 : 1; te[7] = n23 || 0;
	te[2] = n31 || 0; te[5] = n32 || 0; te[8] = ( n33 !== undefined ) ? n33 : 1;

};

THREE.Matrix3.prototype = {

	constructor: THREE.Matrix3,

	set: function ( n11, n12, n13, n21, n22, n23, n31, n32, n33 ) {

		var te = this.elements;

		te[0] = n11; te[3] = n12; te[6] = n13;
		te[1] = n21; te[4] = n22; te[7] = n23;
		te[2] = n31; te[5] = n32; te[8] = n33;

		return this;

	},

	identity: function () {

		this.set(

			1, 0, 0,
			0, 1, 0,
			0, 0, 1

		);

		return this;

	},

	copy: function ( m ) {

		var me = m.elements;

		this.set(

			me[0], me[3], me[6],
			me[1], me[4], me[7],
			me[2], me[5], me[8]

		);

		return this;

	},

	multiplyVector3: function ( vector ) {

		console.warn( 'DEPRECATED: Matrix3\'s .multiplyVector3() has been removed. Use vector.applyMatrix3( matrix ) instead.' );
		return vector.applyMatrix3( this );

	},

	multiplyVector3Array: function ( a ) {

		console.warn( 'DEPRECATED: Matrix3\'s .multiplyVector3Array() has been renamed. Use matrix.applyToVector3Array( array ) instead.' );
		return this.applyToVector3Array( a );

	},

	applyToVector3Array: function() {

		var v1 = new THREE.Vector3();

		return function ( array, offset, length ) {

			if ( offset === undefined ) offset = 0;
			if ( length === undefined ) length = array.length;

			for ( var i = 0, j = offset, il; i < length; i += 3, j += 3 ) {

				v1.x = array[ j ];
				v1.y = array[ j + 1 ];
				v1.z = array[ j + 2 ];

				v1.applyMatrix3( this );

				array[ j ]     = v1.x;
				array[ j + 1 ] = v1.y;
				array[ j + 2 ] = v1.z;

			}

			return array;

		};

	}(),

	multiplyScalar: function ( s ) {

		var te = this.elements;

		te[0] *= s; te[3] *= s; te[6] *= s;
		te[1] *= s; te[4] *= s; te[7] *= s;
		te[2] *= s; te[5] *= s; te[8] *= s;

		return this;

	},

	determinant: function () {

		var te = this.elements;

		var a = te[0], b = te[1], c = te[2],
			d = te[3], e = te[4], f = te[5],
			g = te[6], h = te[7], i = te[8];

		return a*e*i - a*f*h - b*d*i + b*f*g + c*d*h - c*e*g;

	},

	getInverse: function ( matrix, throwOnInvertible ) {

		// input: THREE.Matrix4
		// ( based on http://code.google.com/p/webgl-mjs/ )

		var me = matrix.elements;
		var te = this.elements;

		te[ 0 ] =   me[10] * me[5] - me[6] * me[9];
		te[ 1 ] = - me[10] * me[1] + me[2] * me[9];
		te[ 2 ] =   me[6] * me[1] - me[2] * me[5];
		te[ 3 ] = - me[10] * me[4] + me[6] * me[8];
		te[ 4 ] =   me[10] * me[0] - me[2] * me[8];
		te[ 5 ] = - me[6] * me[0] + me[2] * me[4];
		te[ 6 ] =   me[9] * me[4] - me[5] * me[8];
		te[ 7 ] = - me[9] * me[0] + me[1] * me[8];
		te[ 8 ] =   me[5] * me[0] - me[1] * me[4];

		var det = me[ 0 ] * te[ 0 ] + me[ 1 ] * te[ 3 ] + me[ 2 ] * te[ 6 ];

		// no inverse

		if ( det === 0 ) {

			var msg = "Matrix3.getInverse(): can't invert matrix, determinant is 0";

			if ( throwOnInvertible || false ) {

				throw new Error( msg );

			} else {

				console.warn( msg );

			}

			this.identity();

			return this;

		}

		this.multiplyScalar( 1.0 / det );

		return this;

	},

	transpose: function () {

		var tmp, m = this.elements;

		tmp = m[1]; m[1] = m[3]; m[3] = tmp;
		tmp = m[2]; m[2] = m[6]; m[6] = tmp;
		tmp = m[5]; m[5] = m[7]; m[7] = tmp;

		return this;

	},

	flattenToArrayOffset: function( array, offset ) {

		var te = this.elements;

		array[ offset     ] = te[0];
		array[ offset + 1 ] = te[1];
		array[ offset + 2 ] = te[2];
		
		array[ offset + 3 ] = te[3];
		array[ offset + 4 ] = te[4];
		array[ offset + 5 ] = te[5];
		
		array[ offset + 6 ] = te[6];
		array[ offset + 7 ] = te[7];
		array[ offset + 8 ]  = te[8];

		return array;

	},

	getNormalMatrix: function ( m ) {

		// input: THREE.Matrix4

		this.getInverse( m ).transpose();

		return this;

	},

	transposeIntoArray: function ( r ) {

		var m = this.elements;

		r[ 0 ] = m[ 0 ];
		r[ 1 ] = m[ 3 ];
		r[ 2 ] = m[ 6 ];
		r[ 3 ] = m[ 1 ];
		r[ 4 ] = m[ 4 ];
		r[ 5 ] = m[ 7 ];
		r[ 6 ] = m[ 2 ];
		r[ 7 ] = m[ 5 ];
		r[ 8 ] = m[ 8 ];

		return this;

	},

	fromArray: function ( array ) {

		this.elements.set( array );

		return this;

	},

	toArray: function () {

		var te = this.elements;

		return [
			te[ 0 ], te[ 1 ], te[ 2 ],
			te[ 3 ], te[ 4 ], te[ 5 ],
			te[ 6 ], te[ 7 ], te[ 8 ]
		];

	},

	clone: function () {

		var te = this.elements;

		return new THREE.Matrix3(

			te[0], te[3], te[6],
			te[1], te[4], te[7],
			te[2], te[5], te[8]

		);

	}

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author supereggbert / http://www.paulbrunt.co.uk/
 * @author philogb / http://blog.thejit.org/
 * @author jordi_ros / http://plattsoft.com
 * @author D1plo1d / http://github.com/D1plo1d
 * @author alteredq / http://alteredqualia.com/
 * @author mikael emtinger / http://gomo.se/
 * @author timknip / http://www.floorplanner.com/
 * @author bhouston / http://exocortex.com
 * @author WestLangley / http://github.com/WestLangley
 */


THREE.Matrix4 = function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

	this.elements = new Float32Array( 16 );

	// TODO: if n11 is undefined, then just set to identity, otherwise copy all other values into matrix
	//   we should not support semi specification of Matrix4, it is just weird.

	var te = this.elements;

	te[0] = ( n11 !== undefined ) ? n11 : 1; te[4] = n12 || 0; te[8] = n13 || 0; te[12] = n14 || 0;
	te[1] = n21 || 0; te[5] = ( n22 !== undefined ) ? n22 : 1; te[9] = n23 || 0; te[13] = n24 || 0;
	te[2] = n31 || 0; te[6] = n32 || 0; te[10] = ( n33 !== undefined ) ? n33 : 1; te[14] = n34 || 0;
	te[3] = n41 || 0; te[7] = n42 || 0; te[11] = n43 || 0; te[15] = ( n44 !== undefined ) ? n44 : 1;

};

THREE.Matrix4.prototype = {

	constructor: THREE.Matrix4,

	set: function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

		var te = this.elements;

		te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
		te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
		te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
		te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

		return this;

	},

	identity: function () {

		this.set(

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		);

		return this;

	},

	copy: function ( m ) {

		this.elements.set( m.elements );

		return this;

	},

	extractPosition: function ( m ) {

		console.warn( 'DEPRECATED: Matrix4\'s .extractPosition() has been renamed to .copyPosition().' );
		return this.copyPosition( m );

	},

	copyPosition: function ( m ) {

		var te = this.elements;
		var me = m.elements;

		te[12] = me[12];
		te[13] = me[13];
		te[14] = me[14];

		return this;

	},

	extractRotation: function () {

		var v1 = new THREE.Vector3();

		return function ( m ) {

			var te = this.elements;
			var me = m.elements;

			var scaleX = 1 / v1.set( me[0], me[1], me[2] ).length();
			var scaleY = 1 / v1.set( me[4], me[5], me[6] ).length();
			var scaleZ = 1 / v1.set( me[8], me[9], me[10] ).length();

			te[0] = me[0] * scaleX;
			te[1] = me[1] * scaleX;
			te[2] = me[2] * scaleX;

			te[4] = me[4] * scaleY;
			te[5] = me[5] * scaleY;
			te[6] = me[6] * scaleY;

			te[8] = me[8] * scaleZ;
			te[9] = me[9] * scaleZ;
			te[10] = me[10] * scaleZ;

			return this;

		};

	}(),

	makeRotationFromEuler: function ( euler ) {

		if ( euler instanceof THREE.Euler === false ) {

			console.error( 'ERROR: Matrix\'s .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.  Please update your code.' );

		}

		var te = this.elements;

		var x = euler.x, y = euler.y, z = euler.z;
		var a = Math.cos( x ), b = Math.sin( x );
		var c = Math.cos( y ), d = Math.sin( y );
		var e = Math.cos( z ), f = Math.sin( z );

		if ( euler.order === 'XYZ' ) {

			var ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[0] = c * e;
			te[4] = - c * f;
			te[8] = d;

			te[1] = af + be * d;
			te[5] = ae - bf * d;
			te[9] = - b * c;

			te[2] = bf - ae * d;
			te[6] = be + af * d;
			te[10] = a * c;

		} else if ( euler.order === 'YXZ' ) {

			var ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[0] = ce + df * b;
			te[4] = de * b - cf;
			te[8] = a * d;

			te[1] = a * f;
			te[5] = a * e;
			te[9] = - b;

			te[2] = cf * b - de;
			te[6] = df + ce * b;
			te[10] = a * c;

		} else if ( euler.order === 'ZXY' ) {

			var ce = c * e, cf = c * f, de = d * e, df = d * f;

			te[0] = ce - df * b;
			te[4] = - a * f;
			te[8] = de + cf * b;

			te[1] = cf + de * b;
			te[5] = a * e;
			te[9] = df - ce * b;

			te[2] = - a * d;
			te[6] = b;
			te[10] = a * c;

		} else if ( euler.order === 'ZYX' ) {

			var ae = a * e, af = a * f, be = b * e, bf = b * f;

			te[0] = c * e;
			te[4] = be * d - af;
			te[8] = ae * d + bf;

			te[1] = c * f;
			te[5] = bf * d + ae;
			te[9] = af * d - be;

			te[2] = - d;
			te[6] = b * c;
			te[10] = a * c;

		} else if ( euler.order === 'YZX' ) {

			var ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[0] = c * e;
			te[4] = bd - ac * f;
			te[8] = bc * f + ad;

			te[1] = f;
			te[5] = a * e;
			te[9] = - b * e;

			te[2] = - d * e;
			te[6] = ad * f + bc;
			te[10] = ac - bd * f;

		} else if ( euler.order === 'XZY' ) {

			var ac = a * c, ad = a * d, bc = b * c, bd = b * d;

			te[0] = c * e;
			te[4] = - f;
			te[8] = d * e;

			te[1] = ac * f + bd;
			te[5] = a * e;
			te[9] = ad * f - bc;

			te[2] = bc * f - ad;
			te[6] = b * e;
			te[10] = bd * f + ac;

		}

		// last column
		te[3] = 0;
		te[7] = 0;
		te[11] = 0;

		// bottom row
		te[12] = 0;
		te[13] = 0;
		te[14] = 0;
		te[15] = 1;

		return this;

	},

	setRotationFromQuaternion: function ( q ) {

		console.warn( 'DEPRECATED: Matrix4\'s .setRotationFromQuaternion() has been deprecated in favor of makeRotationFromQuaternion.  Please update your code.' );

		return this.makeRotationFromQuaternion( q );

	},

	makeRotationFromQuaternion: function ( q ) {

		var te = this.elements;

		var x = q.x, y = q.y, z = q.z, w = q.w;
		var x2 = x + x, y2 = y + y, z2 = z + z;
		var xx = x * x2, xy = x * y2, xz = x * z2;
		var yy = y * y2, yz = y * z2, zz = z * z2;
		var wx = w * x2, wy = w * y2, wz = w * z2;

		te[0] = 1 - ( yy + zz );
		te[4] = xy - wz;
		te[8] = xz + wy;

		te[1] = xy + wz;
		te[5] = 1 - ( xx + zz );
		te[9] = yz - wx;

		te[2] = xz - wy;
		te[6] = yz + wx;
		te[10] = 1 - ( xx + yy );

		// last column
		te[3] = 0;
		te[7] = 0;
		te[11] = 0;

		// bottom row
		te[12] = 0;
		te[13] = 0;
		te[14] = 0;
		te[15] = 1;

		return this;

	},

	lookAt: function() {

		var x = new THREE.Vector3();
		var y = new THREE.Vector3();
		var z = new THREE.Vector3();

		return function ( eye, target, up ) {

			var te = this.elements;

			z.subVectors( eye, target ).normalize();

			if ( z.length() === 0 ) {

				z.z = 1;

			}

			x.crossVectors( up, z ).normalize();

			if ( x.length() === 0 ) {

				z.x += 0.0001;
				x.crossVectors( up, z ).normalize();

			}

			y.crossVectors( z, x );


			te[0] = x.x; te[4] = y.x; te[8] = z.x;
			te[1] = x.y; te[5] = y.y; te[9] = z.y;
			te[2] = x.z; te[6] = y.z; te[10] = z.z;

			return this;

		};

	}(),

	multiply: function ( m, n ) {

		if ( n !== undefined ) {

			console.warn( 'DEPRECATED: Matrix4\'s .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.' );
			return this.multiplyMatrices( m, n );

		}

		return this.multiplyMatrices( this, m );

	},

	multiplyMatrices: function ( a, b ) {

		var ae = a.elements;
		var be = b.elements;
		var te = this.elements;

		var a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
		var a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
		var a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
		var a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

		var b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
		var b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
		var b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
		var b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

		te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
		te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
		te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
		te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

		te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
		te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
		te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
		te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

		te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
		te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
		te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
		te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

		te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
		te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
		te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
		te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

		return this;

	},

	multiplyToArray: function ( a, b, r ) {

		var te = this.elements;

		this.multiplyMatrices( a, b );

		r[ 0 ] = te[0]; r[ 1 ] = te[1]; r[ 2 ] = te[2]; r[ 3 ] = te[3];
		r[ 4 ] = te[4]; r[ 5 ] = te[5]; r[ 6 ] = te[6]; r[ 7 ] = te[7];
		r[ 8 ]  = te[8]; r[ 9 ]  = te[9]; r[ 10 ] = te[10]; r[ 11 ] = te[11];
		r[ 12 ] = te[12]; r[ 13 ] = te[13]; r[ 14 ] = te[14]; r[ 15 ] = te[15];

		return this;

	},

	multiplyScalar: function ( s ) {

		var te = this.elements;

		te[0] *= s; te[4] *= s; te[8] *= s; te[12] *= s;
		te[1] *= s; te[5] *= s; te[9] *= s; te[13] *= s;
		te[2] *= s; te[6] *= s; te[10] *= s; te[14] *= s;
		te[3] *= s; te[7] *= s; te[11] *= s; te[15] *= s;

		return this;

	},

	multiplyVector3: function ( vector ) {

		console.warn( 'DEPRECATED: Matrix4\'s .multiplyVector3() has been removed. Use vector.applyMatrix4( matrix ) or vector.applyProjection( matrix ) instead.' );
		return vector.applyProjection( this );

	},

	multiplyVector4: function ( vector ) {

		console.warn( 'DEPRECATED: Matrix4\'s .multiplyVector4() has been removed. Use vector.applyMatrix4( matrix ) instead.' );
		return vector.applyMatrix4( this );

	},

	multiplyVector3Array: function ( a ) {

		console.warn( 'DEPRECATED: Matrix4\'s .multiplyVector3Array() has been renamed. Use matrix.applyToVector3Array( array ) instead.' );
		return this.applyToVector3Array( a );

	},

	applyToVector3Array: function() {

		var v1 = new THREE.Vector3();

		return function ( array, offset, length ) {

			if ( offset === undefined ) offset = 0;
			if ( length === undefined ) length = array.length;

			for ( var i = 0, j = offset, il; i < length; i += 3, j += 3 ) {

				v1.x = array[ j ];
				v1.y = array[ j + 1 ];
				v1.z = array[ j + 2 ];

				v1.applyMatrix4( this );

				array[ j ]     = v1.x;
				array[ j + 1 ] = v1.y;
				array[ j + 2 ] = v1.z;

			}

			return array;

		};

	}(),

	rotateAxis: function ( v ) {

		console.warn( 'DEPRECATED: Matrix4\'s .rotateAxis() has been removed. Use Vector3.transformDirection( matrix ) instead.' );

		v.transformDirection( this );

	},

	crossVector: function ( vector ) {

		console.warn( 'DEPRECATED: Matrix4\'s .crossVector() has been removed. Use vector.applyMatrix4( matrix ) instead.' );
		return vector.applyMatrix4( this );

	},

	determinant: function () {

		var te = this.elements;

		var n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
		var n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
		var n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
		var n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

		//TODO: make this more efficient
		//( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

		return (
			n41 * (
				+n14 * n23 * n32
				-n13 * n24 * n32
				-n14 * n22 * n33
				+n12 * n24 * n33
				+n13 * n22 * n34
				-n12 * n23 * n34
			) +
			n42 * (
				+n11 * n23 * n34
				-n11 * n24 * n33
				+n14 * n21 * n33
				-n13 * n21 * n34
				+n13 * n24 * n31
				-n14 * n23 * n31
			) +
			n43 * (
				+n11 * n24 * n32
				-n11 * n22 * n34
				-n14 * n21 * n32
				+n12 * n21 * n34
				+n14 * n22 * n31
				-n12 * n24 * n31
			) +
			n44 * (
				-n13 * n22 * n31
				-n11 * n23 * n32
				+n11 * n22 * n33
				+n13 * n21 * n32
				-n12 * n21 * n33
				+n12 * n23 * n31
			)

		);

	},

	transpose: function () {

		var te = this.elements;
		var tmp;

		tmp = te[1]; te[1] = te[4]; te[4] = tmp;
		tmp = te[2]; te[2] = te[8]; te[8] = tmp;
		tmp = te[6]; te[6] = te[9]; te[9] = tmp;

		tmp = te[3]; te[3] = te[12]; te[12] = tmp;
		tmp = te[7]; te[7] = te[13]; te[13] = tmp;
		tmp = te[11]; te[11] = te[14]; te[14] = tmp;

		return this;

	},

	flattenToArrayOffset: function( array, offset ) {

		var te = this.elements;

		array[ offset     ] = te[0];
		array[ offset + 1 ] = te[1];
		array[ offset + 2 ] = te[2];
		array[ offset + 3 ] = te[3];

		array[ offset + 4 ] = te[4];
		array[ offset + 5 ] = te[5];
		array[ offset + 6 ] = te[6];
		array[ offset + 7 ] = te[7];

		array[ offset + 8 ]  = te[8];
		array[ offset + 9 ]  = te[9];
		array[ offset + 10 ] = te[10];
		array[ offset + 11 ] = te[11];

		array[ offset + 12 ] = te[12];
		array[ offset + 13 ] = te[13];
		array[ offset + 14 ] = te[14];
		array[ offset + 15 ] = te[15];

		return array;

	},

	getPosition: function() {

		var v1 = new THREE.Vector3();

		return function () {

			console.warn( 'DEPRECATED: Matrix4\'s .getPosition() has been removed. Use Vector3.setFromMatrixPosition( matrix ) instead.' );

			var te = this.elements;
			return v1.set( te[12], te[13], te[14] );

		};

	}(),

	setPosition: function ( v ) {

		var te = this.elements;

		te[12] = v.x;
		te[13] = v.y;
		te[14] = v.z;

		return this;

	},

	getInverse: function ( m, throwOnInvertible ) {

		// based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
		var te = this.elements;
		var me = m.elements;

		var n11 = me[0], n12 = me[4], n13 = me[8], n14 = me[12];
		var n21 = me[1], n22 = me[5], n23 = me[9], n24 = me[13];
		var n31 = me[2], n32 = me[6], n33 = me[10], n34 = me[14];
		var n41 = me[3], n42 = me[7], n43 = me[11], n44 = me[15];

		te[0] = n23*n34*n42 - n24*n33*n42 + n24*n32*n43 - n22*n34*n43 - n23*n32*n44 + n22*n33*n44;
		te[4] = n14*n33*n42 - n13*n34*n42 - n14*n32*n43 + n12*n34*n43 + n13*n32*n44 - n12*n33*n44;
		te[8] = n13*n24*n42 - n14*n23*n42 + n14*n22*n43 - n12*n24*n43 - n13*n22*n44 + n12*n23*n44;
		te[12] = n14*n23*n32 - n13*n24*n32 - n14*n22*n33 + n12*n24*n33 + n13*n22*n34 - n12*n23*n34;
		te[1] = n24*n33*n41 - n23*n34*n41 - n24*n31*n43 + n21*n34*n43 + n23*n31*n44 - n21*n33*n44;
		te[5] = n13*n34*n41 - n14*n33*n41 + n14*n31*n43 - n11*n34*n43 - n13*n31*n44 + n11*n33*n44;
		te[9] = n14*n23*n41 - n13*n24*n41 - n14*n21*n43 + n11*n24*n43 + n13*n21*n44 - n11*n23*n44;
		te[13] = n13*n24*n31 - n14*n23*n31 + n14*n21*n33 - n11*n24*n33 - n13*n21*n34 + n11*n23*n34;
		te[2] = n22*n34*n41 - n24*n32*n41 + n24*n31*n42 - n21*n34*n42 - n22*n31*n44 + n21*n32*n44;
		te[6] = n14*n32*n41 - n12*n34*n41 - n14*n31*n42 + n11*n34*n42 + n12*n31*n44 - n11*n32*n44;
		te[10] = n12*n24*n41 - n14*n22*n41 + n14*n21*n42 - n11*n24*n42 - n12*n21*n44 + n11*n22*n44;
		te[14] = n14*n22*n31 - n12*n24*n31 - n14*n21*n32 + n11*n24*n32 + n12*n21*n34 - n11*n22*n34;
		te[3] = n23*n32*n41 - n22*n33*n41 - n23*n31*n42 + n21*n33*n42 + n22*n31*n43 - n21*n32*n43;
		te[7] = n12*n33*n41 - n13*n32*n41 + n13*n31*n42 - n11*n33*n42 - n12*n31*n43 + n11*n32*n43;
		te[11] = n13*n22*n41 - n12*n23*n41 - n13*n21*n42 + n11*n23*n42 + n12*n21*n43 - n11*n22*n43;
		te[15] = n12*n23*n31 - n13*n22*n31 + n13*n21*n32 - n11*n23*n32 - n12*n21*n33 + n11*n22*n33;

		var det = n11 * te[ 0 ] + n21 * te[ 4 ] + n31 * te[ 8 ] + n41 * te[ 12 ];

		if ( det == 0 ) {

			var msg = "Matrix4.getInverse(): can't invert matrix, determinant is 0";

			if ( throwOnInvertible || false ) {

				throw new Error( msg ); 

			} else {

				console.warn( msg );

			}

			this.identity();

			return this;
		}

		this.multiplyScalar( 1 / det );

		return this;

	},

	translate: function ( v ) {

		console.warn( 'DEPRECATED: Matrix4\'s .translate() has been removed.');

	},

	rotateX: function ( angle ) {

		console.warn( 'DEPRECATED: Matrix4\'s .rotateX() has been removed.');

	},

	rotateY: function ( angle ) {

		console.warn( 'DEPRECATED: Matrix4\'s .rotateY() has been removed.');

	},

	rotateZ: function ( angle ) {

		console.warn( 'DEPRECATED: Matrix4\'s .rotateZ() has been removed.');

	},

	rotateByAxis: function ( axis, angle ) {

		console.warn( 'DEPRECATED: Matrix4\'s .rotateByAxis() has been removed.');

	},

	scale: function ( v ) {

		var te = this.elements;
		var x = v.x, y = v.y, z = v.z;

		te[0] *= x; te[4] *= y; te[8] *= z;
		te[1] *= x; te[5] *= y; te[9] *= z;
		te[2] *= x; te[6] *= y; te[10] *= z;
		te[3] *= x; te[7] *= y; te[11] *= z;

		return this;

	},

	getMaxScaleOnAxis: function () {

		var te = this.elements;

		var scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
		var scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
		var scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];

		return Math.sqrt( Math.max( scaleXSq, Math.max( scaleYSq, scaleZSq ) ) );

	},

	makeTranslation: function ( x, y, z ) {

		this.set(

			1, 0, 0, x,
			0, 1, 0, y,
			0, 0, 1, z,
			0, 0, 0, 1

		);

		return this;

	},

	makeRotationX: function ( theta ) {

		var c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			1, 0,  0, 0,
			0, c, -s, 0,
			0, s,  c, 0,
			0, 0,  0, 1

		);

		return this;

	},

	makeRotationY: function ( theta ) {

		var c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			 c, 0, s, 0,
			 0, 1, 0, 0,
			-s, 0, c, 0,
			 0, 0, 0, 1

		);

		return this;

	},

	makeRotationZ: function ( theta ) {

		var c = Math.cos( theta ), s = Math.sin( theta );

		this.set(

			c, -s, 0, 0,
			s,  c, 0, 0,
			0,  0, 1, 0,
			0,  0, 0, 1

		);

		return this;

	},

	makeRotationAxis: function ( axis, angle ) {

		// Based on http://www.gamedev.net/reference/articles/article1199.asp

		var c = Math.cos( angle );
		var s = Math.sin( angle );
		var t = 1 - c;
		var x = axis.x, y = axis.y, z = axis.z;
		var tx = t * x, ty = t * y;

		this.set(

			tx * x + c, tx * y - s * z, tx * z + s * y, 0,
			tx * y + s * z, ty * y + c, ty * z - s * x, 0,
			tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
			0, 0, 0, 1

		);

		 return this;

	},

	makeScale: function ( x, y, z ) {

		this.set(

			x, 0, 0, 0,
			0, y, 0, 0,
			0, 0, z, 0,
			0, 0, 0, 1

		);

		return this;

	},

	compose: function ( position, quaternion, scale ) {

		this.makeRotationFromQuaternion( quaternion );
		this.scale( scale );
		this.setPosition( position );

		return this;

	},

	decompose: function () {

		var vector = new THREE.Vector3();
		var matrix = new THREE.Matrix4();

		return function ( position, quaternion, scale ) {

			var te = this.elements;

			var sx = vector.set( te[0], te[1], te[2] ).length();
			var sy = vector.set( te[4], te[5], te[6] ).length();
			var sz = vector.set( te[8], te[9], te[10] ).length();

			// if determine is negative, we need to invert one scale
			var det = this.determinant();
			if( det < 0 ) {
				sx = -sx;
			}

			position.x = te[12];
			position.y = te[13];
			position.z = te[14];

			// scale the rotation part

			matrix.elements.set( this.elements ); // at this point matrix is incomplete so we can't use .copy()

			var invSX = 1 / sx;
			var invSY = 1 / sy;
			var invSZ = 1 / sz;

			matrix.elements[0] *= invSX;
			matrix.elements[1] *= invSX;
			matrix.elements[2] *= invSX;

			matrix.elements[4] *= invSY;
			matrix.elements[5] *= invSY;
			matrix.elements[6] *= invSY;

			matrix.elements[8] *= invSZ;
			matrix.elements[9] *= invSZ;
			matrix.elements[10] *= invSZ;

			quaternion.setFromRotationMatrix( matrix );

			scale.x = sx;
			scale.y = sy;
			scale.z = sz;

			return this;

		};

	}(),

	makeFrustum: function ( left, right, bottom, top, near, far ) {

		var te = this.elements;
		var x = 2 * near / ( right - left );
		var y = 2 * near / ( top - bottom );

		var a = ( right + left ) / ( right - left );
		var b = ( top + bottom ) / ( top - bottom );
		var c = - ( far + near ) / ( far - near );
		var d = - 2 * far * near / ( far - near );

		te[0] = x;	te[4] = 0;	te[8] = a;	te[12] = 0;
		te[1] = 0;	te[5] = y;	te[9] = b;	te[13] = 0;
		te[2] = 0;	te[6] = 0;	te[10] = c;	te[14] = d;
		te[3] = 0;	te[7] = 0;	te[11] = - 1;	te[15] = 0;

		return this;

	},

	makePerspective: function ( fov, aspect, near, far ) {

		var ymax = near * Math.tan( THREE.Math.degToRad( fov * 0.5 ) );
		var ymin = - ymax;
		var xmin = ymin * aspect;
		var xmax = ymax * aspect;

		return this.makeFrustum( xmin, xmax, ymin, ymax, near, far );

	},

	makeOrthographic: function ( left, right, top, bottom, near, far ) {

		var te = this.elements;
		var w = right - left;
		var h = top - bottom;
		var p = far - near;

		var x = ( right + left ) / w;
		var y = ( top + bottom ) / h;
		var z = ( far + near ) / p;

		te[0] = 2 / w;	te[4] = 0;	te[8] = 0;	te[12] = -x;
		te[1] = 0;	te[5] = 2 / h;	te[9] = 0;	te[13] = -y;
		te[2] = 0;	te[6] = 0;	te[10] = -2/p;	te[14] = -z;
		te[3] = 0;	te[7] = 0;	te[11] = 0;	te[15] = 1;

		return this;

	},

	fromArray: function ( array ) {

		this.elements.set( array );

		return this;

	},

	toArray: function () {

		var te = this.elements;

		return [
			te[ 0 ], te[ 1 ], te[ 2 ], te[ 3 ],
			te[ 4 ], te[ 5 ], te[ 6 ], te[ 7 ],
			te[ 8 ], te[ 9 ], te[ 10 ], te[ 11 ],
			te[ 12 ], te[ 13 ], te[ 14 ], te[ 15 ]
		];

	},

	clone: function () {

		var te = this.elements;

		return new THREE.Matrix4(

			te[0], te[4], te[8], te[12],
			te[1], te[5], te[9], te[13],
			te[2], te[6], te[10], te[14],
			te[3], te[7], te[11], te[15]

		);

	}

};

/**
 * @author bhouston / http://exocortex.com
 */

THREE.Ray = function ( origin, direction ) {

	this.origin = ( origin !== undefined ) ? origin : new THREE.Vector3();
	this.direction = ( direction !== undefined ) ? direction : new THREE.Vector3();

};

THREE.Ray.prototype = {

	constructor: THREE.Ray,

	set: function ( origin, direction ) {

		this.origin.copy( origin );
		this.direction.copy( direction );

		return this;

	},

	copy: function ( ray ) {

		this.origin.copy( ray.origin );
		this.direction.copy( ray.direction );

		return this;

	},

	at: function ( t, optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();

		return result.copy( this.direction ).multiplyScalar( t ).add( this.origin );

	},

	recast: function () {

		var v1 = new THREE.Vector3();

		return function ( t ) {

			this.origin.copy( this.at( t, v1 ) );

			return this;

		};

	}(),

	closestPointToPoint: function ( point, optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		result.subVectors( point, this.origin );
		var directionDistance = result.dot( this.direction );

		if ( directionDistance < 0 ) {

			return result.copy( this.origin );

		}

		return result.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

	},

	distanceToPoint: function () {

		var v1 = new THREE.Vector3();

		return function ( point ) {

			var directionDistance = v1.subVectors( point, this.origin ).dot( this.direction );

			// point behind the ray

			if ( directionDistance < 0 ) {

				return this.origin.distanceTo( point );

			}

			v1.copy( this.direction ).multiplyScalar( directionDistance ).add( this.origin );

			return v1.distanceTo( point );

		};

	}(),

	distanceSqToSegment: function( v0, v1, optionalPointOnRay, optionalPointOnSegment ) {

		// from http://www.geometrictools.com/LibMathematics/Distance/Wm5DistRay3Segment3.cpp
		// It returns the min distance between the ray and the segment
		// defined by v0 and v1
		// It can also set two optional targets :
		// - The closest point on the ray
		// - The closest point on the segment

		var segCenter = v0.clone().add( v1 ).multiplyScalar( 0.5 );
		var segDir = v1.clone().sub( v0 ).normalize();
		var segExtent = v0.distanceTo( v1 ) * 0.5;
		var diff = this.origin.clone().sub( segCenter );
		var a01 = - this.direction.dot( segDir );
		var b0 = diff.dot( this.direction );
		var b1 = - diff.dot( segDir );
		var c = diff.lengthSq();
		var det = Math.abs( 1 - a01 * a01 );
		var s0, s1, sqrDist, extDet;

		if ( det >= 0 ) {

			// The ray and segment are not parallel.

			s0 = a01 * b1 - b0;
			s1 = a01 * b0 - b1;
			extDet = segExtent * det;

			if ( s0 >= 0 ) {

				if ( s1 >= - extDet ) {

					if ( s1 <= extDet ) {

						// region 0
						// Minimum at interior points of ray and segment.

						var invDet = 1 / det;
						s0 *= invDet;
						s1 *= invDet;
						sqrDist = s0 * ( s0 + a01 * s1 + 2 * b0 ) + s1 * ( a01 * s0 + s1 + 2 * b1 ) + c;

					} else {

						// region 1

						s1 = segExtent;
						s0 = Math.max( 0, - ( a01 * s1 + b0) );
						sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

					}

				} else {

					// region 5

					s1 = - segExtent;
					s0 = Math.max( 0, - ( a01 * s1 + b0) );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				}

			} else {

				if ( s1 <= - extDet) {

					// region 4

					s0 = Math.max( 0, - ( - a01 * segExtent + b0 ) );
					s1 = ( s0 > 0 ) ? - segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				} else if ( s1 <= extDet ) {

					// region 3

					s0 = 0;
					s1 = Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = s1 * ( s1 + 2 * b1 ) + c;

				} else {

					// region 2

					s0 = Math.max( 0, - ( a01 * segExtent + b0 ) );
					s1 = ( s0 > 0 ) ? segExtent : Math.min( Math.max( - segExtent, - b1 ), segExtent );
					sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

				}

			}

		} else {

			// Ray and segment are parallel.

			s1 = ( a01 > 0 ) ? - segExtent : segExtent;
			s0 = Math.max( 0, - ( a01 * s1 + b0 ) );
			sqrDist = - s0 * s0 + s1 * ( s1 + 2 * b1 ) + c;

		}

		if ( optionalPointOnRay ) {

			optionalPointOnRay.copy( this.direction.clone().multiplyScalar( s0 ).add( this.origin ) );

		}

		if ( optionalPointOnSegment ) {

			optionalPointOnSegment.copy( segDir.clone().multiplyScalar( s1 ).add( segCenter ) );

		}

		return sqrDist;

	},

	isIntersectionSphere: function ( sphere ) {

		return this.distanceToPoint( sphere.center ) <= sphere.radius;

	},

	isIntersectionPlane: function ( plane ) {

		// check if the ray lies on the plane first

		var distToPoint = plane.distanceToPoint( this.origin );

		if ( distToPoint === 0 ) {

			return true;

		}

		var denominator = plane.normal.dot( this.direction );

		if ( denominator * distToPoint < 0 ) {

			return true

		}

		// ray origin is behind the plane (and is pointing behind it)

		return false;

	},

	distanceToPlane: function ( plane ) {

		var denominator = plane.normal.dot( this.direction );
		if ( denominator == 0 ) {

			// line is coplanar, return origin
			if( plane.distanceToPoint( this.origin ) == 0 ) {

				return 0;

			}

			// Null is preferable to undefined since undefined means.... it is undefined

			return null;

		}

		var t = - ( this.origin.dot( plane.normal ) + plane.constant ) / denominator;

		// Return if the ray never intersects the plane

		return t >= 0 ? t :  null;

	},

	intersectPlane: function ( plane, optionalTarget ) {

		var t = this.distanceToPlane( plane );

		if ( t === null ) {

			return null;
		}

		return this.at( t, optionalTarget );

	},

	isIntersectionBox: function () {
		
		var v = new THREE.Vector3();

		return function ( box ) {

			return this.intersectBox( box, v ) !== null;

		}

	}(),

	intersectBox: function ( box , optionalTarget ) {

		// http://www.scratchapixel.com/lessons/3d-basic-lessons/lesson-7-intersecting-simple-shapes/ray-box-intersection/

		var tmin,tmax,tymin,tymax,tzmin,tzmax;

		var invdirx = 1/this.direction.x,
			invdiry = 1/this.direction.y,
			invdirz = 1/this.direction.z;

		var origin = this.origin;

		if (invdirx >= 0) {
				
			tmin = (box.min.x - origin.x) * invdirx;
			tmax = (box.max.x - origin.x) * invdirx;

		} else { 

			tmin = (box.max.x - origin.x) * invdirx;
			tmax = (box.min.x - origin.x) * invdirx;
		}			

		if (invdiry >= 0) {
		
			tymin = (box.min.y - origin.y) * invdiry;
			tymax = (box.max.y - origin.y) * invdiry;

		} else {

			tymin = (box.max.y - origin.y) * invdiry;
			tymax = (box.min.y - origin.y) * invdiry;
		}

		if ((tmin > tymax) || (tymin > tmax)) return null;

		// These lines also handle the case where tmin or tmax is NaN
		// (result of 0 * Infinity). x !== x returns true if x is NaN
		
		if (tymin > tmin || tmin !== tmin ) tmin = tymin;

		if (tymax < tmax || tmax !== tmax ) tmax = tymax;

		if (invdirz >= 0) {
		
			tzmin = (box.min.z - origin.z) * invdirz;
			tzmax = (box.max.z - origin.z) * invdirz;

		} else {

			tzmin = (box.max.z - origin.z) * invdirz;
			tzmax = (box.min.z - origin.z) * invdirz;
		}

		if ((tmin > tzmax) || (tzmin > tmax)) return null;

		if (tzmin > tmin || tmin !== tmin ) tmin = tzmin;

		if (tzmax < tmax || tmax !== tmax ) tmax = tzmax;

		//return point closest to the ray (positive side)

		if ( tmax < 0 ) return null;

		return this.at( tmin >= 0 ? tmin : tmax, optionalTarget );

	},

	intersectTriangle: function() {

		// Compute the offset origin, edges, and normal.
		var diff = new THREE.Vector3();
		var edge1 = new THREE.Vector3();
		var edge2 = new THREE.Vector3();
		var normal = new THREE.Vector3();

		return function ( a, b, c, backfaceCulling, optionalTarget ) {

			// from http://www.geometrictools.com/LibMathematics/Intersection/Wm5IntrRay3Triangle3.cpp

			edge1.subVectors( b, a );
			edge2.subVectors( c, a );
			normal.crossVectors( edge1, edge2 );

			// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
			// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
			//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
			//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
			//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
			var DdN = this.direction.dot( normal );
			var sign;

			if ( DdN > 0 ) {

				if ( backfaceCulling ) return null;
				sign = 1;

			} else if ( DdN < 0 ) {

				sign = - 1;
				DdN = - DdN;

			} else {

				return null;

			}

			diff.subVectors( this.origin, a );
			var DdQxE2 = sign * this.direction.dot( edge2.crossVectors( diff, edge2 ) );

			// b1 < 0, no intersection
			if ( DdQxE2 < 0 ) {

				return null;

			}

			var DdE1xQ = sign * this.direction.dot( edge1.cross( diff ) );

			// b2 < 0, no intersection
			if ( DdE1xQ < 0 ) {

				return null;

			}

			// b1+b2 > 1, no intersection
			if ( DdQxE2 + DdE1xQ > DdN ) {

				return null;

			}

			// Line intersects triangle, check if ray does.
			var QdN = - sign * diff.dot( normal );

			// t < 0, no intersection
			if ( QdN < 0 ) {

				return null;

			}

			// Ray intersects triangle.
			return this.at( QdN / DdN, optionalTarget );
	
		}
	
	}(),

	applyMatrix4: function ( matrix4 ) {

		this.direction.add( this.origin ).applyMatrix4( matrix4 );
		this.origin.applyMatrix4( matrix4 );
		this.direction.sub( this.origin );
		this.direction.normalize();

		return this;
	},

	equals: function ( ray ) {

		return ray.origin.equals( this.origin ) && ray.direction.equals( this.direction );

	},

	clone: function () {

		return new THREE.Ray().copy( this );

	}

};

/**
 * @author bhouston / http://exocortex.com
 * @author mrdoob / http://mrdoob.com/
 */

THREE.Sphere = function ( center, radius ) {

	this.center = ( center !== undefined ) ? center : new THREE.Vector3();
	this.radius = ( radius !== undefined ) ? radius : 0;

};

THREE.Sphere.prototype = {

	constructor: THREE.Sphere,

	set: function ( center, radius ) {

		this.center.copy( center );
		this.radius = radius;

		return this;
	},


	setFromPoints: function () {

		var box = new THREE.Box3();

		return function ( points, optionalCenter )  {

			var center = this.center;

			if ( optionalCenter !== undefined ) {

				center.copy( optionalCenter );

			} else {

				box.setFromPoints( points ).center( center );

			}

			var maxRadiusSq = 0;

			for ( var i = 0, il = points.length; i < il; i ++ ) {

				maxRadiusSq = Math.max( maxRadiusSq, center.distanceToSquared( points[ i ] ) );

			}

			this.radius = Math.sqrt( maxRadiusSq );

			return this;			
 		
 		};

	}(),

	copy: function ( sphere ) {

		this.center.copy( sphere.center );
		this.radius = sphere.radius;

		return this;

	},

	empty: function () {

		return ( this.radius <= 0 );

	},

	containsPoint: function ( point ) {

		return ( point.distanceToSquared( this.center ) <= ( this.radius * this.radius ) );

	},

	distanceToPoint: function ( point ) {

		return ( point.distanceTo( this.center ) - this.radius );

	},

	intersectsSphere: function ( sphere ) {

		var radiusSum = this.radius + sphere.radius;

		return sphere.center.distanceToSquared( this.center ) <= ( radiusSum * radiusSum );

	},

	clampPoint: function ( point, optionalTarget ) {

		var deltaLengthSq = this.center.distanceToSquared( point );

		var result = optionalTarget || new THREE.Vector3();
		result.copy( point );

		if ( deltaLengthSq > ( this.radius * this.radius ) ) {

			result.sub( this.center ).normalize();
			result.multiplyScalar( this.radius ).add( this.center );

		}

		return result;

	},

	getBoundingBox: function ( optionalTarget ) {

		var box = optionalTarget || new THREE.Box3();

		box.set( this.center, this.center );
		box.expandByScalar( this.radius );

		return box;

	},

	applyMatrix4: function ( matrix ) {

		this.center.applyMatrix4( matrix );
		this.radius = this.radius * matrix.getMaxScaleOnAxis();

		return this;

	},

	translate: function ( offset ) {

		this.center.add( offset );

		return this;

	},

	equals: function ( sphere ) {

		return sphere.center.equals( this.center ) && ( sphere.radius === this.radius );

	},

	clone: function () {

		return new THREE.Sphere().copy( this );

	}

};

/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author bhouston / http://exocortex.com
 */

THREE.Frustum = function ( p0, p1, p2, p3, p4, p5 ) {

	this.planes = [

		( p0 !== undefined ) ? p0 : new THREE.Plane(),
		( p1 !== undefined ) ? p1 : new THREE.Plane(),
		( p2 !== undefined ) ? p2 : new THREE.Plane(),
		( p3 !== undefined ) ? p3 : new THREE.Plane(),
		( p4 !== undefined ) ? p4 : new THREE.Plane(),
		( p5 !== undefined ) ? p5 : new THREE.Plane()

	];

};

THREE.Frustum.prototype = {

	constructor: THREE.Frustum,

	set: function ( p0, p1, p2, p3, p4, p5 ) {

		var planes = this.planes;

		planes[0].copy( p0 );
		planes[1].copy( p1 );
		planes[2].copy( p2 );
		planes[3].copy( p3 );
		planes[4].copy( p4 );
		planes[5].copy( p5 );

		return this;

	},

	copy: function ( frustum ) {

		var planes = this.planes;

		for( var i = 0; i < 6; i ++ ) {

			planes[i].copy( frustum.planes[i] );

		}

		return this;

	},

	setFromMatrix: function ( m ) {

		var planes = this.planes;
		var me = m.elements;
		var me0 = me[0], me1 = me[1], me2 = me[2], me3 = me[3];
		var me4 = me[4], me5 = me[5], me6 = me[6], me7 = me[7];
		var me8 = me[8], me9 = me[9], me10 = me[10], me11 = me[11];
		var me12 = me[12], me13 = me[13], me14 = me[14], me15 = me[15];

		planes[ 0 ].setComponents( me3 - me0, me7 - me4, me11 - me8, me15 - me12 ).normalize();
		planes[ 1 ].setComponents( me3 + me0, me7 + me4, me11 + me8, me15 + me12 ).normalize();
		planes[ 2 ].setComponents( me3 + me1, me7 + me5, me11 + me9, me15 + me13 ).normalize();
		planes[ 3 ].setComponents( me3 - me1, me7 - me5, me11 - me9, me15 - me13 ).normalize();
		planes[ 4 ].setComponents( me3 - me2, me7 - me6, me11 - me10, me15 - me14 ).normalize();
		planes[ 5 ].setComponents( me3 + me2, me7 + me6, me11 + me10, me15 + me14 ).normalize();

		return this;

	},

	intersectsObject: function () {

		var sphere = new THREE.Sphere();

		return function ( object ) {

			var geometry = object.geometry;

			if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

			sphere.copy( geometry.boundingSphere );
			sphere.applyMatrix4( object.matrixWorld );

			return this.intersectsSphere( sphere );

		};

	}(),

	intersectsSphere: function ( sphere ) {

		var planes = this.planes;
		var center = sphere.center;
		var negRadius = -sphere.radius;

		for ( var i = 0; i < 6; i ++ ) {

			var distance = planes[ i ].distanceToPoint( center );

			if ( distance < negRadius ) {

				return false;

			}

		}

		return true;

	},

	intersectsBox : function() {

		var p1 = new THREE.Vector3(),
			p2 = new THREE.Vector3();

		return function( box ) {

			var planes = this.planes;
			
			for ( var i = 0; i < 6 ; i ++ ) {
			
				var plane = planes[i];
				
				p1.x = plane.normal.x > 0 ? box.min.x : box.max.x;
				p2.x = plane.normal.x > 0 ? box.max.x : box.min.x;
				p1.y = plane.normal.y > 0 ? box.min.y : box.max.y;
				p2.y = plane.normal.y > 0 ? box.max.y : box.min.y;
				p1.z = plane.normal.z > 0 ? box.min.z : box.max.z;
				p2.z = plane.normal.z > 0 ? box.max.z : box.min.z;

				var d1 = plane.distanceToPoint( p1 );
				var d2 = plane.distanceToPoint( p2 );
				
				// if both outside plane, no intersection

				if ( d1 < 0 && d2 < 0 ) {
					
					return false;
		
				}
			}

			return true;
		};

	}(),


	containsPoint: function ( point ) {

		var planes = this.planes;

		for ( var i = 0; i < 6; i ++ ) {

			if ( planes[ i ].distanceToPoint( point ) < 0 ) {

				return false;

			}

		}

		return true;

	},

	clone: function () {

		return new THREE.Frustum().copy( this );

	}

};

/**
 * @author bhouston / http://exocortex.com
 */

THREE.Plane = function ( normal, constant ) {

	this.normal = ( normal !== undefined ) ? normal : new THREE.Vector3( 1, 0, 0 );
	this.constant = ( constant !== undefined ) ? constant : 0;

};

THREE.Plane.prototype = {

	constructor: THREE.Plane,

	set: function ( normal, constant ) {

		this.normal.copy( normal );
		this.constant = constant;

		return this;

	},

	setComponents: function ( x, y, z, w ) {

		this.normal.set( x, y, z );
		this.constant = w;

		return this;

	},

	setFromNormalAndCoplanarPoint: function ( normal, point ) {

		this.normal.copy( normal );
		this.constant = - point.dot( this.normal );	// must be this.normal, not normal, as this.normal is normalized

		return this;

	},

	setFromCoplanarPoints: function() {

		var v1 = new THREE.Vector3();
		var v2 = new THREE.Vector3();

		return function ( a, b, c ) {

			var normal = v1.subVectors( c, b ).cross( v2.subVectors( a, b ) ).normalize();

			// Q: should an error be thrown if normal is zero (e.g. degenerate plane)?

			this.setFromNormalAndCoplanarPoint( normal, a );

			return this;

		};

	}(),


	copy: function ( plane ) {

		this.normal.copy( plane.normal );
		this.constant = plane.constant;

		return this;

	},

	normalize: function () {

		// Note: will lead to a divide by zero if the plane is invalid.

		var inverseNormalLength = 1.0 / this.normal.length();
		this.normal.multiplyScalar( inverseNormalLength );
		this.constant *= inverseNormalLength;

		return this;

	},

	negate: function () {

		this.constant *= -1;
		this.normal.negate();

		return this;

	},

	distanceToPoint: function ( point ) {

		return this.normal.dot( point ) + this.constant;

	},

	distanceToSphere: function ( sphere ) {

		return this.distanceToPoint( sphere.center ) - sphere.radius;

	},

	projectPoint: function ( point, optionalTarget ) {

		return this.orthoPoint( point, optionalTarget ).sub( point ).negate();

	},

	orthoPoint: function ( point, optionalTarget ) {

		var perpendicularMagnitude = this.distanceToPoint( point );

		var result = optionalTarget || new THREE.Vector3();
		return result.copy( this.normal ).multiplyScalar( perpendicularMagnitude );

	},

	isIntersectionLine: function ( line ) {

		// Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.

		var startSign = this.distanceToPoint( line.start );
		var endSign = this.distanceToPoint( line.end );

		return ( startSign < 0 && endSign > 0 ) || ( endSign < 0 && startSign > 0 );

	},

	intersectLine: function() {

		var v1 = new THREE.Vector3();

		return function ( line, optionalTarget ) {

			var result = optionalTarget || new THREE.Vector3();

			var direction = line.delta( v1 );

			var denominator = this.normal.dot( direction );

			if ( denominator == 0 ) {

				// line is coplanar, return origin
				if( this.distanceToPoint( line.start ) == 0 ) {

					return result.copy( line.start );

				}

				// Unsure if this is the correct method to handle this case.
				return undefined;

			}

			var t = - ( line.start.dot( this.normal ) + this.constant ) / denominator;

			if( t < 0 || t > 1 ) {

				return undefined;

			}

			return result.copy( direction ).multiplyScalar( t ).add( line.start );

		};

	}(),


	coplanarPoint: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.copy( this.normal ).multiplyScalar( - this.constant );

	},

	applyMatrix4: function() {

		var v1 = new THREE.Vector3();
		var v2 = new THREE.Vector3();
		var m1 = new THREE.Matrix3();

		return function ( matrix, optionalNormalMatrix ) {

			// compute new normal based on theory here:
			// http://www.songho.ca/opengl/gl_normaltransform.html
			var normalMatrix = optionalNormalMatrix || m1.getNormalMatrix( matrix );
			var newNormal = v1.copy( this.normal ).applyMatrix3( normalMatrix );
			
			var newCoplanarPoint = this.coplanarPoint( v2 );
			newCoplanarPoint.applyMatrix4( matrix );

			this.setFromNormalAndCoplanarPoint( newNormal, newCoplanarPoint );

			return this;

		};

	}(),

	translate: function ( offset ) {

		this.constant = this.constant - offset.dot( this.normal );

		return this;

	},

	equals: function ( plane ) {

		return plane.normal.equals( this.normal ) && ( plane.constant == this.constant );

	},

	clone: function () {

		return new THREE.Plane().copy( this );

	}

};

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 */

THREE.Math = {

	generateUUID: function () {

		// http://www.broofa.com/Tools/Math.uuid.htm
		
		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
		var uuid = new Array(36);
		var rnd = 0, r;

		return function () {

			for ( var i = 0; i < 36; i ++ ) {

				if ( i == 8 || i == 13 || i == 18 || i == 23 ) {
			
					uuid[ i ] = '-';
			
				} else if ( i == 14 ) {
			
					uuid[ i ] = '4';
			
				} else {
			
					if (rnd <= 0x02) rnd = 0x2000000 + (Math.random()*0x1000000)|0;
					r = rnd & 0xf;
					rnd = rnd >> 4;
					uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];

				}
			}
			
			return uuid.join('');

		};

	}(),

	// Clamp value to range <a, b>

	clamp: function ( x, a, b ) {

		return ( x < a ) ? a : ( ( x > b ) ? b : x );

	},

	// Clamp value to range <a, inf)

	clampBottom: function ( x, a ) {

		return x < a ? a : x;

	},

	// Linear mapping from range <a1, a2> to range <b1, b2>

	mapLinear: function ( x, a1, a2, b1, b2 ) {

		return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

	},

	// http://en.wikipedia.org/wiki/Smoothstep

	smoothstep: function ( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min )/( max - min );

		return x*x*(3 - 2*x);

	},

	smootherstep: function ( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min )/( max - min );

		return x*x*x*(x*(x*6 - 15) + 10);

	},

	// Random float from <0, 1> with 16 bits of randomness
	// (standard Math.random() creates repetitive patterns when applied over larger space)

	random16: function () {

		return ( 65280 * Math.random() + 255 * Math.random() ) / 65535;

	},

	// Random integer from <low, high> interval

	randInt: function ( low, high ) {

		return low + Math.floor( Math.random() * ( high - low + 1 ) );

	},

	// Random float from <low, high> interval

	randFloat: function ( low, high ) {

		return low + Math.random() * ( high - low );

	},

	// Random float from <-range/2, range/2> interval

	randFloatSpread: function ( range ) {

		return range * ( 0.5 - Math.random() );

	},

	sign: function ( x ) {

		return ( x < 0 ) ? - 1 : ( x > 0 ) ? 1 : 0;

	},

	degToRad: function() {

		var degreeToRadiansFactor = Math.PI / 180;

		return function ( degrees ) {

			return degrees * degreeToRadiansFactor;

		};

	}(),

	radToDeg: function() {

		var radianToDegreesFactor = 180 / Math.PI;

		return function ( radians ) {

			return radians * radianToDegreesFactor;

		};

	}(),

	isPowerOfTwo: function ( value ) {

		return ( value & ( value - 1 ) ) === 0 && value !== 0;

	}

};

/**
 * Spline from Tween.js, slightly optimized (and trashed)
 * http://sole.github.com/tween.js/examples/05_spline.html
 *
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 */

THREE.Spline = function ( points ) {

	this.points = points;

	var c = [], v3 = { x: 0, y: 0, z: 0 },
	point, intPoint, weight, w2, w3,
	pa, pb, pc, pd;

	this.initFromArray = function( a ) {

		this.points = [];

		for ( var i = 0; i < a.length; i++ ) {

			this.points[ i ] = { x: a[ i ][ 0 ], y: a[ i ][ 1 ], z: a[ i ][ 2 ] };

		}

	};

	this.getPoint = function ( k ) {

		point = ( this.points.length - 1 ) * k;
		intPoint = Math.floor( point );
		weight = point - intPoint;

		c[ 0 ] = intPoint === 0 ? intPoint : intPoint - 1;
		c[ 1 ] = intPoint;
		c[ 2 ] = intPoint  > this.points.length - 2 ? this.points.length - 1 : intPoint + 1;
		c[ 3 ] = intPoint  > this.points.length - 3 ? this.points.length - 1 : intPoint + 2;

		pa = this.points[ c[ 0 ] ];
		pb = this.points[ c[ 1 ] ];
		pc = this.points[ c[ 2 ] ];
		pd = this.points[ c[ 3 ] ];

		w2 = weight * weight;
		w3 = weight * w2;

		v3.x = interpolate( pa.x, pb.x, pc.x, pd.x, weight, w2, w3 );
		v3.y = interpolate( pa.y, pb.y, pc.y, pd.y, weight, w2, w3 );
		v3.z = interpolate( pa.z, pb.z, pc.z, pd.z, weight, w2, w3 );

		return v3;

	};

	this.getControlPointsArray = function () {

		var i, p, l = this.points.length,
			coords = [];

		for ( i = 0; i < l; i ++ ) {

			p = this.points[ i ];
			coords[ i ] = [ p.x, p.y, p.z ];

		}

		return coords;

	};

	// approximate length by summing linear segments

	this.getLength = function ( nSubDivisions ) {

		var i, index, nSamples, position,
			point = 0, intPoint = 0, oldIntPoint = 0,
			oldPosition = new THREE.Vector3(),
			tmpVec = new THREE.Vector3(),
			chunkLengths = [],
			totalLength = 0;

		// first point has 0 length

		chunkLengths[ 0 ] = 0;

		if ( !nSubDivisions ) nSubDivisions = 100;

		nSamples = this.points.length * nSubDivisions;

		oldPosition.copy( this.points[ 0 ] );

		for ( i = 1; i < nSamples; i ++ ) {

			index = i / nSamples;

			position = this.getPoint( index );
			tmpVec.copy( position );

			totalLength += tmpVec.distanceTo( oldPosition );

			oldPosition.copy( position );

			point = ( this.points.length - 1 ) * index;
			intPoint = Math.floor( point );

			if ( intPoint != oldIntPoint ) {

				chunkLengths[ intPoint ] = totalLength;
				oldIntPoint = intPoint;

			}

		}

		// last point ends with total length

		chunkLengths[ chunkLengths.length ] = totalLength;

		return { chunks: chunkLengths, total: totalLength };

	};

	this.reparametrizeByArcLength = function ( samplingCoef ) {

		var i, j,
			index, indexCurrent, indexNext,
			linearDistance, realDistance,
			sampling, position,
			newpoints = [],
			tmpVec = new THREE.Vector3(),
			sl = this.getLength();

		newpoints.push( tmpVec.copy( this.points[ 0 ] ).clone() );

		for ( i = 1; i < this.points.length; i++ ) {

			//tmpVec.copy( this.points[ i - 1 ] );
			//linearDistance = tmpVec.distanceTo( this.points[ i ] );

			realDistance = sl.chunks[ i ] - sl.chunks[ i - 1 ];

			sampling = Math.ceil( samplingCoef * realDistance / sl.total );

			indexCurrent = ( i - 1 ) / ( this.points.length - 1 );
			indexNext = i / ( this.points.length - 1 );

			for ( j = 1; j < sampling - 1; j++ ) {

				index = indexCurrent + j * ( 1 / sampling ) * ( indexNext - indexCurrent );

				position = this.getPoint( index );
				newpoints.push( tmpVec.copy( position ).clone() );

			}

			newpoints.push( tmpVec.copy( this.points[ i ] ).clone() );

		}

		this.points = newpoints;

	};

	// Catmull-Rom

	function interpolate( p0, p1, p2, p3, t, t2, t3 ) {

		var v0 = ( p2 - p0 ) * 0.5,
			v1 = ( p3 - p1 ) * 0.5;

		return ( 2 * ( p1 - p2 ) + v0 + v1 ) * t3 + ( - 3 * ( p1 - p2 ) - 2 * v0 - v1 ) * t2 + v0 * t + p1;

	};

};

/**
 * @author bhouston / http://exocortex.com
 * @author mrdoob / http://mrdoob.com/
 */

THREE.Triangle = function ( a, b, c ) {

	this.a = ( a !== undefined ) ? a : new THREE.Vector3();
	this.b = ( b !== undefined ) ? b : new THREE.Vector3();
	this.c = ( c !== undefined ) ? c : new THREE.Vector3();

};

THREE.Triangle.normal = function() {

	var v0 = new THREE.Vector3();

	return function ( a, b, c, optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();

		result.subVectors( c, b );
		v0.subVectors( a, b );
		result.cross( v0 );

		var resultLengthSq = result.lengthSq();
		if( resultLengthSq > 0 ) {

			return result.multiplyScalar( 1 / Math.sqrt( resultLengthSq ) );

		}

		return result.set( 0, 0, 0 );

	};

}();

// static/instance method to calculate barycoordinates
// based on: http://www.blackpawn.com/texts/pointinpoly/default.html
THREE.Triangle.barycoordFromPoint = function() {

	var v0 = new THREE.Vector3();
	var v1 = new THREE.Vector3();
	var v2 = new THREE.Vector3();

	return function ( point, a, b, c, optionalTarget ) {

		v0.subVectors( c, a );
		v1.subVectors( b, a );
		v2.subVectors( point, a );

		var dot00 = v0.dot( v0 );
		var dot01 = v0.dot( v1 );
		var dot02 = v0.dot( v2 );
		var dot11 = v1.dot( v1 );
		var dot12 = v1.dot( v2 );

		var denom = ( dot00 * dot11 - dot01 * dot01 );

		var result = optionalTarget || new THREE.Vector3();

		// colinear or singular triangle
		if( denom == 0 ) {
			// arbitrary location outside of triangle?
			// not sure if this is the best idea, maybe should be returning undefined
			return result.set( -2, -1, -1 );
		}

		var invDenom = 1 / denom;
		var u = ( dot11 * dot02 - dot01 * dot12 ) * invDenom;
		var v = ( dot00 * dot12 - dot01 * dot02 ) * invDenom;

		// barycoordinates must always sum to 1
		return result.set( 1 - u - v, v, u );

	};

}();

THREE.Triangle.containsPoint = function() {

	var v1 = new THREE.Vector3();

	return function ( point, a, b, c ) {

		var result = THREE.Triangle.barycoordFromPoint( point, a, b, c, v1 );

		return ( result.x >= 0 ) && ( result.y >= 0 ) && ( ( result.x + result.y ) <= 1 );

	};

}();

THREE.Triangle.prototype = {

	constructor: THREE.Triangle,

	set: function ( a, b, c ) {

		this.a.copy( a );
		this.b.copy( b );
		this.c.copy( c );

		return this;

	},

	setFromPointsAndIndices: function ( points, i0, i1, i2 ) {

		this.a.copy( points[i0] );
		this.b.copy( points[i1] );
		this.c.copy( points[i2] );

		return this;

	},

	copy: function ( triangle ) {

		this.a.copy( triangle.a );
		this.b.copy( triangle.b );
		this.c.copy( triangle.c );

		return this;

	},

	area: function() {

		var v0 = new THREE.Vector3();
		var v1 = new THREE.Vector3();

		return function () {

			v0.subVectors( this.c, this.b );
			v1.subVectors( this.a, this.b );

			return v0.cross( v1 ).length() * 0.5;

		};

	}(),

	midpoint: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Vector3();
		return result.addVectors( this.a, this.b ).add( this.c ).multiplyScalar( 1 / 3 );

	},

	normal: function ( optionalTarget ) {

		return THREE.Triangle.normal( this.a, this.b, this.c, optionalTarget );

	},

	plane: function ( optionalTarget ) {

		var result = optionalTarget || new THREE.Plane();

		return result.setFromCoplanarPoints( this.a, this.b, this.c );

	},

	barycoordFromPoint: function ( point, optionalTarget ) {

		return THREE.Triangle.barycoordFromPoint( point, this.a, this.b, this.c, optionalTarget );

	},

	containsPoint: function ( point ) {

		return THREE.Triangle.containsPoint( point, this.a, this.b, this.c );

	},

	equals: function ( triangle ) {

		return triangle.a.equals( this.a ) && triangle.b.equals( this.b ) && triangle.c.equals( this.c );

	},

	clone: function () {

		return new THREE.Triangle().copy( this );

	}

};


},{}],39:[function(require,module,exports){
var enums = {
	FULLSCREEN : "fullscreen"
}

module.exports = enums;
},{}],40:[function(require,module,exports){
var signals = require('../vendor/signals');

/**
 * Manages render timing, pause and unpause
 * @param {View} view the view to manage
 */
function RenderManager(view) {
	
	this.view = view;
	this.skipFrames = 0;
	this.skipFramesCounter = 0;
	this.onEnterFrame = new signals.Signal();
	this.renderLoop = this.renderLoop.bind(this);
};

RenderManager.prototype = {	
	/**
	 * a flag to request that the render loop stops next at the next frame
	 * @type {Boolean}
	 */
	_requestStop: false,

	/**
	 * the repeating renderLoop calls itself with requestAnimationFrame to act as the render timer
	 */
	renderLoop : function() {
		if(this.skipFramesCounter < this.skipFrames) {
			this.skipFramesCounter++;
		} else {
			this.onEnterFrame.dispatch();
			this.view.render();
			this.skipFramesCounter = 0;
		}
		if(!this._requestStop) requestAnimationFrame(this.renderLoop);
	},

	/**
	 * start rendering
	 */
	start: function() {
		this._requestStop = false;
		requestAnimationFrame(this.renderLoop);
	},

	/**
	 * stop rendering
	 */
	stop: function() {
		this._requestStop = true;
	}
}

module.exports = RenderManager;
},{"../vendor/signals":37}],41:[function(require,module,exports){
var BaseRenderer = require('./renderers/Base');
var DOMMode = require('./DOMMode');
var EventUtils = require('../utils/Events');
var signals = require('../vendor/signals');
var PerformanceTweaker = require('../utils/PerformanceTweaker');
/**
 * View is the viewport canvas and the renderer
 * @param {Object} props an object of properties to override default dehaviours
 */
function View(props) {
	this.addCanvasToDOMBody = this.addCanvasToDOMBody.bind(this);

	props = props || {};
	this.scene = props.scene || new (require('../model/Scene'))();
	if(props.camera) {
		this.camera = props.camera;
	} else {
		this.camera = new (require('../model/Camera3D'))();
		this.scene.add(this.camera);
		this.camera.position.z = 150;
		this.camera.position.y = 60;
		this.camera.lookAt(this.scene.position);
	}
	this.autoStartRender = props.autoStartRender !== undefined ? props.autoStartRender : true;
	this.canvasID = props.canvasID || "ShortSwordCanvas";
	this.domMode = props.domMode || DOMMode.FULLSCREEN;
	
	//use provided canvas or make your own
	this.canvas = document.getElementById(this.canvasID) || this.createCanvas();

	if( this.renderer !== undefined && this.renderer instanceof BaseRenderer)
		this.renderer = props.renderer;
	else 
		this.renderer = new (require('./renderers/Canvas'))(this.canvas, props.renderer);

	this.renderManager = new(require('./RenderManager'))(this);
	this.setDOMMode(this.domMode);
	if(this.autoStartRender) this.renderManager.start();

	PerformanceTweaker.onChange.add(this.onPerformanceTweakerChangeResolution.bind(this));

	this.setupResizing();
}

View.prototype = {
	setupResizing: function() {
		this.onResize = new signals.Signal();
		this.setSize = this.setSize.bind(this);
		EventUtils.addEvent(window, "resize", function(event) {
	
			this.onResize.dispatch(window.innerWidth, window.innerHeight);
		}.bind(this));
		this.onResize.add(this.setSize);
		this.setSize(window.innerWidth, window.innerHeight);

	},
	/**
	 * Renders the scene to the canvas using the renderer
	 * @return {[type]} [description]
	 */
	render: function () {
		PerformanceTweaker.update();
		this.renderer.render(this.scene, this.camera);
	},

	/**
	 * Creates the canvas DOM Element and appends it to the document body
	 * @return {CanvasElement} The newly created canvas element.
	 */
	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.addCanvasToDOMBody(canvas);
		return canvas;
	},

	/**
	 * Actually appends canvas to the DOM.
	 * Will wait until document body is ready.
	 * @param {CanvasElement} canvas the Canvas Element to append to the document body when the DOM is ready.
	 */
	addCanvasToDOMBody: function(canvas) {
		canvas = canvas || this.canvas;
		if(document.body) {
			
			document.body.appendChild(canvas);
		} else {
			
			setTimeout(this.addCanvasToDOMBody, 50);
		}
	},

	/**
	 * sets the DOM Mode, which controls the css rules of the canvas element
	 * @param {String} mode string, enumerated in DOMMode
	 */
	setDOMMode: function(mode) {
		var style = this.canvas.style;
		switch(mode) {
			case DOMMode.FULLSCREEN:
				style.position = "fixed";
				style.left = "0px";
				style.top = "0px";
				style.width = window.innerWidth;
				style.height = window.innerHeight;
				break;
			default:
		}
	},

	setSize: function(w, h) {
		this.canvas.style.width = w;
		this.canvas.style.height = h;
		this.camera.setAspect(w/h);
		this.camera.setLens(w, h);

		this.setResolution(
			~~(w / PerformanceTweaker.denominator), 
			~~(h / PerformanceTweaker.denominator)
		);
	},

	setResolution: function(w, h) {
		this.canvas.width = w;
		this.canvas.height = h;
		this.renderer.setSize(w, h);
	},

	onPerformanceTweakerChangeResolution: function(dynamicScale) {
		this.setResolution(
			~~(window.innerWidth * dynamicScale),
			~~(window.innerHeight * dynamicScale)
		);
	}
};

module.exports = View;
},{"../model/Camera3D":9,"../model/Scene":16,"../utils/Events":27,"../utils/PerformanceTweaker":33,"../vendor/signals":37,"./DOMMode":39,"./RenderManager":40,"./renderers/Base":44,"./renderers/Canvas":45}],42:[function(require,module,exports){
function GlitchOffset(totalOffsets) {
	this.totalOffsets = totalOffsets ? totalOffsets : 1;
}

GlitchOffset.prototype = {
	apply: function(context, width, height) {
		for (var i = 0; i < this.totalOffsets; i++) {
			if(Math.random() > .25) continue;
			var x = ~~(Math.random() * width);
			var y = ~~(Math.random() * height);
			var w = ~~(Math.random() * (width * .7 - 20)) + 20;
			var h = ~~(Math.random() * (height * .1 - 5)) + 5;

			if ((x + w) > width) w -= (x + w) - width;
			if ((y + h) > height) h -= (y + h) - height;

			var offsetX = ~~(Math.random() * width * .1);
			var offsetY = ~~(Math.random() * height * .1);

			context.putImageData(context.getImageData(x, y, w, h), x+offsetX, y+offsetY);
		}
	}
}

module.exports = GlitchOffset;

},{}],43:[function(require,module,exports){
function GlitchOffsetSmearBlock(totalSmears) {
	this.totalSmears = totalSmears ? totalSmears : 1;
}

GlitchOffsetSmearBlock.prototype = {
	apply: function(context, width, height) {
		for (var i = 0; i < this.totalSmears; i++) {
			if(Math.random() > .25) continue;
			var x = ~~(Math.random() * (width - 8));
			var y = ~~(Math.random() * (height - 8));
			var w = 8;
			var h = 8;

			var blockData = context.getImageData(x, y, w, h);

			var startX = ~~(x * Math.random());
			endX = width - ~~((width - x) * Math.random());
			for (var ix = startX; ix < endX; ix+=8) {
				context.putImageData(blockData, ix, y);
			}
		}
	}
}

module.exports = GlitchOffsetSmearBlock;

},{}],44:[function(require,module,exports){
/**
 * Base renderer to extend
 * @param {CanvasElement} canvas the target of the renderer
 * @param {Object} props an object of properties to override default dehaviours
 */
function BaseRenderer(canvas, props) {
	
	this.canvas = canvas;
	
	props = props || {};
}

BaseRenderer.prototype = {
	/**
	 * renders the scene to the canvas from the camera's perspective
	 * @param  {Scene} scene  the scene to render
	 * @param  {Camera3D} camera the camera to render from
	 */
	render: function (scene, camera) {
		console.log("Dummy Render! Extend this Renderer to implement a real Renderer.");
	},
	/**
	 * clears the canvas
	 */
	clear: function() {
		console.log("Dummy Clear! Extend this Renderer to implement a real Renderer.");
	}
};

module.exports = BaseRenderer;
},{}],45:[function(require,module,exports){
var BaseRenderer = require('./Base');
var Mesh = require('../../model/Mesh');
var BlendMesh = require('../../model/BlendMesh');
var PerformanceTweaker = require('../../utils/PerformanceTweaker');
var DrawBuffer = require('../../model/DrawBuffer' );

/**
 * CanvasRenderer extends BaseRenderer and provides rendering functionality using native canvas API
 */
function CanvasRenderer( canvas, props ) {
	this.setSize = this.setSize.bind(this);
	props = props || {};

	BaseRenderer.call( this, canvas, props );

	this.context = canvas.getContext("2d");
	this.drawBuffer = new DrawBuffer( this.context, props.bgColor === undefined ? 0xFF000000 : props.bgColor );

	this.autoClear = props.autoClear === undefined ? true : props.autoClear;

	this.viewProjectionMatrix = new THREE.Matrix4();

	this.setSize( window.innerWidth, window.innerHeight );

	this.effects = [];
}

/**
 * CanvasRenderer extends BaseRenderer
 * @type {[type]}
 */
CanvasRenderer.prototype = Object.create(BaseRenderer.prototype);

CanvasRenderer.prototype.setSize = function(w, h) {

	this.canvasWidth = w;
	this.canvasHeight = h;
	this.canvasWidthHalf = w * .5;
	this.canvasHeightHalf = h * .5;
	this.canvas.width = w;
	this.canvas.height = h;

	this.resetBuffer();
	this.clear();
};

CanvasRenderer.prototype.resetBuffer = function() {

	this.drawBuffer.reset();
};

CanvasRenderer.prototype.clear = function() {

	this.drawBuffer.clear();
};
/**
 * renders the scene to the canvas from the camera's perspective
 * @param  {Scene} scene  the scene to render
 * @param  {Camera3D} camera the camera to render from
 */
CanvasRenderer.prototype.render = function(scene, camera) {
	scene.updateMatrixWorld();

	if ( this.autoClear ) this.clear();

	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	this.viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );

	this.renderObjectToBuffer( scene, camera );
	
	this.drawBuffer.present();

	this.applyEffectsToBuffer();
};

CanvasRenderer.prototype.renderObjectToBuffer = function() {

	var canvasVector = new THREE.Vector3();
	var canvasVectors = [];

	return function(object, camera) {

		var canvasWidth = this.canvasWidth;
		var canvasHeight = this.canvasHeight;
		var canvasWidthHalf = this.canvasWidthHalf;
		var canvasHeightHalf = this.canvasHeightHalf;
		
		if( object instanceof Mesh ) {

			object.updateGeometry();

			var verts = object.geometry.vertices;
			var material = object.material;
			var vertsToRender = ~~(verts.length / PerformanceTweaker.denominatorSquared) - 1;
			if(material.zsort) object.geometry.updateDrawOrderLength(vertsToRender);
			var drawBuffer = this.drawBuffer;

			var animator;
			for (var ia = object.animators.length - 1; ia >= 0; ia--) {
				animator = object.animators[ia];
				if(animator.dirty) {
					animator.update();
					for (var iv = vertsToRender; iv >= 0; iv--) {
						animator.updateVertex(iv);
					}
				}
			}

			material.init( this.context, this.drawBuffer.getClearColour32() );
			var matrixWorld = object.matrixWorld;
			var viewProjectionMatrix = this.viewProjectionMatrix;

			//use pool if you need to zsort
			if(material.zsort) {
				var drawOrder = object.geometry.drawOrder;
				var materialIndex = object.geometry.materialIndex;

				//increase pool if need be
				if(canvasVectors.length < vertsToRender) {
					for (var i = canvasVectors.length; i < vertsToRender; i++) {
						canvasVectors[i] = new THREE.Vector3();
					};
				}
				//create screenspace vectors into pool
				for (var i = vertsToRender - 1; i >= 0; i--) {
					canvasVector = canvasVectors[i];
					canvasVector.copy( verts[i] ).applyMatrix4( matrixWorld ).applyProjection( viewProjectionMatrix );
				}
				//zsort the drawOrder
				drawOrder.sort(function(a, b){
					return canvasVectors[b].z - canvasVectors[a].z;
				});
				//render the pool by the drawOrder
				var drawIndex;
				for (var i = vertsToRender - 1; i >= 0; i--) {
					drawIndex = drawOrder[i];
					canvasVector = canvasVectors[drawIndex];

					if(canvasVector.x <= -1 || canvasVector.x >= 1) continue;
					if(canvasVector.y <= -1 || canvasVector.y >= 1) continue;

					var x = ~~(canvasVector.x * canvasWidthHalf + canvasWidthHalf);
					var y = ~~(canvasVector.y * canvasHeightHalf + canvasHeightHalf);

					material.drawToBuffer(
						drawBuffer, 
						x + y * canvasWidth,
						materialIndex[drawIndex],
						canvasWidth,
						canvasVector.z
					);
				};
				//quicker render for things that dont need zsort
			} else {
				for (var i = vertsToRender - 1; i >= 0; i--) {
					canvasVector.copy( verts[i] ).applyMatrix4( matrixWorld ).applyProjection( viewProjectionMatrix );

					if(canvasVector.x <= -1 || canvasVector.x >= 1) continue;
					if(canvasVector.y <= -1 || canvasVector.y >= 1) continue;

					var x = ~~(canvasVector.x * canvasWidthHalf + canvasWidthHalf);
					var y = ~~(canvasVector.y * canvasHeightHalf + canvasHeightHalf);

					material.drawToBuffer(
						drawBuffer, 
						x + y * canvasWidth,
						i,
						canvasWidth,
						canvasVector.z
					);
				};
			}
		}

		for (var i = object.children.length - 1; i >= 0; i--) {

			this.renderObjectToBuffer( object.children[ i ] );
		};
	}
}();

CanvasRenderer.prototype.addEffect = function(effect) {

	this.effects.push(effect);
};

CanvasRenderer.prototype.applyEffectsToBuffer = function() {

	for (var i = 0; i < this.effects.length; i++) {

		this.effects[i].apply(this.context, this.canvasWidth, this.canvasHeight);
	};
};

module.exports = CanvasRenderer;
},{"../../model/BlendMesh":8,"../../model/DrawBuffer":10,"../../model/Mesh":13,"../../utils/PerformanceTweaker":33,"./Base":44}]},{},[7])