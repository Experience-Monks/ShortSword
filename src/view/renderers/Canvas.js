var BaseRenderer = require('./Base');
var Mesh = require('../../model/Mesh');
var BlendMesh = require('../../model/BlendMesh');
/**
 * CanvasRenderer extends BaseRenderer and provides rendering functionality using native canvas API
 */
function CanvasRenderer(canvas, props) {
	this.setSize = this.setSize.bind(this);
	props = props || {};

	BaseRenderer.call( this, canvas, props);

	this.clearColorBuffer = new ArrayBuffer(4);
	this.clearColorBuffer32uint = new Uint32Array(this.clearColorBuffer);
	if(props.clearColor === undefined) {
		this.clearColorBuffer32uint[0] = (0 << 24) | (255 << 16) | (50 <<  8) | 30;
	} else {
		//set the color from props instead
	}
	this.context = canvas.getContext("2d");
	this.autoClear = props.autoClear !== undefined ? props.autoClear : true;

	this.viewProjectionMatrix = new THREE.Matrix4();

	this.setSize(window.innerWidth, window.innerHeight);

	this.effects = [];

	//console.log('CanvasRenderer initialized!');
}

/**
 * CanvasRenderer extends BaseRenderer
 * @type {[type]}
 */
CanvasRenderer.prototype = Object.create(BaseRenderer.prototype);

CanvasRenderer.prototype.setSize = function(w, h) {
	this.screenWidth = w;
	this.screenHeight = h;
	this.screenWidthHalf = w * .5;
	this.screenHeightHalf = h * .5;
	this.resetBuffer();
	this.clear();
};

CanvasRenderer.prototype.resetBuffer = function() {
	this.imageData = this.context.getImageData(0, 0, this.screenWidth, this.screenHeight);
	this.buffer = new ArrayBuffer(this.imageData.data.length);
	this.bufferView8uint = new Uint8ClampedArray(this.buffer);
	this.bufferView32uint = new Uint32Array(this.buffer);
};

CanvasRenderer.prototype.clear = function() {
	var bufferView32uint = this.bufferView32uint;
	var clearColor = this.clearColorBuffer32uint[0];
	for (var i = bufferView32uint.length - 1; i >= 0; i--) {
		bufferView32uint[i] = clearColor;
	};
};
/**
 * renders the scene to the canvas from the camera's perspective
 * @param  {Scene} scene  the scene to render
 * @param  {Camera3D} camera the camera to render from
 */
CanvasRenderer.prototype.render = function(scene, camera) {
	console.log("render");

	scene.updateMatrixWorld();

	if ( this.autoClear === true ) this.clear();

	camera.matrixWorldInverse.getInverse( camera.matrixWorld );

	this.viewProjectionMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );

	this.renderObjectToBuffer(scene, camera);
	this.imageData.data.set(this.bufferView8uint);
	this.context.putImageData(this.imageData, 0, 0);
	this.applyEffectsToBuffer();
};

CanvasRenderer.prototype.renderObjectToBuffer = function() {
	var screenVector = new THREE.Vector3();
	return function(object, camera) {
		var screenWidth = this.screenWidth;
		var screenHeight = this.screenHeight;
		var screenWidthHalf = this.screenWidthHalf;
		var screenHeightHalf = this.screenHeightHalf;
		var screenWidthMinusOne = screenWidth-1;
		var screenHeightMinusOne = screenHeight-1;
		var bufferView32uint = this.bufferView32uint;

		if( object.updateGeometry )
			object.updateGeometry();
		
		if(object instanceof Mesh) {
			var verts = object.geometry.vertices;
			object.material.init(this.context, this.clearColorBuffer32uint[0]);
			var material = object.material;
			for (var i = verts.length - 1; i >= 0; i--) {
				screenVector.copy(verts[i]).applyMatrix4(object.matrixWorld).applyProjection( this.viewProjectionMatrix );
				if(screenVector.x <= -1 || screenVector.x >= 1) continue;
				if(screenVector.y <= -1 || screenVector.y >= 1) continue;
				var x = ~~(screenVector.x * screenWidthHalf + screenWidthHalf);
				var y = ~~(screenVector.y * screenHeightHalf + screenHeightHalf);
				material.drawToBuffer(
					bufferView32uint, 
					x + y * screenWidth,
					i,
					screenVector.z
				);
			};
		}
		for (var i = object.children.length - 1; i >= 0; i--) {
			this.renderObjectToBuffer(object.children[i]);
		};
	}
}();

CanvasRenderer.prototype.addEffect = function(effect) {
	this.effects.push(effect);
};

CanvasRenderer.prototype.applyEffectsToBuffer = function() {
	for (var i = 0; i < this.effects.length; i++) {
		this.effects[i].apply(this.context, this.screenWidth, this.screenHeight);
	};
};

module.exports = CanvasRenderer;