var CanvasGraph = require('./CanvasGraph');

function PerformanceGraph(props) {
	CanvasGraph.call(this, props);	
};

PerformanceGraph.prototype = Object.create(CanvasGraph.prototype);

module.exports = PerformanceGraph;