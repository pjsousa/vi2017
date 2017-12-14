;(function(){
	var w = -1;
	var h = -1;
	var padding = 20;
	var xoffset = 200;
	var yoffset = 40;
	var xcutoff = 0;
	var ycutoff = 0;
	var max_names_len = 50;
	var top_rows = 15;
	var r = 5;

	var y_var = "Name";
	var x_var = "Global_Sales";

	var sort_var = "Global_Sales";

	var dispatch = d3.dispatch("gamehover", "gameout");

	var localstate = {
		datasetRows: [],
		selectedRows: [],
		highlightedRows: [],
		data_slices: {},
		rows_order: []
	};

	var xdomain = null;
	var ydomain = null;
	var xrange = null;
	var yrange = null;
	var xscale = null;
	var yscale = null;

	var dataset;
	var rows_order;

	dispatch.on("gamehover.cleveland", function(d){
		mouse_coord = d3.mouse(this);

		appstate.highlightedRows.push(d);
		drawHighlightclv();
	});

	dispatch.on("gameout.cleveland", function(d){
		appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(d), 1);
		drawHighlightclv();
	});

	function axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale){
		/*
			if we agree on the current axis, we can deprecate this.
		 */
		
		var result = {
			x: null,
			y: null
		};

		result["x"] = xrange[0];
		result["y"] = yrange[1];

		return result;
	};

	function raw_value(row_num, variable){
		
		return data_utils.read_value(row_num, variable);
	};

	function value(row_num, variable){
		var result;
		var raw_v = raw_value(row_num, variable);
		result = raw_v;
		return result;
	};

	function sortCleveland(sortby){
		if(sortby == 'sales'){
			sort_var = x_var;
		}
		else{
			sort_var = y_var;
		}

		drawclv();
	};

	function drawHighlightclv(from_target){
		var row_nums = appstate.highlightedRows;
		
		var g = d3.selectAll("#clvViz svg g.highlight");

		var circles = g.selectAll("circle.highlight")
			.data(row_nums);

		circles.enter()
			.append("circle")
				.attr("class", "highlight")
		circles.exit().remove();

		g.selectAll("circle.highlight")
			.attr("r", r+1)
			.style("pointer-events", "none")
			.attr("fill", "fuchsia")
			.attr("cx", function(row_num){ return xscale(value(row_num, x_var))})
			.attr("cy", function(row_num){ 
				var i = dataset.indexOf(row_num);

				if(i == -1){
					return -1000;
				}

				return yscale(rows_order[i]); })

		if(from_target == "t5"){
			g.selectAll("circle.highlight")
				.transition()
				.duration(100)
				.attr("r", r+10)

				g.selectAll("circle.highlight")
					.transition()
					.delay(100)
					.duration(100)
					.attr("r", r+1)

			g.selectAll("circle.highlight")
				.transition()
				.delay(200)
				.duration(100)
				.attr("r", r+10)

			g.selectAll("circle.highlight")
				.transition()
				.delay(300)
				.duration(100)
				.attr("r", r+1)
		}
	};

	function setSizesclv(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
	};

	function initclv(){

	};

	function updatePlot(row_numbers){

	}

	function drawclv(app_row_numbers){
		var aux_order;

		dataset = app_row_numbers;

		aux_order = appstate.datasetRows.map(function(d){ return d; });
		aux_order = aux_order.sort(function(a,b){
			return value(b, x_var) - value(a, x_var);
		})
		aux_order = aux_order.slice(0, top_rows);

		rows_order = _.range(aux_order.length);

		if (sort_var == y_var){
			rows_order = rows_order.sort(function(a, b){ 
				var result;
				var v1 = value(aux_order[a], sort_var);
				var v2 = value(aux_order[b], sort_var);
				
				result = v1.localeCompare(v2);
				
				console.log(a,v1, b, v2, result)
				return result; })
		}

		dataset = aux_order;

		// 1) Settle the values for the x and y domains (this are the values in the data)
		var ydomain = [];
		ydomain[0] = 0
		ydomain[1] = top_rows - 1;
		var xdomain = [];
		xdomain[0] = 0.95 * d3.min(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });
		xdomain[1] = 1.05 * d3.max(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		var yrange = [];
		yrange[0] = padding + ycutoff;
		yrange[1] = h - padding - yoffset;
		var xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;



		// 3) Resizing the SVG
		// lets remove your image placeholder
		d3.select("#clvViz > img")
			.remove();

		var svg = d3.selectAll("#clvViz svg")
			.attr("width",w)
			.attr("height",h);


		// 4) Creating the scales
		yscale = d3.scaleLinear();
		xscale = d3.scaleLinear();
		
		yscale.domain(ydomain)
				.range(yrange);

		xscale.domain(xdomain)
			.range(xrange);

		yscale = yscale;
		xscale = xscale;


		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		var axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale);

		var yaxis = d3.axisLeft()
			.scale(yscale);

		var xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(10);



		// 6) Create the background grid
		// Draw the Y grid
		svg.selectAll("line.y-grid")
			.data(dataset)
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("y1", function(d, i){ return yscale(rows_order[i]); })
				.attr("x2", xrange[1])
				.attr("y2", function(d, i){ return yscale(rows_order[i]); })
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");

		// Draw the Y ticks and y label
		svg.selectAll("text.y-axis-tick")
			.data(dataset)
			.exit().remove();
		svg.selectAll("text.y-axis-tick")
			.data(dataset)
			.enter().append("text")
				.attr("class", "y-axis-tick")
				.attr("x", xrange[0])
				.attr("y", function(d,i){ return yscale(rows_order[i]); })
				.append("title")
					.html(function(d){ return raw_value(d, y_var) });
		svg.selectAll("text.y-axis-tick")
			.data(dataset)
				.transition()
				.duration(500)
				.attr("x", xrange[0])
				.attr("y", function(d,i){ return yscale(rows_order[i]); })
				.attr("dx", "-5px")
				.attr("dy", "1px")
				.attr("y", function(d,i){ return yscale(rows_order[i]); })
				.attr("fill", "black")
				.style("cursor", "default")
				.style("text-anchor", "end")
				.style("font-size", 10)
				.text(function(d, i){ 
					var result = null;
					var game_name = raw_value(d, y_var);

					result = _.truncate(game_name, {'length': max_names_len, 'omission': '...'});

					return result;
				})

		// Draw the X ticks and x label
		svg.selectAll("text.x-axis-tick")
			.data(xscale.ticks())
			.enter().append("text")
				.attr("class", "x-axis-tick")
				.attr("x", function(d){ return xscale(d) })
				.attr("y", yrange[1] + 25)
				.attr("fill", "black")
				.style("text-anchor", "middle")
				.style("font-size", 10)
				.text(function(d){ return d; });

		svg.selectAll("text.x-axis-label")
			.data([0])
			.enter().append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[1] + yoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Global Sales ( Million Units )");

		// (for completeness...) Draw the X zero
		svg.selectAll("line.x-grid-0")
			.data([1e-10])
			.enter().append("line")
				.attr("class", "x-grid-0")
				.attr("x1", function(d){ return xscale(d); })
				.attr("y1", yrange[0])
				.attr("x2", function(d){ return xscale(d); })
				.attr("y2", yrange[1])
				.attr("stroke-width", xdomain[0] < 0 ? 1 : 0) // but only show it when we really have data behind it
				.attr("stroke", "rgba(120,120,120,0.5)");
		


		// 7) Plot the data itself
		// draws the plot itself
		svg.selectAll("circle.data-points")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-clv-"+ rows_order[d]; })
			.attr("class", "data-points")
			.attr("cx", xrange[0])
			.attr("cy",function(d, i) {
				return yscale(rows_order[i]);
			})
		svg.selectAll("circle.data-points")
			.data(dataset)
			.exit().remove();
		svg.selectAll("circle.data-points")
			.data(dataset)
			.transition()
			.delay(500)
			.duration(500)
			.attr("r",r)
			.attr("fill","rgb(0,127,255)")
			.style("cursor", "none")
			.attr("cx",function(d, i) {
				var v = value(d, x_var);
				return  xscale(v);
			})
			.attr("cy",function(d, i) {
				return yscale(rows_order[i]);
			})



		// 8) Overlay boxes over the plot to grab highlight events
		svg.selectAll("rect.event-grabbers")
			.remove();
		svg.selectAll("rect.event-grabbers")
			.data(dataset)
			.enter().append("rect")
			.attr("class", "event-grabbers")
			.attr("fill","rgba(200, 200, 200, 0.0)")
			.attr("x",function(d){ return xrange[0]; } )
			.attr("width",function(d){ return xrange[1] - xrange[0]; } )
			.attr("y",function(d, i) { return yscale(rows_order[i]) - r; })
			.attr("height", 2*r)
			.on("mouseover", function(d, i){
				// lets notify ourselves
				dispatch.call("gamehover", this, d);
				// and also the app. so that the linked views can change
				// for the app we also pass from were we hovered.
				appdispatch.gamehover.call("gamehover", this, d, "clv");
			})
			.on("mouseout", function(d){
				// lets notify ourselves
				dispatch.call("gameout", null, d);
				
				appdispatch.gameout.call("gameout", this, d, "clv");
			});

		// Draw the group to highlight dots (as there are rownums in appstate.highlightedRows)
		// The dots themselves are added/removed latter in drawHighlightclv when the events fire.
		svg.selectAll("g.highlight")
			.data([0])
			.enter().append("g")
				.attr("class", "highlight");
	};

	window.drawclv = drawclv;
	window.setSizesclv = setSizesclv;
	window.drawHighlightclv = drawHighlightclv;
	window.sortCleveland = sortCleveland;

})();