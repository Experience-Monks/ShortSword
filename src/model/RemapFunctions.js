var RemapFunctions = {
	remapLinear : function (valIn) {
		return valIn;
	},
	remapRippleSine: function() {
		var range = 4;
		var rangeHalf = range * .5 - .5;
		var quickSinCurveLookupSteps = 1000;
		var quickSinCurveLookupTable = [];
		for (var i = 0; i < quickSinCurveLookupSteps; i++) {
			
			quickSinCurveLookupTable[i] = 1 - (Math.cos(i/quickSinCurveLookupSteps * Math.PI) * .5 + .5);
		};
		quickSinCurveLookupTable[quickSinCurveLookupSteps] = 1;
		function quickSinCurveLookup(valIn) {
			return quickSinCurveLookupTable[~~(valIn * quickSinCurveLookupSteps)];
		};
		return function (valIn) {
			return quickSinCurveLookup(Math.min(1, Math.max(0, valIn)));
		};
	}()
}

module.exports = RemapFunctions;