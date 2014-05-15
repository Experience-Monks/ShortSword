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
	this.drawBuffer = new DrawBuffer( this.context, props.bgColor === undefined ? 0xFF00001E : props.bgColor );

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

	return function(object, camera) {

		var canvasWidth = this.canvasWidth;
		var canvasHeight = this.canvasHeight;
		var canvasWidthHalf = this.canvasWidthHalf;
		var canvasHeightHalf = this.canvasHeightHalf;

		if( object.updateGeometry )
			object.updateGeometry();
		
		if( object instanceof Mesh ) {

			var verts = object.geometry.vertices;
			var material = object.material;
			var vertsToRender = ~~(verts.length / PerformanceTweaker.denominatorSquared) - 1;
			var drawBuffer = this.drawBuffer;

			material.init( this.context, this.drawBuffer.getClearColour32() );
			
			for (var i = vertsToRender; i >= 0; i--) {

				canvasVector.copy( verts[i] ).applyMatrix4( object.matrixWorld ).applyProjection( this.viewProjectionMatrix );

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