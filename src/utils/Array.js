module.exports = {

	/** Utility function to shuffle an array in place 
    (Fisher-Yates). */
    shuffle: function(array) {
        var counter = array.length, temp, index;
    
        // While there are elements in the array
        while (counter--) {
            // Pick a random index
            index = (Math.random() * counter) | 0;
    
            // And swap the last element with it
            temp = array[counter];
            array[counter] = array[index];
            array[index] = temp;
        }
    
        return array;
    },

    generateRandomOrder: function(length) {
        //fill an array with indices in order
        newOrder = new Array(length);
        for (var i = 0; i < length; i++) {
            newOrder[i] = i;
        };
        //shuffle the indices
        this.shuffle(newOrder);
        return newOrder;
    },

	orderlyScramble: function(array, newOrder) {
		var length = array.length;

		if(!newOrder) {
		  	newOrder = this.generateRandomOrder(length);
		}

		originalArray = array.slice(0);
		for (var i = 0; i < length; i++) {
			array[i] = originalArray[newOrder[i]];
		}
		return newOrder;
	}
}