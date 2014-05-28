module.exports = {
	orderlyScramble: function(array, newOrder) {
		var length = array.length;
		if(!newOrder) {
			var order = [];
			for (var i = 0; i < length; i++) {
				order[i] = i;
			};

			newOrder = [];
			for (var i = 0; i < length; i++) {
				var randomIndex = ~~(Math.random() * order.length);
				newOrder[i] = order[randomIndex];
				order.splice(randomIndex, 1);
			};
		}

		originalArray = array.slice(0);
		for (var i = 0; i < length; i++) {
			array[i] = originalArray[newOrder[i]];
		}
		return newOrder;
	}
}