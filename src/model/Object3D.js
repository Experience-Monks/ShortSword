function Object3D(props) {
	props = props || {};
	this.matrix = new (require('./Matrix3D'))();

	console.log('Object3D initialized!');
}

Object3D.prototype = {
	ping : function (object) {
		console.log('pong');
	},
	
	add : function (object) {
		console.log('object added');
	}
};

module.exports = Object3D;
