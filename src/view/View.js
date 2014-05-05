function View(props) {
	props = props || {};
	this.scene = props.scene || new (require('../model/Scene'))();
	this.renderer = props.renderer || new (require('./renderers/Canvas'))(this, props.renderer);
	this.autoStartRender = props.autoStartRender !== undefined ? props.autoStartRender : true;

	console.log('View initialized!');

	this.renderManager = new(require('./RenderManager'))(this);
	if(this.autoStartRender) this.renderManager.start();
}

View.prototype = {
	render: function () {
		this.renderer.render(this.scene);
	}
};

module.exports = View;