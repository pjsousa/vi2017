;(function(){

	var dispatch = d3.dispatch("gamehover");
	var selectedBar, selectedCircle;

	dispatch.on("gamehover.scatterplot", function(d){

		if(selectedCircle != null){
			selectedCircle.attr("fill", "purple");
		}

		selectedCircle = d3.select("#d-t5-"+d["row_num"]);
		selectedCircle.attr("fill", "red");
		console.log(typeof selectedCircle, "#d-t5-"+d["row_num"]);
	});

	function drawt5(){

		// our (fnRV) FuNction to Read Values...
		var _fnRv = data_utils.read_value;

		// FIXED SIZE FOR NOW
		var w = 400;
		var h = 300;

		var dataset = appstate.datasetRows;

		var padding = 40;
		var r = 1;

		var y_var = "Global_Sales";
		var x_var = "Mean_UserCritic_Score";

		var ydomain = [];
		ydomain[0] = d3.max(dataset, function(d){ return parseFloat(_fnRv(d, y_var)); });
		ydomain[1] = 0;
		var xdomain = [];
		xdomain[0] = 0;
		xdomain[1] = d3.max(dataset, function(d) { return parseFloat(_fnRv(d, x_var)) });
		
		var yrange = [];
		yrange[0] = padding;
		yrange[1] = h-padding;
		var xrange = [];
		xrange[0] = padding;
		xrange[1] = w-padding;

		// lets remove your image placeholder
		d3.select("#t5Viz > img")
			.remove();

		var svg = d3.select("#t5Viz")
			.append("svg")
			.attr("width",w)
			.attr("height",h);

		var hscale = d3.scaleLinear()
			.domain(ydomain)
			.range(yrange);

		var xscale = d3.scaleLinear()
		.domain(xdomain)
		.range(xrange);

		var yaxis = d3.axisLeft()
			.scale(hscale);

		var xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(10);

		// draws the Y axis with text label
		gY = svg.append("g")
		.attr("transform","translate("+ padding +",0)")  
		.attr("class","y axis")
		.call(yaxis)
			.append("text")
			  .attr("class", "label")
			  .attr("transform", "rotate(-90)")
			  .attr("y", -padding + 15)
			  .attr("x", -h/2)
			  .attr("fill", "black")
			  .style("text-anchor", "middle")
			  .text("Global Sales (Million Units)")

		// draws the X axis with text label
		gX = svg.append("g")
		.attr("transform","translate(0," + (h-padding) + ")")
		.call(xaxis)
		.append("text")
			.attr("class", "label")
			.attr("x", w / 2)
			.attr("y", padding)
			.attr("fill", "black")
			.style("text-anchor", "middle")
			.text("Score");
		
		// draws the plot itself
		svg.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-t5-"+ d; })
			.attr("r",r)
			.attr("fill","purple")
			.attr("cx",function(d, i) {
				var v = _fnRv(d, x_var);
				if (v <= 0) {return padding;}
				return  xscale(v);
			})
			.attr("cy",function(d) {
				var v = _fnRv(d, y_var);
				return hscale(v);
			})
			.attr("title", function(d) {return _fnRv(d, "Name"); })
			.on("mouseover", function(d){
				dispatch.call("gamehover", d, d);
			});
	};

	window.drawt5 = drawt5;
})();