// Script to run after the page loads


var margin = {top:10, right: 30, bottom: 30, left: 50},
    width = 1400 - margin.left - margin.right,
    height = 750 - margin.top - margin.bottom;

var padding = 30;

renderVisualization();


function renderVisualization() {

    d3.csv("http://localhost:8080/dataset.csv", function(d) {
    	//two values, url source and url target
    	return {
    		source : d.source,
    		target : d.target
    	};
    }).then(function(data) {
    	var fixedData = fixData(data);
    	generateCheckboxes(data, null);
    	generateVisualization(fixedData);
    	generateListeners(fixedData);
    });
}

function generateCheckboxes(data) {
	//Here we want to iterate through the source URLs and generate checkboxes for visualization
	var container = document.getElementById('urlSources');
	var dataset = [];
	for (var i = 0; i < data.length; i++) {
		if (!dataset.includes(data[i].source)) {
			dataset.push(data[i].source);
		}
	}

	var checked1 = 199;
	var checked2 = 2317;
	for (var i = 0; i < dataset.length; i++) {
		var div = document.createElement('div');
		div.id = "sourceURLdiv";
		var checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.id = 'sourceURL';
		checkbox.name = dataset[i];
		checkbox.value = dataset[i];
		if (i == checked1 || i == checked2) {
			checkbox.checked = true;
		}

		var label = document.createElement('label');
		label.htmlFor = dataset[i];
		label.appendChild(document.createTextNode(dataset[i]));

		var br = document.createElement('br');

		div.appendChild(checkbox);
		div.appendChild(label);
		div.appendChild(br);
		
		container.appendChild(div);
	}
}

function generateVisualization(data) {
	// first we have to "fix" our dataset. Currently we have it as a source and target, but
	// in order to do the force-directed layout, we need to seperate our dataset into nodes and edges.
	var dataset = checkedOnly(data);


	// TODO: have the source nodes be of blue color, destination nodes of red colors?

	var force = d3.forceSimulation(dataset.nodes)
				.force("charge", d3.forceManyBody())
				.force("link", d3.forceLink(dataset.edges))
				.force("center", d3.forceCenter().x(width/2).y(height/2));

	var colors = d3.scaleOrdinal(d3.schemeCategory10);

	var svg = d3.select("#dataviz");

	var g = svg.append("g")
		.attr("class", "everything");

	// TODO maybe: add a function to .style("stroke") so that the color of the edge
	// varies depending on the source node?
		var edges = g.append("g")
				.attr("class", "links")
				.selectAll("line")
				.data(dataset.edges)
				.enter()
				.append("line")
				.style("stroke", "#999")
				.style("stroke-width", 2);

	var nodes = g.append("g")
				.attr("class", "nodes")
				.selectAll("circle")
				.data(dataset.nodes)
				.enter()
				.append("circle")
				.attr("r", function(d) {
					if (d.source)
						return 10;
					return 5;
				})
				.style("fill", function(d, i) {
					return colors(i);
				})
				.call(d3.drag()
					.on("start", dragStarted)
					.on("drag", dragging)
					.on("end", dragEnded));


	var zoom_handler = d3.zoom()
    	.on("zoom", zoom_actions);

	zoom_handler(svg);   

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

	function zoom_actions(){
    	g.attr("transform", d3.event.transform)
	}

}

function fixData(data) {
	// passing in our dataset extracted from the CSV, it is in the form of sources and targets.
	// from that we have to set up the dataset so that it is nodes and edges.
	// this is necessary for the force directed graph in D3 (it wants specific formating for the dataset)
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

function checkedOnly(fixedData) {
	// we're assuming the dataset passed in is the formatted dataset, and here we want to just have the
	// data for the checked websites.

	var checkedNodes = [];
	var checkedEdges = [];
	var matches = document.querySelectorAll('input:checked');

	// first get all the nodes for the visualization from the selected source URLs and their targets
	for (var i = 0; i < matches.length; i++) {
		// iterate through the checked URLs, and add their nodes and edges to the curated dataset we're
		// returning
		var curURL = matches[i].value;

		// first we add the checked websites to the checkedNodes array.
		for (var k = 0; k < fixedData.nodes.length; k++) {
			if (fixedData.nodes[k].id == curURL) {
				var temp = fixedData.nodes[k];
				temp.source = true;
				checkedNodes.push(temp);
			}
		}
		// here we add the target nodes to the checkedNode array
		for (var k = 0; k < fixedData.edges.length; k++) {
			if (checkedNodes.includes(fixedData.nodes[fixedData.edges[k].source])) {
				var destCheck = fixedData.nodes[fixedData.edges[k].target];
				if (!checkedNodes.includes(destCheck)) {
					var temp = destCheck;
					temp.source = false;
					checkedNodes.push(temp);
				}
			}
		}

		// for the current checked website, after adding the source and destination nodes, we can add the edges based
		// on the checkedNodes indices
		for (var k = 0; k < fixedData.edges.length; k++) {
			var source = fixedData.nodes[fixedData.edges[k].source];
			var target = fixedData.nodes[fixedData.edges[k].target];

			var sourceVal = -1

			var destVal = -1;

			for (var j = 0; j < checkedNodes.length; j++) {
				if (checkedNodes[j].id == source.id)
					sourceVal = j;
				if (checkedNodes[j].id == target.id)
					destVal = j;
			}
			if (sourceVal >= 0 && destVal >= 0) {
				var obj = {};
				obj["source"] = sourceVal;
				obj["target"] = destVal;
				checkedEdges.push(obj);
			}
		}
	}

	var obj = {};
	obj["nodes"] = checkedNodes;
	obj["edges"] = checkedEdges;
	return obj;
}

function generateListeners(fixedData) {
	//searchbar functionality
	//TODO
	var match = document.querySelector('input#urlSearch');
	match.addEventListener("keyup", e => {
		searchCheckboxes(fixedData);
	});
	match.addEventListener("search", e => {
		searchCheckboxes(fixedData);
	});
	//checkbox functionality
	var matches = document.querySelectorAll('input#sourceURL');
	for (var i = 0; i < matches.length; i++) {
		matches[i].addEventListener("click", e => {
			updateVis(fixedData);
		})
	}
}

function searchCheckboxes(data) {
	var searchVal = document.querySelector('input#urlSearch').value;
	var filter = searchVal.toUpperCase();
	var elements = document.querySelectorAll('div#sourceURLdiv');
	console.log(elements);
	for (var i = 0; i < elements.length; i++) {
		var temp = elements[i].innerText.toUpperCase();
		if (temp.indexOf(filter) > -1) {
			console.log(elements[i]);
			elements[i].style.display = "";
		} else {
			elements[i].style.display = "none";
		}

	}
}

function updateVis(fixedData) {
	// this is called by the listeners
  	d3.select("#dataviz").selectAll("*").remove();
  	generateVisualization(fixedData);
}