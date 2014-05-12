var signals = require('../vendor/signals');
var FPS = require('./FPS');

function PerformanceTweaker(values) {
	this.parent(values);
	this.lastLoop = new Date;

	this.onChange = new signals.Signal();
};

PerformanceTweaker.prototype = {
	denominator: 1,
	degradeWhen: 15,
	upgradeWhen: 26,
	denominatorMax: 8,
	dirty: 0,
	updateFrequency: 5,
	changeFactor: 1.25,
	onChange: undefined,
	update: function(){
		FPS.update();

		if(this.dirty == 0) {
			if(FPS.fps <= this.degradeWhen) {
			  	this.denominator *= this.changeFactor;
				if(this.denominator <= this.denominatorMax) {
					this.makeDirty();
				  	//console.log("quality down");
				} else {
					this.denominator = this.denominatorMax;
				}
			} else if (FPS.fps >= this.upgradeWhen) {
				this.denominator /= this.changeFactor;
				if(this.denominator >= .99) {
					this.makeDirty();
				  	//console.log("quality up");
				} else {
					this.denominator = 1;
				}
			}
		}

		if(this.dirty > 0) {
			this.dirty--;
		}
	},
	makeDirty: function(){
	  	this.onChange.dispatch(1/this.denominator);
	  	this.dirty = this.updateFrequency;
	}
	});
	return PerformanceTweaker;
});