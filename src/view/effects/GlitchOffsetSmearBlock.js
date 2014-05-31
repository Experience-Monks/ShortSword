function GlitchOffsetSmearBlock(totalSmears) {
	this.totalSmears = totalSmears ? totalSmears : 1;
}

GlitchOffsetSmearBlock.prototype = {
	apply: function(context, width, height) {
		for (var i = 0; i < this.totalSmears; i++) {
			if(Math.random() > .25) continue;
			var x = ~~(Math.random() * (width - 8));
			var y = ~~(Math.random() * (height - 8));
			var w = 8;
			var h = 8;

			var blockData = context.getImageData(x, y, w, h);

			var startX = ~~(x * Math.random());
			endX = width - ~~((width - x) * Math.random());
			for (var ix = startX; ix < endX; ix+=8) {
				context.putImageData(blockData, ix, y);
			}
		}
	}
}

module.exports = GlitchOffsetSmearBlock;
