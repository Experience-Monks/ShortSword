var ColorUtils = require('../../utils/Color');
var VoxelGradient = require('./VoxelGradient');

function VoxelGradientLerpMaterial(props) {
	props = props || {};

	props.colors = props.colors || [ 0xFFFF0000, 0xFF00FF00, 0xFF0000FF ];
	props.weights = props.weights;


	//if there were no times then we'll just go in and linearly set every colour
	if( props.weights === undefined ) {

		props.weights = [];

		for( var i = 0, len = props.colors.length; i < len; i++ ) {

			props.weights[ i ] = i / ( len - 1 );
		}
	} else {
		if(props.colors.length != props.weights.length) throw("You need an equal number of colors and weights to generate a gradient this way.");
	}

	props.colors = ColorUtils.sampleGradient( props.colors, props.weights, VoxelGradient.steps );

	VoxelGradient.call(this, props);
}

VoxelGradientLerpMaterial.prototype = Object.create( VoxelGradient.prototype );

module.exports = VoxelGradientLerpMaterial;