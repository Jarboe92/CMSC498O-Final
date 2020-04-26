// Script to run after the page loads


var margin = {top:10, right: 30, bottom: 30, left: 50},
    width = 1400 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

var padding = 30;

renderVisualization();


function renderVisualization() {

    d3.csv("http://localhost:8080/temp.csv", function(d) {
    	//two values, url source and url target
    	return {
    		source : d.source,
    		target : d.target
    	};
    }).then(function(data) {
    	generateCheckboxes(data);
    	generateVisualization(data);
    	generateListeners();
    });
}

function generateCheckboxes(data) {
	//Here we want to iterate through the source URLs and generate checkboxes for visualization
	var dataset = fixData(data);
	for (var i = 0; i < dataset.nodes.length; i++) {
		var checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = 'sourceURL';
		checkbox.name = dataset.nodes[i].id;
		checkbox.value = dataset.nodes[i].id;

		var label = document.createElement('label');
		label.htmlFor = dataset.nodes[i];
		label.appendChild(document.createTextNode(dataset.nodes[i].id));

		var br = document.createElement('br');

		var container = document.getElementById('urlSources');
		container.appendChild(checkbox);
		container.appendChild(label);
		container.appendChild(br);
	}
}

function generateVisualization(data) {
	// first we have to "fix" our dataset. Currently we have it as a source and target, but
	// in order to do the force-directed layout, we need to seperate our dataset into nodes and edges.
	var dataset = fixData(data);

	var force = d3.forceSimulation(dataset.nodes)
				.force("charge", d3.forceManyBody())
				.force("link", d3.forceLink(dataset.edges))
				.force("center", d3.forceCenter().x(width/2).y(height/2));

	var colors = d3.scaleOrdinal(d3.schemeCategory10);

	var svg = d3.select("#dataviz");

	var edges = svg.selectAll("line")
				.data(dataset.edges)
				.enter()
				.append("line")
				.style("stroke", "#999")
				.style("stroke-width", 2);

	var nodes = svg.selectAll("circle")
				.data(dataset.nodes)
				.enter()
				.append("circle")
				.attr("r", 10)
				.style("fill", function(d, i) {
					return colors(i);
				})
				.call(d3.drag()
					.on("start", dragStarted)
					.on("drag", dragging)
					.on("end", dragEnded));

	nodes.append("title")
		.text(function(d) {
			return d.id;
		});

	force.on("tick", function() {
		edges.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		nodes.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	});

	function dragStarted(d) {
		if (!d3.event.active) force.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragging(d) {
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}

	function dragEnded(d) {
		if (!d3.event.active) force.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}

}

function fixData(data) {
	// passing in our dataset extracted from the CSV, it is in the form of sources and targets.
	// from that we have to set up the dataset so that it is nodes and edges.
	var nodes = [];
	var temp = [];
	var edges = [];
	var temp2 = [];

	for (var i = 0; i < data.length; i++) {
		if (!temp.includes(data[i].source))
			temp.push(data[i].source);
		if (!temp.includes(data[i].target))
			temp.push(data[i].target);
	}

	for (var i = 0; i < temp.length; i++) {
      var obj = {};
      obj["id"] = temp[i];
      nodes.push(obj);
	}

	for (var i = 0; i < data.length; i++) {
		var obj = {};
		obj["source"] = data[i].source;
		obj["target"] = data[i].target;
		edges.push(obj); 
	}

	for (var i = 0; i < edges.length; i++) {
		var sourceVal, destVal;
		for (k = 0; k < nodes.length; k++) {
			if (nodes[k].id == edges[i].source)
				sourceVal = k;
			if (nodes[k].id == edges[i].target)
				destVal = k;
		}
		var obj = {};
		obj["source"] = sourceVal;
		obj["target"] = destVal;
		temp2.push(obj);
	}

	var obj = {};
	obj["nodes"] = nodes;
	obj["edges"] = temp2;
	return obj;
}

function generateListeners() {
	// here we generate the listeners for the searchbar functionality, and updating the
	// visualization with the new URL's checked
}