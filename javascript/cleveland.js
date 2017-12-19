;(function(){
	var w = -1;
	var h = -1;
	var padding = 30;
	var xoffset = 200;
	var yoffset = 60;
	var xcutoff = 0;
	var ycutoff = 40;

	var xoffset_h = 200;
	var yoffset_h = 20;
	var xcutoff_h = 0;
	var ycutoff_h = 0;

	var max_names_len = 40;
	var top_rows = 15;
	var r = 5;

	var y_var = "Name";
	var x_var = "Global_Sales";

	var sort_var = "Global_Sales";

	var dispatch = d3.dispatch("gamehover", "gameout");

	var localstate = {
		datasetRows: [],
		drawnRows: [],
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
	var xscale_h = null;
	var yscale_h = null;

	var axis_0;
	var yaxis;
	var xaxis;

	var dataset;
	var dataset_h;
	var rows_order;

	var svg;

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

		drawclv(localstate.drawnRows);
	};

    function showInfo(){
        var modal = document.getElementById('myModal');
        var btn = document.getElementById("button-info-cleveland");
        var span = document.getElementsByClassName("close")[4];
        var text = document.getElementById("info-text");

        // When the user clicks on the button, open the modal 
        btn.onclick = function() {
            modal.style.display = "block";
            text.innerHTML = "This visualization ilustrates the top 15 best selling games, according to their global sales. You can sort the games by their name or by their sales numbers, by clicking the sort button at the top of the panel. The games displayed in this visualization change according to the selected games in other visualizations, or their choosen filters.";
        }

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
        
        
    }
    
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
			.attr("fill", "rgb(255, 86, 0)")
			.attr("cx", function(row_num){ return xscale(value(row_num, x_var))})
			.attr("cy", function(row_num){ 
				var i = rows_order.indexOf(row_num);

				if(i == -1){
					return -1000;
				}

				return yscale(i); })

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

		if(from_target != "clv"){
			updatePlotHighlight(row_nums.slice(0,1));
		}
	};

	function setSizesclv(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
	};

	function initclv(){
		dataset = localstate.drawnRows;

		rows_order = data_utils.sortBy(dataset, x_var);
		rows_order = rows_order.slice(rows_order.length - top_rows, rows_order.length);
		rows_order = rows_order.reverse();

		if(sort_var == y_var){
			rows_order = data_utils.sortBy(rows_order, sort_var);
		}



		// 1) Settle the values for the x and y domains (this are the values in the data)
		ydomain = [];
		ydomain[0] = 0
		ydomain[1] = top_rows - 1;
		xdomain = [];
		xdomain[0] = 0;
		xdomain[1] = 1.05 * d3.max(rows_order, function(d) { return parseFloat(raw_value(d, x_var)) });



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		yrange = [];
		yrange[0] = padding + ycutoff;
		yrange[1] = h - padding - yoffset;
		xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;



		// 3) Resizing the SVG
		// lets remove your image placeholder
		d3.select("#clvViz > img")
			.remove();

		svg = d3.selectAll("#clvViz svg")
			.attr("width",w)
			.attr("height",h);

		svg.selectAll("defs")
			.data([0])
			.enter().append("defs").append("clipPath")
				.attr("id","clvclip")
				.append("rect")
				.attr("x",xrange[0]-10)
				.attr("y",yrange[0]-10)
				.attr("width",xrange[1]-xrange[0]+20)
				.attr("height",yrange[1]-yrange[0]+20);



		// 4) Creating the scales
		yscale = d3.scaleLinear();
		xscale = d3.scaleLinear();
		yscale_h = d3.scaleLinear();
		xscale_h = d3.scaleLinear();
		
		yscale.domain(ydomain)
				.range(yrange);

		xscale.domain(xdomain)
			.range(xrange);

		yscale = yscale;
		xscale = xscale;


		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale);

		yaxis = d3.axisLeft()
			.scale(yscale);

		xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(10);



		// X) Append group for Axis and background grid
		// for data
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

		// for the bottom highlight
		svg.selectAll("g.background-h")
			.data([0]).enter().append("g")
				.attr("class", "background-h");

		svg.selectAll("g.x.axis-h")
			.data([0]).enter().append("g")
				.attr("class", "x axis-h")

		svg.selectAll("g.y.axis-h")
			.data([0]).enter().append("g")
				.attr("class", "y axis-h");



		// X) Append group for data points grid
		svg.selectAll("g.datapoints")
			.data([0]).enter().append("g")
				.attr("class", "datapoints")
				.attr("clip-path","url(#clvclip)")

		svg.selectAll("g.datapoints-h")
			.data([0]).enter().append("g")
				.attr("class", "datapoints-h");



		// X) Append group for highlighting artifacts
		svg.selectAll("g.highlight")
			.data([0]).enter().append("g")
				.attr("class", "highlight")



		// X) Append group for catching events
		svg.selectAll("g.brush")
			.data([0]).enter().append("g")
				.attr("class", "brush");



		// draws the X text label
		svg.selectAll("text.x-axis-label")
			.data([0])
			.enter().append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[0] - ycutoff)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Global Sales ( Million Units )");
	};

	function updatePlot(row_numbers){
		dataset = row_numbers;

		var t0 = svg.transition().duration(100);
		var t1 = svg.transition().delay(100).duration(500);

		rows_order = data_utils.sortBy(dataset, x_var);
		rows_order = rows_order.slice(rows_order.length - top_rows, rows_order.length);
		rows_order = rows_order.reverse();

		if(sort_var == y_var){
			rows_order = data_utils.sortBy(rows_order, sort_var);
		}

		// 6) Create the background grid
		// Draw the Y grid
		svg.select("g.background").selectAll("line.y-grid")
			.data(rows_order)
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("x2", xrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");
		svg.select("g.background").selectAll("line.y-grid")
			.data(rows_order)
			.exit().remove();
		svg.select("g.background").selectAll("line.y-grid")
			.transition(t1)
			.attr("y1", function(d, i){ return yscale(i); })
			.attr("y2", function(d, i){ return yscale(i); });


		// Draw the Y ticks and y label
		svg.select("g.background").selectAll("text.y-axis-tick")
			.data(rows_order)
			.exit().remove();
		svg.select("g.background").selectAll("text.y-axis-tick")
			.data(rows_order)
			.enter().append("text")
				.attr("class", "y-axis-tick")
				.attr("x", xrange[0])
				.attr("y", function(d, i){ return yscale(i); })
		svg.select("g.background").selectAll("text.y-axis-tick")
				.transition()
				.duration(500)
				.attr("x", xrange[0])
				.attr("y", function(d,i){ return yscale(i); })
				.attr("dx", "-5px")
				.attr("dy", "1px")
				.attr("y", function(d,i){ return yscale(i); })
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
		svg.select("g.background").selectAll("text.x-axis-tick")
			.remove();
		svg.select("g.background").selectAll("text.x-axis-tick")
			.data(xscale.ticks())
			.enter().append("text")
				.attr("class", "x-axis-tick")
				.attr("x", function(d){ return xscale(d) })
				.attr("y", yrange[0] - ycutoff + 20)
				.attr("fill", "black")
				.style("text-anchor", "middle")
				.style("font-size", 10)
				.text(function(d){ return d; });

		// (for completeness...) Draw the X zero
		svg.select("g.background").selectAll("line.x-grid-0")
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
		svg.select("g.datapoints").selectAll("circle.data-points")
			.data(rows_order)
			.enter().append("circle")
			.attr("id", function(d){ return "d-clv-"+ rows_order[d]; })
			.attr("class", "data-points")
			.attr("cx", xrange[0])
			.attr("cy",function(d, i) {
				return yscale(i);
			})
		svg.select("g.datapoints").selectAll("circle.data-points")
			.data(rows_order)
			.exit().remove();
		svg.select("g.datapoints").selectAll("circle.data-points")
			.data(rows_order)
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
				return yscale(i);
			})



		// 8) Overlay boxes over the plot to grab highlight events
		svg.select("g.brush").selectAll("rect.event-grabbers")
			.remove();
		svg.select("g.brush").selectAll("rect.event-grabbers")
			.data(rows_order)
			.enter().append("rect")
			.attr("class", "event-grabbers")
			.attr("fill","rgba(200, 200, 200, 0.0)")
			.attr("x",function(d){ return xrange[0]; } )
			.attr("width",function(d){ return xrange[1] - xrange[0]; } )
			.attr("y",function(d, i) { return yscale(i) - r; })
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
	};

	function updatePlotHighlight(row_numbers){
		var dataset = row_numbers;
		dataset_h = dataset;

		//updatePanelHeader();

		// update plot
		var t0 = svg.transition().delay(100).duration(300);
		var t1 = svg.transition().duration(100);

		if(row_numbers.length !== 1){
			svg.select("g.datapoints-h").selectAll("circle.data-points")
				.transition(t1)
				.remove();

			svg.select("g.background-h").selectAll("text")
				.text("");
			return;
		}

		// 1) Settle the values for the x and y domains (this are the values in the data)
		ydomain = [];
		ydomain[0] = 0
		ydomain[1] = 1;

		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		var yrange = [];
		yrange[0] = h - padding - ycutoff + yoffset_h
		yrange[1] = h - padding - ycutoff_h
		var xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;



		// 4) Creating the scales
		var yscale_h = d3.scaleBand();

		yscale_h.domain(d3.range.apply(null, ydomain))
			.range(yrange)

		// 6) Create the background grid
		// Draw the Y grid
		svg.select("g.background-h").selectAll("line.y-grid")
			.data(dataset_h)
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("x2", xrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");
		svg.select("g.background-h").selectAll("line.y-grid")
			.data(dataset_h)
			.exit().remove();
		svg.select("g.background-h").selectAll("line.y-grid")
			.transition(t1)
			.attr("y1", function(d, i){ return yscale_h(i); })
			.attr("y2", function(d, i){ return yscale_h(i); });

		// Draw the Y ticks and y label
		svg.select("g.background-h").selectAll("text.y-axis-tick")
			.data(dataset_h)
			.exit().remove();
		svg.select("g.background-h").selectAll("text.y-axis-tick")
			.data(dataset_h)
			.enter().append("text")
				.attr("class", "y-axis-tick")
				.attr("x", xrange[0])
				.attr("y", function(d, i){ return yscale_h(i); })
		svg.select("g.background-h").selectAll("text.y-axis-tick")
				.transition()
				.duration(500)
				.attr("x", xrange[0])
				.attr("y", function(d,i){ return yscale_h(i); })
				.attr("dx", "-5px")
				.attr("dy", "1px")
				.attr("y", function(d,i){ return yscale_h(i); })
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


		// 7) Plot the data itself
		// draws the plot itself
		svg.select("g.datapoints-h").selectAll("circle.data-points")
			.data(dataset_h)
			.enter().append("circle")
			.attr("id", function(d){ return "d-clv-"+ dataset_h[d]; })
			.attr("class", "data-points")
			.attr("cx", xrange[0])
			.attr("cy",function(d, i) {
				return yscale_h(i);
			})
		svg.select("g.datapoints-h").selectAll("circle.data-points")
			.data(dataset_h)
			.exit().remove();
		svg.select("g.datapoints-h").selectAll("circle.data-points")
			.data(dataset_h)
			.transition()
			.delay(500)
			.duration(500)
			.attr("r",r)
			.attr("fill","rgb(255, 86, 0)")
			.style("cursor", "none")
			.attr("cx",function(d, i) {
				var v = value(d, x_var);
				return  xscale(v);
			})
			.attr("cy",function(d, i) {
				return yscale_h(i);
			})
	};

	function drawclv(app_row_numbers, svgelement){
		if(typeof svgelement === "undefined"){
			svg = d3.selectAll("#t2Viz svg");
		}
		else{
			svg = d3.select(svgelement);
		}

		localstate.datasetRows = app_row_numbers;
		localstate.drawnRows = localstate.datasetRows;

		initclv();
		updatePlot(localstate.drawnRows);
        showInfo();
	};

	localstate.data_slices = slice_util.slicerules_factory();

	window.drawclv = drawclv;
	window.setSizesclv = setSizesclv;
	window.drawHighlightclv = drawHighlightclv;
	window.sortCleveland = sortCleveland;

})();