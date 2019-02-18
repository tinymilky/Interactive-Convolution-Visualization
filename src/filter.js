// global variable use here
// size of the filter
var filterSize = 3;
// fill format of the filter
// 0 is equal to normal
// 1 is fill with 0
var filterType = 0;
// the place to get svg library
// use to store value of origin matrix 
var imageWeb = "image_min/lena.jpg";
const divId = "content"

// the image's matrix
const input_Pic = {
	array: [],
	width: 0,
	height: 0
};
// use to store the input
var input = Object.create(input_Pic);
// use to store the filter
var filterArray;
// use to store output
var output;
// basic ui
function basic() {
	// load a image
	var canvas = document.createElement("canvas");
	var image = document.createElement("img");
	image.src = imageWeb;
	//when the image has been loaded, draw the whole ui
	image.onload = function() {
		canvas.width = image.width;
		canvas.height = image.height;
		let ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);
		var data = ctx.getImageData(0, 0, image.width, image.height).data;
		// get inputMatrix
		input.width = image.width;
		input.height = image.height;
		for(var i = 0; i < data.length; i=i+4) {
			var grayColor = parseInt((data[i] + data[i+1] + data[i+2])/3);
			input.array[parseInt(i/4)] = grayColor;
		}
		// load the input image
		var graph = d3.select("body")
					.append("div")
					.style("display", "flex");
		// build origin picture part
		var s1 = graph.append("div")
				 	  .attr("id", "leftGraph");
		buildPic("#leftGraph", input, 500, true);
		// build filter ui and selector
		var s2 = graph.append("div")
					  .attr("id", "middleGraph");
		var s2_1 = s2.append("div")
					  .attr("id", "middleFilter");
		buildFilter("#middleFilter", 300);
		addSelect("#middleGraph", 100);
		// build res picture part
		var s3 = graph.append("div")
					  .attr("id", "rightGraph");
		output = convolution();
		
		buildPic("#rightGraph", output, 500, false);
	}
}
// add selector to parentId, intervalSize is the distance between two selector
function addSelect(parentId, intervalSize) {
	var group = d3.select(parentId).append("div")
								   .style("display", "flex");
	
	var group1 = group.append("div")
					  .style("position", "relative")
		 			  .style("left", "20px")
	group1.append("p")
    	  .text("filter size")
	var select1 = group1.append("select")
			.attr("id", "select1")
		 	.on("change", changeSize);	
	select1.append("option")
		   .text("3x3");
	select1.append("option")
		   .text("5x5");
	
	var interval = group.append("div");
	interval.append("svg")
			.attr("width", intervalSize);
			
	var group2 = group.append("div")
					  
	group2.append("p")
		 .text("filter Type")
	var select2 = group2.append("select")
			.attr("id", "select2")
		 	.on("change", changeType);	
	select2.append("option")
		   .text("common");
	select2.append("option")
		   .text("filled");
}
// when filter size is changed
function changeSize() {
	//let index = obj.attr("selectedIndex");
	var select = d3.select("#select1");
	var state = select.property("value");
	
	if (state == "3x3") {
		filterSize = 3;
	}
	else {
		filterSize = 5;
	}
	// remove old part
	d3.select("#middleFilter").select("svg").remove();
	d3.select("#rightGraph").select("svg").remove();
	// update new part
	buildFilter("#middleFilter", 300);

	output = convolution();
	buildPic("#rightGraph", output, 500, false);

}
// when filter type has been changed
function changeType() {
	var select = d3.select("#select2");
	var state = select.property("value");
	
	if (state == "common") {
		filterType = 0;
	}
	else {
		filterType = 1;
	}
	// remove old part
	d3.select("#rightGraph").select("svg").remove();
	// update new part
	output = convolution();
	buildPic("#rightGraph", output, 500, false);
}
// build the image
function buildPic(parentId, content, size, isOrigin) {
	// sx, sy is the start position index of the photo
	let sx = 2;
	let sy = 2;
	// move the picture to the center
	if (input.width < input.height) {
		sx = 2 + parseInt((input.height - input.width)/2);
	}
	else {
		sy = 2 + parseInt((input.height - input.width)/2);
	}
	let eleSize = parseInt(size / (Math.max(input.width, input.height) + 4));
	
	let svg = d3.select(parentId).append("svg")
				.attr("width", size)
				.attr("height", size);
	// change number to related gray scale color
	let grayPixel = d3.scaleLinear()
					  .domain([0, 255])
					  .range(["black", "white"]);
	// for each pixel in origin image, draw an rect
	svg.selectAll("rect")
	   .data(content.array)
	   .enter()
	   		.append("rect")
	   		.attr("x", function(d, i) {return (sx + i % content.width) * eleSize;})
	   		.attr("y", function(d, i) {return (sy + parseInt(i / content.width)) * eleSize;})
	   		.attr("width", eleSize)
	   		.attr("height", eleSize)
	   		.attr("stroke", "red")
	   		.attr("stroke-width", Math.max(2, eleSize/10))
	   		.attr("stroke-opacity", 0)
	   		.attr("fill", function(d) {return grayPixel(d);});
	
	if (isOrigin == true) {

		svg.selectAll("rect")
		   .data(content.array)
		   .on("mouseover", function(d, i) {
		   		let part = parseInt(filterSize/2);
		   		let nx = i % input.width - part;
		   		let ny = parseInt(i / input.width) - part;
		   		let inputPix = svg.selectAll("rect")._groups[0];
		   		let filterGraph = d3.selectAll(".filterMatrix")._groups[0];
		   		let filterText = d3.selectAll(".filter")._groups[0];
		   		let resSvg = d3.select("#rightGraph").select("svg");
		   		let resGraph = resSvg.selectAll("rect")._groups[0];
		   		// get the start point of the draw picture
		   		if (filterType == 0) {
		   			nx = Math.max(nx, 0);
		   			nx = Math.min(nx, input.width-filterSize);
		   			ny = Math.max(ny, 0);
		   			ny = Math.min(ny, input.height-filterSize);
		   		}
		   		// show the mouse frame via stroke of the rect
		   		for(var i = 0; i < filterSize; ++i) {
		   			for(var j = 0; j < filterSize; ++j) {
		   				let val = 0;     // to store value of originPicture[ny+i][nx+j]
		   				if (ny + i < 0 || ny + i >= input.height || nx + j < 0 || nx + j >= input.width) {
		   					let rec = svg.append("rect")
		   								 .attr("class", "tempEdge")
		   								 .attr("x", (sx + nx + j) * eleSize)
		   								 .attr("y", (sy + ny + i) * eleSize)
		   								 .attr("width", eleSize)
		   								 .attr("height", eleSize)
		   								 .attr("fill-opacity", 0)
		   								 .attr("stroke", "red")
		   								 .attr("stroke-width", Math.max(2, eleSize/10));
		   				}
		   				else { 
		   					let rec = inputPix[(ny+i)*input.width + nx + j];
		   					let drec = d3.select(rec);
		   					drec.attr("stroke-opacity", 1); 
		   					val = input.array[(ny+i)*input.width + nx + j];
		   				}
		   				// update middleGraph
		   				let midRec = filterGraph[i*filterSize + j];
		   				let dmidRec = d3.select(midRec);
		   				dmidRec.attr("fill", grayPixel(val));
		   				dmidRec.attr("stroke", grayPixel(Math.min(val, 200)));
		   				let dmidText = d3.select(filterText[i*filterSize + j]);
		   				dmidText.text(val);
		   				if (val < 128) {
		   					dmidText.attr("fill", "white");
		   				}
		   				else {
		   					dmidText.attr("fill", "black");
		   				}
		   			}
		   		}
		   		if (filterType == 1) {
		   			nx = nx + part;
		   			ny = ny + part;
		   		}
		   		// update middleGraph
		   		let val = output.array[ny * output.width + nx];
		   		let dmidFin = d3.select(filterGraph[filterSize * filterSize]);
		   		dmidFin.attr("fill", grayPixel(val));
		   		let dmidFinText = d3.select(filterText[filterSize * filterSize]);
		  		dmidFinText.text(parseInt(val));
		   		if (val < 128) {
		   			dmidFinText.attr("fill", "white");
		   		}
		   		else {
		   			dmidFinText.attr("fill", "black");
		  		}
		   		// update rightGraph
		   		let drRect = d3.select(resGraph[ny * output.width + nx])
		   					   .attr("stroke-opacity", 1);
		   })
		   .on("mouseout", function(d, i) {
		   		let part = parseInt(filterSize/2);
		   		let nx = i % input.width - part;
		   		let ny = parseInt(i / input.width) - part;
		   		let inputPix = svg.selectAll("rect")._groups[0];
		   		let resSvg = d3.select("#rightGraph").select("svg");
		   		let resGraph = resSvg.selectAll("rect")._groups[0];
		   		if (filterType == 0) {
		   			nx = Math.max(nx, 0);
		   			nx = Math.min(nx, input.width-filterSize);
		   			ny = Math.max(ny, 0);
		   			ny = Math.min(ny, input.height-filterSize);
		   		}	
		   		else {
		   			// remove extra rect
		   			svg.selectAll(".tempEdge")
		   		   	   .remove()
		   		}
		   		for(var i = 0; i < filterSize; ++i) {
		   			for(var j = 0; j < filterSize; ++j) {
		   				if (ny + i < 0 || ny + i >= content.height || nx + j < 0 || nx + j >= content.width) {
		   					
		   				} 
		   				else {
		   					//let rec = svg.selectAll("rect")._groups[0][(ny+i)*content.width + nx + j];
		   					let rec = inputPix[(ny+i)*input.width + nx + j];
		   					let drec = d3.select(rec);
		   					drec.attr("stroke-opacity", 0);
		   				}
		   			}
		   		}
		   		// update rightGraph
		   		if (filterType == 1) {
		   			ny = ny + part;
		   			nx = nx + part;
		   		}
				let drRect = d3.select(resGraph[ny * output.width + nx])
		   					   .attr("stroke-opacity", 0);
		   })
	}
}
function buildFilter(parentId, size) {
	let eachSize = parseInt(size / (filterSize + (filterSize + 1)/2));
	let interval_width = parseInt(eachSize/2);
	let interval_height = interval_width;
	let svg = d3.select(parentId).append("svg")
				.attr("width", size)
				.attr("height", size + 50);
	filterArray = getFilter(filterSize);
	// draw filter's rect
	svg.selectAll("rect")
	   .data(filterArray)
	   .enter()
	   		.append("rect")
	   		.attr("class", "filterMatrix")
	   		.attr("x", function(d, i) {return interval_width + (i % filterSize) * (interval_width + eachSize); })
	   		.attr("y", function(d, i) {return parseInt(i / filterSize) * (interval_height + eachSize);})
	   		.attr("width", eachSize)
	   		.attr("height", eachSize)
	for(var i = 0; i < filterArray.length; ++i) {
		// add the text to the value of related origin image's pixel
		svg.append("text")
			.attr("class", "filter")
			.attr("x", parseInt(eachSize/2) + interval_width + (i % filterSize) * (interval_width + eachSize))
			.attr("y", parseInt(eachSize * 0.6) + parseInt(i / filterSize) * (interval_height + eachSize))
			.attr("text-anchor", "middle")
			.attr("fill", "white")
			.text("?")
		// add text to the related filter's value
		svg.append("text")
			.text("*" + filterArray[i])
			.attr("font-size", "0.9em")
			.attr("x", parseInt(eachSize/2) + interval_width + (i % filterSize) * (interval_width + eachSize))
			.attr("y", parseInt(eachSize * 1.3) + parseInt(i / filterSize) * (interval_height + eachSize))
			.attr("text-anchor", "middle")
	}
	// add + to it
	for(var i = 0; i < filterArray.length; ++i) {
		if (i == 0)
			continue;
		svg.append("text")
		   	.attr("x", parseInt(interval_width/2) + (i % filterSize) * (interval_width + eachSize))
			.attr("y", parseInt(eachSize * 0.6) + parseInt(i / filterSize) * (interval_height + eachSize))
			.attr("text-anchor", "middle")
			.attr("font-size", "1.1em")
			.text("+");
	}
	// add the rect of the result of the filter
	let cx = interval_width + parseInt(filterSize/2) * (interval_width + eachSize);
	let cy = size + 45 - eachSize;
	svg.append("rect")
	   .attr("class", "filterMatrix")
	   .attr("x", cx)
	   .attr("y", cy)
	   .attr("width", eachSize)
	   .attr("height", eachSize);

	svg.append("text")
		.attr("class", "filter")
		.attr("x", parseInt(eachSize/2) + cx)
		.attr("y", parseInt(eachSize * 0.6) + cy)
		.attr("text-anchor", "middle")
		.attr("fill", "white")
		.text("?")

	svg.append("text")
	    .attr("x", cx - eachSize)
        .attr("y", parseInt(eachSize * 0.6) + cy)
		.attr("text-anchor", "middle")
		.attr("font-size", "1.2em")
		.text("=");
}
// get the filter size of n * n
function getFilter(n) {
	var arrayX = new Array();
	for (var i = 0; i < n; ++i) {
		for(var j = 0; j < n; ++j) {
			arrayX[i*n + j] = Math.random();
		}
	}
	var total = d3.sum(arrayX)
	var t = 0.0
	for (var i = 0; i < arrayX.length; ++i) {
		t = arrayX[i]/total;
		// keep 4 decimal
		arrayX[i] = t.toFixed(4);
	}
	return arrayX;
}
// convolution between input.array and filterArray
function convolution() {
	var res = new Array();
	let array = input.array
	var arrayWidth = input.width;
	var arrayHeight = input.height
	var filterHeight = filterSize;
	var filterWidth = filterSize;
	var width = 0
	var height = 0
	if (filterType == 0) {
		width = arrayWidth - filterWidth + 1;
		height = arrayHeight - filterHeight + 1;
		for(var i = 0; i < height; ++i) {
			for(var j = 0; j < width; ++j) {
				res[i*width +j] = 0.0;
				for(var u = 0; u < filterHeight; ++u) {
					for(var v = 0; v < filterWidth; ++v) {
						res[i*width + j] += array[(i+u)*arrayWidth + j+v] * filterArray[u*filterWidth + v];
					}
				}
			}
		}
	}
	else if(filterType == 1) {
		// get the bias
		var bias = Math.floor(filterHeight/2);
		width = arrayHeight;
		height = arrayWidth;
		for(var i = 0; i < arrayHeight; ++i) {
			for(var j = 0; j < arrayWidth; ++j) {
				res[i*arrayWidth + j] = 0.0;
				for(var u = 0; u < filterHeight; ++u) {
					for(var v = 0; v < filterWidth; ++v) {
						if ((i-bias+u > -1) && (i-bias+u < arrayWidth) & (j-bias+v > -1) && (j-bias+v < arrayWidth)) {
							res[i*width + j] += array[(i-bias+u)*arrayWidth + j-bias+v] * filterArray[u*filterWidth + v];
						}
					}
				}
			}
		}
	}
	else {
		alert("Error to Build the array");
	}
	//console.log(res);
	var resMatrix = Object.create(input_Pic);
	resMatrix.array = res;
	resMatrix.width = width;
	resMatrix.height = height;
	return resMatrix;
}
addLoadEvent(basic);

