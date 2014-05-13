function FPS() {
	this.lastLoop = new Date;
	this.animationFrame = this.animationFrame.bind(this);
	requestAnimationFrame(this.animationFrame);
};

FPS.prototype = {
	filterStrength: 20,
	frameTime: 0,
	lastLoop: 0,
	thisLoop: 0,
	fps: 0,
	
	animationFrame: function() {
		this.update();
		requestAnimationFrame(this.animationFrame);
	},
	update: function(){
		var thisFrameTime = (this.thisLoop = new Date) - this.lastLoop;
		this.frameTime += (thisFrameTime - this.frameTime) / this.filterStrength;
		this.lastLoop = this.thisLoop;
		this.lastStep = 
		this.fps = 1000 / this.frameTime;
	}
};

module.exports = new FPS();