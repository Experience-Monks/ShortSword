function GlitchOffset(totalOffsets) {
	this.totalOffsets = totalOffsets ? totalOffsets : 1;
}

GlitchOffset.prototype = {
	apply: function(context, width, height) {
		for (var i = 0; i < this.totalOffsets; i++) {
			if(Math.random() > .25) continue;
			var x = ~~(Math.random() * width);
			var y = ~~(Math.random() * height);
			var w = ~~(Math.random() * (width * .7 - 20)) + 20;
			var h = ~~(Math.random() * (height * .1 - 5)) + 5;

			if ((x + w) > width) w -= (x + w) - width;
			if ((y + h) > height) h -= (y + h) - height;

			var offsetX = ~~(Math.random() * width * .1);
			var offsetY = ~~(Math.random() * height * .1);

			context.putImageData(context.getImageData(x, y, w, h), x+offsetX, y+offsetY);
		}
	}
}

module.exports = GlitchOffset;
