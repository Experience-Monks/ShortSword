function RenderManager(view) {
	this.view = view;
	this.renderLoop = this.renderLoop.bind(this);

	console.log('RenderManager initialized!');


};

RenderManager.prototype = {
	renderLoop : function() {
		this.view.render();
		if(!this._requestStop) requestAnimationFrame(this.renderLoop);
	},

	start: function() {
		this._requestStop = false;
		requestAnimationFrame(this.renderLoop);
	},

	stop: function() {
		this._requestStop = true;
	}
}

module.exports = RenderManager;