function makeGamma(pow) {
	pow = Math.min(8, Math.max(0.01, pow));
	return function(inVal) {
		return Math.pow(inVal, 1/pow);
	}
};
function sine(inVal) {
	return Math.sin(inVal * Math.PI - Math.PI * .5) * .5 + .5;
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
	console.log(str);
	return linear;
};
module.exports = {
	linear: linear,
	makeGamma: makeGamma,
	makeInvertedGamma: makeInvertedGamma,
	sine: sine,
	makeGammaSine: makeGammaSine,
	interpret: interpret
}