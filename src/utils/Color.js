var ColorUtils = {
	lerp: function(color1, color2, ratio) {
		var a1 = (color1 >> 24) & 0xff;
		var r1 = (color1 >> 16) & 0xff;
		var g1 = (color1 >> 8) & 0xff;
		var b1 = color1 & 0xff;
		var a2 = (color2 >> 24) & 0xff;
		var r2 = (color2 >> 16) & 0xff;
		var g2 = (color2 >> 8) & 0xff;
		var b2 = color2 & 0xff;
		
		//fun deviations from lerp
		var ratio2 = 1 - Math.pow(1 - ratio, 2);
		var ratio3 = 1 - Math.pow(1 - (Math.sin(ratio * Math.PI - Math.PI * .5) * .5 + .5), 2);
		var ratio4 = Math.pow(ratio, 2);

		return (~~(a1 + (a2 - a1) * ratio) << 24) |
			(~~(r1 + (r2 - r1) * ratio2) << 16) |
			(~~(g1 + (g2 - g1) * ratio3) << 8) |
			~~(b1 + (b2 - b1) * ratio4);
	},
	pretty: function (color) {
		var a = (color >> 24) & 0xff;
		var r = (color >> 16) & 0xff;
		var g = (color >> 8) & 0xff;
		var b = color & 0xff;
		return "A:"+a+" R:"+r+" G:"+g+" B:"+b;
	}
}
module.exports = ColorUtils;