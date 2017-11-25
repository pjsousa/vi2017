;(function(){
	var w = -1;
	var h = -1;
	var padding = 20;
	var xoffset = 100;
	var yoffset = 40;
	var xcutoff = 0;
	var ycutoff = 0;
	var max_names_len = 18;
	var r = 5;

	var y_var = "Name";
	var x_var = "Global_Sales";

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

	var rows_order;

	dispatch.on("gamehover.scatterplot", function(d){
	});

	dispatch2.on("gameout.scatterplot", function(d){
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

	function raw_value(row_num, variable){
		
		return data_utils.read_value(row_num, variable);
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

	function setSizesclv(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
		console.log(w,h);
	}

	function drawclv(){
		var dataset = appstate.datasetRows.slice(0,30);

		rows_order = _.shuffle(_.range(dataset.length));

		// 1) Settle the values for the x and y domains (this are the values in the data)
		var ydomain = [];
		ydomain[0] = 0
		ydomain[1] = dataset.length -1;
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

		yscale_c = yscale;
		xscale_c = xscale;


		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		var axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale_c, yscale);

		var yaxis = d3.axisLeft()
			.scale(yscale_c);

		var xaxis = d3.axisBottom()
			.scale(xscale_c)
			.ticks(10);
		


		// 6) Create the background grid
		// Draw the Y grid
		svg.selectAll("line.y-grid")
			.data(dataset)
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("y1", function(d, i){ return yscale_c(rows_order[i]); })
				.attr("x2", xrange[1])
				.attr("y2", function(d, i){ return yscale_c(rows_order[i]); })
				.attr("stroke-width", 2)
				.attr("stroke", "rgba(120,120,120,1)");

		// Draw the Y ticks and y label
		svg.selectAll("text.y-axis-tick")
			.data(dataset)
			.enter().append("text")
				.attr("class", "y-axis-tick")
				.attr("x", xrange[0])
				.attr("y", function(d,i){ return yscale_c(rows_order[i]); })
				.attr("dx", "-5px")
				.attr("dy", "1px")
				.attr("y", function(d,i){ return yscale_c(rows_order[i]); })
				.attr("fill", "black")
				.style("cursor", "default")
				.style("text-anchor", "end")
				.style("font-size", 10)
				.text(function(d){ 
					var result = null;
					var game_name = raw_value(d, y_var);

					result = _.truncate(game_name, {'length': max_names_len, 'omission': '...'});

					return result;
				}).append("title")
					.html(function(d){ return raw_value(d, y_var) });

		// Draw the X grid
		svg.selectAll("line.x-grid")
			.data(xscale_c.ticks())
			.enter().append("line")
				.attr("class", "x-grid")
				.attr("x1", function(d){ return xscale_c(d); })
				.attr("y1", yrange[0])
				.attr("x2", function(d){ return xscale_c(d); })
				.attr("y2", yrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)")

		// Draw the X ticks and x label
		svg.selectAll("text.x-axis-tick")
			.data(xscale_c.ticks())
			.enter().append("text")
				.attr("class", "x-axis-tick")
				.attr("x", function(d){ return xscale_c(d) })
				.attr("y", yrange[1] + 25)
				.attr("fill", "black")
				.style("text-anchor", "middle")
				.style("font-size", 10)
				.text(function(d){ return d; });

		svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[1] + yoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Global Sales (Million Units)");

		// (for completeness...) Draw the X zero
		svg.selectAll("line.x-grid-0")
			.data([1e-10])
			.enter().append("line")
				.attr("class", "x-grid-0")
				.attr("x1", function(d){ return xscale_c(d); })
				.attr("y1", yrange[0])
				.attr("x2", function(d){ return xscale_c(d); })
				.attr("y2", yrange[1])
				.attr("stroke-width", xdomain[0] < 0 ? 1 : 0) // but only show it when we really have data behind it
				.attr("stroke", "rgba(120,120,120,0.5)");
		


		// 7) Plot the data itself
		// draws the plot itself
		svg.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-clv-"+ rows_order[d]; })
			.attr("r",r)
			.attr("fill","rgb(0,127,255)")
			.style("cursor", "none")
			.attr("cx",function(d, i) {
				var v = value(d, x_var);
				return  xscale_c(v);
			})
			.attr("cy",function(d, i) {
				return yscale_c(rows_order[i]);
			})
			.attr("title", function(d) {return value(d, "Name"); })
			.on("mouseover", function(d){
				// lets notify ourselves
				dispatch.call("gamehover", this, d);
				// and also the app. so that the linked views can change
				// for the app we also pass from were we hovered.
				appdispatch.gamehover.call("gamehover", this, d, "t5");
			})
			.on("mouseout", function(d){
				// lets notify ourselves
				dispatch2.call("gameout", null, d);
				
				appdispatch.gameout.call("gameout", this, d, "t5");
			});



			// 9) Overlay transparent boxes over the plot to grab events
			svg.selectAll("rect.event-grabbers")
				.data(xscale_c.ticks())
				.enter().append("rect")
				.attr("class", "event-grabbers")
				.attr("fill","rgb(255,127,0,0.5)")
				.style("cursor", "none")
				.attr("x",function(d){ return xscale_c(d); } )
				.attr("width",function(d){ return xscale_c(d); } )
				.attr("y",function(d, i) {  })
				.attr("height",function(d, i) {  })
				.on("mouseover", function(d){
					// lets notify ourselves
					dispatch.call("gamehover", this, d);
					// and also the app. so that the linked views can change
					// for the app we also pass from were we hovered.
					appdispatch.gamehover.call("gamehover", this, d, "t5");
				})
				.on("mouseout", function(d){
					// lets notify ourselves
					dispatch2.call("gameout", null, d);
					
					appdispatch.gameout.call("gameout", this, d, "t5");
				});





	};

	window.drawclv = drawclv;
	window.setSizesclv = setSizesclv;

})();