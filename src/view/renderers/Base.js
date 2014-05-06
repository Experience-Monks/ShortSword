function BaseRenderer(view, props) {
	this.view = view;
	
	props = props || {};

	console.log('BaseRenderer initialized!');

}

BaseRenderer.prototype = {
	render: function () {
		console.log("Dummy Render! Extend this Renderer to implement a real Renderer.");
	}
};

module.exports = BaseRenderer;