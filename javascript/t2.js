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

	var dispatch = d3.dispatch("gamehover");
	var dispatch2 = d3.dispatch("gameout");

	var isLogScale = false;
	var isCenteredData = false;

	var xscale = null;
	var yscale = null;
	// centered scales (<v> - mu / std)
	var xscale_c = null;
	var yscale_c = null;
	var x_mu = null;
	var x_std = null;
	var y_mu = null;
	var y_std = null;

	var dataset;
	var rows_order;


	dispatch.on("gamehover.t2", function(d){
		mouse_coord = d3.mouse(this);

		appstate.highlightedRows.push(d);
		drawHighlightt2();
	});

	dispatch2.on("gameout.t2", function(d){
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

		if(isLogScale){
			result["x"] = xrange[0];
			result["y"] = yrange[1];
		}
		else{
			result["x"] = xrange[0];
			result["y"] = yrange[1];
		}

		return result;
	};

	// our (fnRV) local FuNction to Read Values for this vizualization
	function raw_value(row_num, variable){
		var result = null;

		result = data_utils.read_value(row_num, variable);

		// if ([x_var, y_var].indexOf(variable) > -1){
		// 	if (isLogScale && !isCenteredData){
		// 		result = result <= 0 ? 1e-2 : result;
		// 	}
		// }

		return result;
	};

	function centered_value(row_num, variable){

		return raw_value(row_num, variable);
	};

	function value(row_num, variable){
		var result;
		var raw_v = raw_value(row_num, variable);

		// setle on the correct mean and st.deviation
		var _mu = x_var == variable ? x_mu : y_mu;
		var _std = x_var == variable ? x_std : y_std;
		
		if (isLogScale && isCenteredData){
			// we need to calculate the log ourselves and center it
			result = (Math.log(raw_v) - _mu) / _std;
		}
		else if(isLogScale && !isCenteredData){
			// we can just return the value since the d3.scaleLog will do the log for us.
			result = raw_v;
		}
		else if(!isLogScale && isCenteredData){
			// we just need to center it
			result = (raw_v - _mu) / _std;
		}
		else{
			result = raw_v;
		}

		return result;
	};

	function moveCrossair(row_num){

		d3.select("#t2Viz")
			.selectAll("line.y-crossair")
				.attr("y1", yscale_c(value(row_num, y_var)))
				.attr("y2", yscale_c(value(row_num, y_var)))

		d3.select("#t2Viz")
			.selectAll("line.x-crossair")
				.attr("x1", xscale_c(value(row_num, x_var)))
				.attr("x2", xscale_c(value(row_num, x_var)))

		drawHighlightt5();
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

				return  xscale_c(rows_order[i]);
			})
			.attr("y", function(d, i) {
				var v = value(d, y_var);
				return yscale_c(v);
			})
			.attr("width", xscale_c.bandwidth())
			.attr("height", function(d, i) {
				var v = value(d, y_var);
				
				return yscale_c.range()[1] - yscale_c(v);
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
	}

	function drawt2(){
		var aux_order;

		dataset = appstate.datasetRows

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
		var ydomain = [];
		ydomain[0] = 1.05 * d3.max(dataset, function(d) { return parseFloat(raw_value(d, y_var)) });
		ydomain[1] = d3.min([0, 0.95 * d3.min(dataset, function(d) { return parseFloat(raw_value(d, y_var)) })]);

		var xdomain = [];
		xdomain[0] = 0;
		xdomain[1] = dataset.length;



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		var yrange = [];
		yrange[0] = padding + ycutoff;
		yrange[1] = h - padding - yoffset;
		var xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;



		// 3) Resizing the SVG
		// lets remove your image placeholder
		d3.select("#t2Viz > img")
			.remove();

		var svg = d3.selectAll("#t2Viz svg")
			.attr("width",w)
			.attr("height",h);


		// 4) Creating the scales
		yscale = d3.scaleLinear();
		xscale = d3.scaleBand();

		yscale.domain(ydomain)
				.range(yrange);

		xscale.domain(d3.range.apply(null, xdomain))
			.range(xrange)
			.padding(0.1)

		yscale_c = yscale;
		xscale_c = xscale;

		// ^--- Creating the scales                                              //
		// Either way, centered or not, from now on we use yscale_c and xscale_c //
		//                                                                       //



		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		var axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale_c, yscale);

		var yaxis = d3.axisLeft()
			.scale(yscale_c);

		var xaxis = d3.axisBottom()
			.scale(xscale_c)
			.ticks(top_rows);

		// draws the Y axis with text label
		gY = svg.append("g")
		.attr("transform","translate("+ axis_0["x"] +",0)")  
		.attr("class","y axis")
		.call(yaxis);
		svg.append("text")
				.attr("class", "y-axis-label")
				.attr("transform", "rotate(-90)")
				.attr("x", -yrange[0])
				.attr("y", xrange[0] - xoffset)
				.attr("fill", "black")
				.style("text-anchor", "end")
				.text("Global Sales ( Million Units )")

		// draws the X axis with text label
		gX = svg.append("g")
		.attr("transform","translate(0," + axis_0["y"] + ")")
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

		// svg.append("text")
		// 	.attr("class", "x-axis-label")
		// 	.attr("x", xrange[1])
		// 	.attr("y", yrange[1] + yoffset)
		// 	.attr("fill", "black")
		// 	.style("text-anchor", "end")
		// 	.text("Top "+ top_rows +" Sellers");



		// 6) Create the background grid
		// Draw the Y grid
		svg.selectAll("line.y-grid")
			.data(yscale_c.ticks())
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("y1", function(d){ return yscale_c(d); })
				.attr("x2", xrange[1])
				.attr("y2", function(d){ return yscale_c(d); })
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");



		// 7) Plot the data itself
		// draws the plot itself
		svg.selectAll("rect.data-point")
			.data(dataset)
			.enter().append("rect")
			.attr("id", function(d){ return "d-t5-"+ d; })
			.attr("class", "data-point")
			.attr("opacity", 1)
			.attr("fill","rgb(0,127,255)")
			.style("cursor", "none")
			.attr("x",function(d, i) {
				return  xscale_c(rows_order[i]);
			})
			.attr("y", function(d, i) {
				var v = value(d, y_var);
				return yscale_c(v);
			})
			.attr("width", xscale_c.bandwidth())
			.attr("height", function(d, i) {
				var v = value(d, y_var);
				
				return yscale_c.range()[1] - yscale_c(v);
			})
			.attr("title", function(d) {return value(d, "Name"); })


			// 8) Overlay boxes over the plot to grab highlight events
			svg.selectAll("rect.event-grabbers")
				.remove();
			svg.selectAll("rect.event-grabbers")
				.data(dataset)
				.enter().append("rect")
				.attr("class", "event-grabbers")
				.attr("fill","rgba(200, 0, 200, 0.0)")
				.attr("x",function(d, i) {
					return  xscale_c(rows_order[i]);
				})
				.attr("width", xscale_c.bandwidth())
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
					dispatch2.call("gameout", null, d);
					
					appdispatch.gameout.call("gameout", this, d, "t2");
				});

			// Draw the group to highlight dots (as there are rownums in appstate.highlightedRows)
			// The dots themselves are added/removed latter in drawHighlightclv when the events fire.
			svg.selectAll("g.highlight")
				.data([0])
				.enter().append("g")
					.attr("class", "highlight");
	};

	window.drawt2 = drawt2;
	window.setSizest2 = setSizest2;
	window.drawHighlightt2 = drawHighlightt2;
})();