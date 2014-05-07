var BaseRenderer = require('./Base');

/**
 * CanvasRenderer extends BaseRenderer and provides rendering functionality using native canvas API
 */
function CanvasRenderer() {
	BaseRenderer.call( this );

	//console.log('CanvasRenderer initialized!');
}

/**
 * CanvasRenderer extends BaseRenderer
 * @type {[type]}
 */
CanvasRenderer.prototype = Object.create(BaseRenderer.prototype);

/**
 * renders the scene to the canvas from the camera's perspective
 * @param  {Scene} scene  the scene to render
 * @param  {Camera3D} camera the camera to render from
 */
CanvasRenderer.prototype.render = function(scene, camera) {
	console.log("render");
}

module.exports = CanvasRenderer;