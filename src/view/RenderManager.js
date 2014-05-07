/**
 * Manages render timing, pause and unpause
 * @param {View} view the view to manage
 */
function RenderManager(view) {
	this.view = view;
	this.renderLoop = this.renderLoop.bind(this);

	console.log('RenderManager initialized!');
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
		this.view.render();
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