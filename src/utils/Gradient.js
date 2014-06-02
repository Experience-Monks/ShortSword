var ColorUtils = require('./Color');
module.exports = {
	bump: function(gradient) {
		for (var i = 0, steps = gradient.length - 1; i < steps; i++) {
			gradient[i] = gradient[i+1];
		};
	},
	preventColor: function(gradient, clearColor) {
		var gradientSteps = gradient.length;
		//make sure the gradient doesn't include the clearColor
		if(gradient[0] == clearColor) {
			var clearColorBumpJustInCase = ColorUtils.bump(clearColor);
			
			for (var i = 0; i < gradientSteps; i++) {
				if(clearColor == gradient[i]) {
					gradient[i] = clearColorBumpJustInCase;
				}
			}
		}
	},
	makeUnique: function(gradient){
		//make sure no 2 colors are the same by bumping color a bit
		//this also makes all colors unique so you don't get color loops (though fun, not cool here)

		var gradientSteps = gradient.length;

		//step through the gradient and bump as we go to avoid repeated colors
		for (var i = 1; i < gradientSteps; i++) {
			if(gradient[i-1] == gradient[i]) {
				var bumped = ColorUtils.bump(gradient[i]);
				for (var j = i; j < gradientSteps; j++) {
					if(gradient[i-1] == gradient[j]) {
						gradient[j] = bumped;
					}
				}
			}
		}
	},
	pretty: function (gradient) {
		var string = "GRADIENT\n";
		var gradientSteps = gradient.length;
		for (var i = 1; i < gradientSteps; i++) {
			string += ColorUtils.pretty(gradient[i]) + "\n";
		}
		return string;
	},
};