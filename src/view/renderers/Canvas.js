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

var drawOrderRaw = [];
for (var i = 100000; i >= 0; i--) {
	drawOrderRaw[i] = i;
};

CanvasRenderer.prototype.renderObjectToBuffer = function() {

	var canvasVector;
	var canvasVectors = [];

	return function(object, camera) {

		var canvasWidth = this.canvasWidth;
		var canvasHeight = this.canvasHeight;
		var canvasWidthHalf = this.canvasWidthHalf;
		var canvasHeightHalf = this.canvasHeightHalf;
		
		if( object instanceof Mesh ) {

			object.updateGeometry();

			var verts = object.geometry.vertices;
			var drawOrder = object.geometry.drawOrder;
			var material = object.material;
			var materialIndex = object.geometry.materialIndex;
			var vertsToRender = ~~(verts.length / PerformanceTweaker.denominatorSquared) - 1;
			object.geometry.updateDrawOrderLength(vertsToRender);
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
			if(material.zsort) {
				drawOrder.sort(function(a, b){
					return canvasVectors[b].z - canvasVectors[a].z;
				});
			}
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