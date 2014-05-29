var RemapCurves = require('./RemapCurves');

bumpRotation = 0;

// var defaultRemapR = RemapCurves.makeGamma(2);
// var defaultRemapG = RemapCurves.makeGamma(1);
// var defaultRemapB = RemapCurves.makeGamma(.5);
module.exports = {
	lerp: function(color1, color2, ratio, remapR, remapG, remapB) {
		var a1 = (color1 >> 24) & 0xff;
		var r1 = (color1 >> 16) & 0xff;
		var g1 = (color1 >> 8) & 0xff;
		var b1 = color1 & 0xff;
		var a2 = (color2 >>> 24) & 0xff;
		var r2 = (color2 >> 16) & 0xff;
		var g2 = (color2 >> 8) & 0xff;
		var b2 = color2 & 0xff;

		return ((~~(a1 + (a2 - a1) * ratio)) << 24 |
			   (~~(r1 + (r2 - r1) * ratio)) << 16 |
			   (~~(g1 + (g2 - g1) * ratio)) << 8 |
			   ~~(b1 + (b2 - b1) * ratio)) >>> 0;

		
		//fun deviations from lerp
		// remapR = remapR || defaultRemapR;
		// remapG = remapG || defaultRemapG;
		// remapB = remapB || defaultRemapB;

		// var ratioR = remapR(ratio);
		// var ratioG = remapG(ratio);
		// var ratioB = remapB(ratio);

		// return (~~(a1 + (a2 - a1) * ratio) << 24) |
		// 	(~~(r1 + (r2 - r1) * ratioB) << 16) |
		// 	(~~(g1 + (g2 - g1) * ratioG) << 8) |
		// 	~~(b1 + (b2 - b1) * ratioR);
	},
	gradientColour: function( percentage, colours, weights ) {

		var startIdx = 0,
			endIdx = 1,
			startPerc = 0,
			endPerc = 0,
			ratio = 0,
			startColour = 0,
			endColour = 0,
			sa, ea, sr, er, sg, eg, sb, eb;

		for( var i = 0, len = weights.length; i < len; i++ ) {

			if( percentage > weights[ i ] ) {

				startIdx = i;
				endIdx = i + 1;
			} else {

				break;
			}
		}

		if( endIdx > weights.length - 1 ) 
			endIdx = weights.length - 1;

		startPerc = weights[ startIdx ];
		endPerc = weights[ endIdx ];
		startColour = colours[ startIdx ];
		endColour = colours[ endIdx ];

		ratio = ( percentage - startPerc ) / ( endPerc - startPerc );

		return this.lerp( startColour, endColour, ratio );
	},
	writeGradient: function( array, colours, weights ) {

		for( var i = 0, len = array.length, num = len - 1; i < len; i++ ) {

			array[ i ] = this.gradientColour( i / num, colours, weights );
		}
	},
	pretty: function (color) {
		var a = (color >> 24) & 0xff;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;
		return "A:"+a+" R:"+r+" G:"+g+" B:"+b;
	},
	applyGamma: function(color, gamma) {
		var invGamma = 1 / gamma;

		var a = ((color >> 24) & 0xff) / 255;
		var r = ((color >> 16) & 0xff) / 255;
		var g = ((color >> 8) & 0xff) / 255;
		var b = (color & 0xff) / 255;

		a = Math.pow(a, invGamma);
		r = Math.pow(r, invGamma);
		g = Math.pow(g, invGamma);
		b = Math.pow(b, invGamma);

		return (~~(a * 255) << 24) |
			(~~(r * 255) << 16) |
			(~~(g * 255) << 8) |
			~~(b * 255);

	},
	bump: function(color, rInt, gInt, bInt) {
		var a = (color >> 24) & 0xff;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;

		bumpRotation = (bumpRotation+1) % 3;
		switch(bumpRotation) {
			case 0: r = Math.min(255, r+1); break;
			case 1: g = Math.min(255, g+1); break;
			case 2: b = Math.min(255, b+1); break;
		};

		return (~~a << 24) |
			(~~r << 16) |
			(~~g << 8) |
			~~b;

	}
}