function FPS() {
	this.lastTime = new Date;
	this.animationFrame = this.animationFrame.bind(this);
	requestAnimationFrame(this.animationFrame);
};

FPS.prototype = {
	filterStrength: 20,
	frameTime: 0,
	lastTime: 0,
	thisTime: 0,
	fps: 0,
	
	animationFrame: function() {
		this.update();
		requestAnimationFrame(this.animationFrame);
	},
	update: function(){
		this.thisTime = new Date;
		var thisFrameDuration = this.thisTime - this.lastTime;
		if(thisFrameDuration > 100) thisFrameDuration = 100;
		var delta = this.frameTime - thisFrameDuration;
		this.frameTime -= delta / this.filterStrength;
		this.lastTime = this.thisTime;
		this.fps = 1000 / this.frameTime;
	}
};

module.exports = new FPS();