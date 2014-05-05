function View(props) {
	props = props || {};
	this.canvasID = props.canvasID || "ShortSwordCanvas";
	this.scene = props.scene || new (require('./Scene'))();
	this.autoStartRender = props.autoStartRender !== undefined ? props.autoStartRender : true;

	console.log('View initialized!');

	this.renderManager = new(require('./RenderManager'))(this);
	if(this.autoStartRender) this.renderManager.start();
}

View.prototype = {
	render: function () {
		console.log('View render');
	}
};

module.exports = View;