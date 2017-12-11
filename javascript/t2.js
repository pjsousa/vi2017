;(function(){
	var w = -1;
	var h = -1;
	var padding = 20;
	var xoffset = 30;
	var yoffset = 100;
	var xcutoff = 0;
	var ycutoff = 0;
	var max_names_len = 50;
	var top_rows = 15;

	var y_var = "Global_Sales";
	var x_var = "Name";

	var sort_var = "Global_Sales";

	var dispatch = d3.dispatch("gamehover", "gameout");

	var localstate = {
		datasetRows: [],
		selectedRows: [],
		highlightedRows: [],
		data_slices: {},
		clearbrush_quirk: null
	};

	var xdomain = null;
	var ydomain = null;
	var xrange = null;
	var yrange = null;
	var xscale = null;
	var yscale = null;

	var axis_0;
	var yaxis;
	var xaxis;

	var dataset;
	var rows_order;

	dispatch.on("gamehover.t2", function(d){
		mouse_coord = d3.mouse(this);

		appstate.highlightedRows.push(d);
		drawHighlightt2();
	});

	dispatch.on("gameout.t2", function(d){
		appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(d), 1);
		drawHighlightt2();
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

	// our (fnRV) local FuNction to Read Values for this vizualization
	function raw_value(row_num, variable){
		var result = null;

		result = data_utils.read_value(row_num, variable);

		return result;
	};

	function centered_value(row_num, variable){

		return raw_value(row_num, variable);
	};

	function value(row_num, variable){
		var result;
		var raw_v = raw_value(row_num, variable);
		result = raw_v;
		return result;
	};

	function drawHighlightt2(from_target){
		var row_nums = appstate.highlightedRows;
		
		var g = d3.selectAll("#t2Viz svg g.highlight");

		var circles = g.selectAll("rect.highlight")
			.data(row_nums);

		circles.enter()
			.append("rect")
				.attr("class", "highlight")
		circles.exit().remove();

		g.selectAll("rect.highlight")
			.attr("opacity", 1)
			.attr("fill","rgb(255,0,255)")
			.style("pointer-events", "none")
			.attr("x",function(d) {
				var i = dataset.indexOf(d);

				if(i == -1){
					return -1000;
				}

				return  xscale(rows_order[i]);
			})
			.attr("y", function(d, i) {
				var v = value(d, y_var);
				return yscale(v);
			})
			.attr("width", xscale.bandwidth())
			.attr("height", function(d, i) {
				var v = value(d, y_var);
				
				return yscale.range()[1] - yscale(v);
			})
			.attr("title", function(d) {return value(d, "Name"); })

		if(from_target == "t5"){
			// g.selectAll("circle.highlight")
			// 	.transition()
			// 	.duration(100)
			// 	.attr("r", r+10)

			// 	g.selectAll("circle.highlight")
			// 		.transition()
			// 		.delay(100)
			// 		.duration(100)
			// 		.attr("r", r+1)

			// g.selectAll("circle.highlight")
			// 	.transition()
			// 	.delay(200)
			// 	.duration(100)
			// 	.attr("r", r+10)

			// g.selectAll("circle.highlight")
			// 	.transition()
			// 	.delay(300)
			// 	.duration(100)
			// 	.attr("r", r+1)
		}
	};

	function setSizest2(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
		console.log(w,h);
	};

	function initt2(){
		var aux_order;

		dataset = localstate.datasetRows;

		aux_order = appstate.datasetRows.map(function(d){ return d; });
		aux_order = aux_order.sort(function(a,b){
			return value(b, y_var) - value(a, y_var);
		})
		aux_order = aux_order.slice(0, top_rows);

		rows_order = _.range(aux_order.length);

		if (sort_var == y_var){
			rows_order = rows_order.sort(function(a, b){ 
				var result;
				var v1 = value(aux_order[a], sort_var);
				var v2 = value(aux_order[b], sort_var);
				
				result = v2.localeCompare(v1);
				
				return result; })
		}

		dataset = aux_order;

		// 1) Settle the values for the x and y domains (this are the values in the data)
		ydomain = [];
		ydomain[0] = 1.05 * d3.max(dataset, function(d) { return parseFloat(raw_value(d, y_var)) });
		ydomain[1] = d3.min([0, 0.95 * d3.min(dataset, function(d) { return parseFloat(raw_value(d, y_var)) })]);

		xdomain = [];
		xdomain[0] = 0;
		xdomain[1] = top_rows;



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		yrange = [];
		yrange[0] = padding + ycutoff;
		yrange[1] = h - padding - yoffset;
		xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;



		// 3) Resizing the SVG
		// lets remove your image placeholder
		d3.select("#t2Viz > img")
			.remove();

		svg.attr("width",w)
			.attr("height",h);

		svg.selectAll("defs")
			.data([0])
			.enter().append("defs").append("clipPath")
				.attr("id","t2clip")
				.append("rect")
				.attr("x",xrange[0])
				.attr("y",yrange[0])
				.attr("width",xrange[1]-xrange[0])
				.attr("height",yrange[1]-yrange[0]);


		// 4) Creating the scales
		yscale = d3.scaleLinear();
		xscale = d3.scaleBand();

		yscale.domain(ydomain)
				.range(yrange);

		xscale.domain(d3.range.apply(null, xdomain))
			.range(xrange)
			.padding(0.1)



		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale);

		yaxis = d3.axisLeft()
			.scale(yscale);

		xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(top_rows);



		// X) Append group for Axis and background grid
		svg.selectAll("g.background")
			.data([0]).enter().append("g")
				.attr("class", "background");

		svg.selectAll("g.x.axis")
			.data([0]).enter().append("g")
				.attr("transform","translate(0," + axis_0["y"] + ")")
				.attr("class", "x axis")

		svg.selectAll("g.y.axis")
			.data([0]).enter().append("g")
				.attr("transform","translate("+ axis_0["x"] +",0)")
				.attr("class", "y axis");



		// X) Append group for data points grid
		svg.selectAll("g.datapoints")
			.data([0]).enter().append("g")
				.attr("class", "datapoints")
				.attr("clip-path","url(#t2clip)")



		// X) Append group for highlighting artifacts
		svg.selectAll("g.highlight")
			.data([0]).enter().append("g")
				.attr("class", "highlight")


		// X) Append group for catching events
		svg.selectAll("g.brush")
			.data([0]).enter().append("g")
				.attr("class", "brush");



		// draws the Y axis with text label
		svg.selectAll("text.y-axis-label")
			.attr("x", -yrange[0])
			.attr("y", xrange[0] - xoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Global Sales ( Million Units )")
	};

	function updatePlot(row_numbers){
		var aux_order;
		dataset = row_numbers;

		// update plot
		var t0 = svg.transition().duration(100);
		var t1 = svg.transition().delay(100).duration(500);


		aux_order = appstate.datasetRows.map(function(d){ return d; });
		aux_order = aux_order.sort(function(a,b){
			return value(b, y_var) - value(a, y_var);
		})
		aux_order = aux_order.slice(0, top_rows);

		rows_order = _.range(aux_order.length);

		if (sort_var == y_var){
			rows_order = rows_order.sort(function(a, b){ 
				var result;
				var v1 = value(aux_order[a], sort_var);
				var v2 = value(aux_order[b], sort_var);
				
				result = v2.localeCompare(v1);
				
				return result; })
		}

		dataset = aux_order;


		// 5) Create X and Y axis
		var gY = svg.select("g.y.axis")
			.transition(t0)
			.call(yaxis);

		// draws the X axis with text label
		var gX = svg.select("g.x.axis")
			.call(xaxis);

		gX.selectAll("text")
			.attr("class", "x tick")
			.attr("transform", "rotate(-40)")
			.style("text-anchor", "end")
			.text(function(d, i){ 
				var result = null;
				try{
					var game_name = raw_value(rows_order[i], x_var);
				}
				catch(e){
					var game_name = "";
				}

				result = _.truncate(game_name, {'length': max_names_len, 'omission': '...'});

				return result;
			})



		// 6) Create the background grid
		// Draw the Y grid
		svg.select("g.background").selectAll("line.y-grid")
			.data(yscale.ticks())
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("x2", xrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");
		svg.select("g.background").selectAll("line.y-grid")
			.data(yscale.ticks())
			.exit().remove()
		svg.select("g.background").selectAll("line.y-grid")
				.transition(t1)
				.attr("y1", function(d){ return yscale(d); })
				.attr("y2", function(d){ return yscale(d); })



		// 7) Plot the data itself
		// draws the plot itself
		svg.select("g.datapoints").selectAll("rect.data-point")
			.data(dataset)
			.enter().append("rect")
			.attr("class", "data-point")
			.attr("fill","rgb(0,127,255)")
			.attr("opacity", 1)
		svg.select("g.datapoints").selectAll("rect.data-point")
			.data(dataset)
			.exit().remove();
		svg.select("g.datapoints").selectAll("rect.data-point")
			.transition().duration(750)
			.attr("x",function(d, i) {
				return  xscale(rows_order[i]);
			})
			.attr("y", function(d, i) {
				var v = value(d, y_var);
				return yscale(v);
			})
			.attr("width", xscale.bandwidth())
			.attr("height", function(d, i) {
				var v = value(d, y_var);
				
				return yscale.range()[1] - yscale(v);
			})
			.attr("title", function(d) {return value(d, "Name"); })


			// 8) Overlay boxes over the plot to grab highlight events
			svg.select("g.brush").selectAll("rect.event-grabbers")
				.remove();
			svg.select("g.brush").selectAll("rect.event-grabbers")
				.data(dataset)
				.enter().append("rect")
				.attr("class", "event-grabbers")
				.attr("fill","rgba(200, 0, 200, 0.0)")
				.attr("x",function(d, i) {
					return  xscale(rows_order[i]);
				})
				.attr("width", xscale.bandwidth())
				.attr("y", yrange[0])
				.attr("height", yrange[1])
				.on("mouseover", function(d, i){
					// lets notify ourselves
					dispatch.call("gamehover", this, d);
					// and also the app. so that the linked views can change
					// for the app we also pass from were we hovered.
					appdispatch.gamehover.call("gamehover", this, d, "t2");
				})
				.on("mouseout", function(d){
					// lets notify ourselves
					dispatch.call("gameout", null, d);
					
					appdispatch.gameout.call("gameout", this, d, "t2");
				});
	};

	function drawt2(app_row_numbers, svgelement){
		if(typeof svgelement === "undefined"){
			svg = d3.selectAll("#t2Viz svg");
		}
		else{
			svg = d3.select(svgelement);
		}

		localstate.datasetRows = appstate.datasetRows.map(function(e){ return e; });

		initt2();

		updatePlot(localstate.datasetRows);
	};

	window.drawt2 = drawt2;
	window.setSizest2 = setSizest2;
	window.drawHighlightt2 = drawHighlightt2;
})();