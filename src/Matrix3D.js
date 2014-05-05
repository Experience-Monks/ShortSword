function Matrix3D(props) {
	props = props || {};
}

Matrix3D.prototype = {
	multiply : function (matrix) {
		console.log('matrix multiplied');
	}
};

module.exports = Matrix3D;
