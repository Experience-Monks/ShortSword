function makeGamma(pow) {
	pow = Math.min(8, Math.max(0.01, pow));
	return function(inVal) {
		return Math.pow(inVal, 1/pow);
	}
};
function sine(inVal) {
	return Math.sin(inVal * Math.PI - Math.PI * .5) * .5 + .5;
};
function makePowerSine(pow) {
	return function(inVal) {
		for (var i = 0; i < pow; i++) {
			inVal = sine(inVal);
		};
		return inVal;
	}
};
function cosine(inVal) {
	return inVal + inVal - (Math.sin(inVal * Math.PI - Math.PI * .5) * .5 + .5);
};
function makePowerCosine(pow) {
	return function(inVal) {
		for (var i = 0; i < pow; i++) {
			inVal = cosine(inVal);
		};
		return inVal;
	}
};
function makeInvertedGamma(pow) {
	var gamma = makeGamma(pow);
	return function(inVal) {
		return 1 - gamma(inVal);
	}
};
function makeGammaSine(pow) {
	var gamma = makeGamma(pow);
	return function(inVal) {
		return gamma(sine(inVal));
	}
};
function linear(inVal) {
	return inVal;
};
function interpret(str){
	
	return linear;
};
module.exports = {
	linear: linear,
	makeGamma: makeGamma,
	makeInvertedGamma: makeInvertedGamma,
	sine: sine,
	makePowerSine: makePowerSine,
	cosine: cosine,
	makePowerCosine: makePowerCosine,
	makeGammaSine: makeGammaSine,
	interpret: interpret
}