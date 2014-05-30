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