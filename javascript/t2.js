;(function(){
	var w = -1;
	var h = -1;
	var padding = 30;
	var xoffset = 40;
	var yoffset = 130;
	var xcutoff = 100;
	var ycutoff = 0;
	
	var xoffset_h = 20;
	var yoffset_h = 130;
	var xcutoff_h = 0;
	var ycutoff_h = 0;

	var max_names_len = 40;
	var top_rows = 10;

	var y_var = "Global_Sales";
	var x_var = "Name";

	var sort_var = "Global_Sales";

	var dispatch = d3.dispatch("gamehover", "gameout", "dropdowatt", "dropdowvals");

	var localstate = {
		datasetRows: [],
		drawnRows: [],
		selectedRows: [],
		highlightedRows: [],
		data_slices: {},
		clearbrush_quirk: null,
		dropdown_vals: []
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

	var initdropdowns_happenedonce = false;

	dispatch.on("gamehover.t2", function(d){
		mouse_coord = d3.mouse(this);

		appstate.highlightedRows.push(d);
		drawHighlightt2("t2");
	});

	dispatch.on("gameout.t2", function(d){
		appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(d), 1);
		drawHighlightt2("t2");
	});

	dispatch.on("dropdowatt", function(idx, value_str){
		value_str = value_str.split(" ").join("_");
		resetDropdownValues();
		slice_util.clearSlice(localstate.data_slices, "t2", "");
		slice_util.setSlice(localstate.data_slices, "t2", "", value_str, null)

		localstate.drawnRows = slice_util.sliceRows(localstate.data_slices, localstate.datasetRows);

		initt2();
		updatePlot(localstate.drawnRows);
	});

	dispatch.on("dropdowvals", function(idx, value_str){
		var current_dropdownatt = dropdown_util.read_atts(".t2Atts");
		slice_util.setSlice(localstate.data_slices, "t2", "", current_dropdownatt, value_str)
		
		d3.select("#cleart2")
			.style("visibility", "visible")
			.style("pointer-events", "all");

		localstate.drawnRows = slice_util.sliceRows(localstate.data_slices, localstate.datasetRows);

		initt2();
		updatePlot(localstate.drawnRows);
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

	function value(row_num, variable){
		var result;
		var raw_v = raw_value(row_num, variable);
		result = raw_v;
		return result;
	};

	function drawHighlightt2(from_target){
		var row_nums = appstate.highlightedRows;

		if(from_target != "t2"){
			updatePlot(localstate.drawnRows);
		}

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
				var i = rows_order.indexOf(d);

				if(i == -1){
					return -1000;
				}

				return  xscale(i);
			})
			.attr("y", function(d) {
				var i = rows_order.indexOf(d);

				if(i == -1){
					return -1000;
				}

				var v = value(d, y_var);

				return yscale(v);
			})
			.attr("width", xscale.bandwidth())
			.attr("height", function(d) {
				var i = rows_order.indexOf(d);

				if(i == -1){
					return 0;
				}

				var v = value(d, y_var);
				
				return yscale.range()[1] - yscale(v);
			})
			.attr("title", function(d) {return value(d, "Name"); });

		if(from_target != "t2"){
			updatePlotHighlight(row_nums.slice(0,1));
		}
	};

	function setSizest2(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
		console.log(w,h);
	};

	function localSlicet2(row_numbers, highlighted_row, rules){
		highlighted_row = typeof highlighted_row === "number" ? highlighted_row : appstate.highlightedRows[0];
		rules = rules || localstate.data_slices;

		var result;
		var current_dropdownatt = rules["t2"][0];
		var current_dropdownval = rules["t2"][1];
		var current_recordval;

		if(current_dropdownval !== null){
			result = datasources["index_"+current_dropdownatt].index[current_dropdownval]
			result = _.intersection(row_numbers, result);
		}
		else if(typeof highlighted_row !== "undefined"){
			current_recordval = raw_value(highlighted_row, current_dropdownatt);
			result = datasources["index_"+current_dropdownatt].index[current_recordval]
			result = _.intersection(row_numbers, result);
		}
		else{
			result = row_numbers;
		}

		return result;
	};

	function initDropdowns(){
		if(!initdropdowns_happenedonce){
			initdropdowns_happenedonce = true;

			resetDropdownValues();
			
			dropdown_util.setSelection_values('.t2Values', appstate.data_slices["t2"][1])

			dropdown_util.register_listener("#t2Atts", function(idx, value_str){
				dispatch.call("dropdowatt", null, idx, value_str);
			});

			dropdown_util.register_listener("#t2Values", function(idx, value_str){
				dispatch.call("dropdowvals", null, idx, value_str);
			});
		}
	};

	function resetDropdownValues(){
		var current_dropdownatt = dropdown_util.read_atts(".t2Atts");

		localstate.dropdown_vals = data_utils.get_uniquevalues_dataset(current_dropdownatt);
		dropdown_util.setValueList_values(".t2Values", localstate.dropdown_vals);
	};

	function syncdropdownt2_click(evt){
		var current_att = dropdown_util.read_atts(".t2Atts");
		var current_val = dropdown_util.read_values(".t2Values");

		syncdropdownt4(current_att, current_val);
		syncdropdownt6(current_att, current_val);

		evt.preventDefault();
	};

	function syncdropdownt2(att, value){
		dropdown_util.setSelection_atts(".t2Atts", att);
		resetDropdownValues();
		dropdown_util.setSelection_values(".valSelector", value);

		initt2();
		updatePlot(localstate.drawnRows);
	};

	function cleardropdownt2_click(evt){
		resetDropdownValues();

		var current_dropdownatt = dropdown_util.read_atts(".t2Atts");
		slice_util.clearSlice(localstate.data_slices, "t2", "")
		slice_util.setSlice(localstate.data_slices, "t2", "", current_dropdownatt, null);
		
		d3.select("#cleart2")
			.style("visibility", "hidden")
			.style("pointer-events", "none");

		localstate.drawnRows = slice_util.sliceRows(localstate.data_slices, localstate.datasetRows);

		initt2();
		updatePlot(localstate.drawnRows);

		evt.preventDefault();
	};

	function updatePanelHeader(){
		var current_att = dropdown_util.read_atts(".t2Atts");
		var current_val = dropdown_util.read_values(".t2Values");
		var result = "Best Sellers";
		var game_name;

		

		if (current_val){
			result = result + " in the " + current_val + " " + current_att
		}

		if ( dataset_h && dataset_h.length == 1){
			game_name = raw_value(dataset_h[0], "Name")
			game_name = _.truncate(game_name, {'length': max_names_len, 'omission': '...'});
			result = result + " vs " + game_name;
		}


		d3.select("#t2Panel .panel-heading small")
			.html(result);
	};

	function initt2(){
		var dataset = localstate.drawnRows;

		rows_order = data_utils.sortBy(dataset, y_var);
		rows_order = rows_order.slice(rows_order.length - top_rows, rows_order.length);
		rows_order = rows_order.reverse();

		if(sort_var == x_var){
			rows_order = data_utils.sortBy(dataset, sort_var);
		}



		// 1) Settle the values for the x and y domains (this are the values in the data)
		ydomain = [];
		ydomain[0] = 1.05 * d3.max(rows_order, function(d) { return parseFloat(raw_value(d, y_var)) });
		ydomain[1] = d3.min([0, 0.95 * d3.min(rows_order, function(d) { return parseFloat(raw_value(d, y_var)) })]);

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
				.attr("x",xrange[0]-10)
				.attr("y",yrange[0]-10)
				.attr("width",xrange[1]-xrange[0]+20)
				.attr("height",yrange[1]-yrange[0]+20);


		// 4) Creating the scales
		yscale = d3.scaleLinear();
		xscale = d3.scaleBand();
		yscale_h = d3.scaleLinear();
		xscale_h = d3.scaleBand();


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
		// for data
		svg.selectAll("g.background")
			.data([0]).enter().append("g")
				.attr("class", "background");

		svg.selectAll("g.x.axis")
			.data([0]).enter().append("g")
				.attr("transform","translate(0," + axis_0["y"] + ")")
				.attr("class", "x axis")
				.call(xaxis);


		svg.selectAll("g.y.axis")
			.data([0]).enter().append("g")
				.attr("transform","translate("+ axis_0["x"] +",0)")
				.attr("class", "y axis");

		// for the right highlight
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
				.attr("clip-path","url(#t2clip)")

		svg.selectAll("g.datapoints-h")
			.data([0]).enter().append("g")
				.attr("class", "datapoints-h");



		// X) Append group for highlighting artifacts
		svg.selectAll("g.highlight")
			.data([0]).enter().append("g")
				.attr("class", "highlight")
				.attr("clip-path","url(#t2clip)")



		// X) Append group for catching events
		svg.selectAll("g.brush")
			.data([0]).enter().append("g")
				.attr("class", "brush");



		// draws the Y axis with text label
		svg.selectAll("text.y-axis-label")
			.data([0])
			.enter().append("text")
			.attr("class", "y-axis-label")
			.attr("transform", "rotate(-90)")
			.attr("x", -yrange[0])
			.attr("y", xoffset - 10)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Global Sales ( Million Units )")
	};

	function updatePlot(row_numbers){
		dataset = row_numbers;

		var t0 = svg.transition().duration(100);
		var t1 = svg.transition().delay(100).duration(500);

		updatePanelHeader();

		rows_order = data_utils.sortBy(dataset, y_var);
		rows_order = rows_order.slice(rows_order.length - top_rows, rows_order.length);
		rows_order = rows_order.reverse();

		if(sort_var == x_var){
			rows_order = data_utils.sortBy(rows_order, sort_var);
		}

		// 1) Settle the values for the x and y domains (this are the values in the data)
		if( appstate.highlightedRows.length == 1 ){
			ydomain = [];
			ydomain[0] = 1.05 * d3.max(rows_order.concat(appstate.highlightedRows[0]), function(d) { return parseFloat(raw_value(d, y_var)) });
			ydomain[1] = d3.min([0, 0.95 * d3.min(rows_order.concat(appstate.highlightedRows[0]), function(d) { return parseFloat(raw_value(d, y_var)) })]);
		}
		else{
			ydomain = [];
			ydomain[0] = 1.05 * d3.max(rows_order, function(d) { return parseFloat(raw_value(d, y_var)) });
			ydomain[1] = d3.min([0, 0.95 * d3.min(rows_order, function(d) { return parseFloat(raw_value(d, y_var)) })]);
		}
		yscale.domain(ydomain);


		// 5) Create X and Y axis
		var gY = svg.select("g.y.axis")
			.transition(t0)
			.call(yaxis);

		// draws the X axis with text label
		var gX = svg.select("g.x.axis")
		gX.selectAll("text")
			.attr("class", "x tick")
			.attr("class", "x tick")
			.attr("transform", "rotate(-35)")
			.style("text-anchor", "end")
			.text(function(d, i){ 
				var result = null;
				try{
					var game_name = raw_value(rows_order[d], x_var);
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
			.exit().remove();
		svg.select("g.background").selectAll("line.y-grid")
				.transition(t1)
				.attr("y1", function(d){ return yscale(d); })
				.attr("y2", function(d){ return yscale(d); })



		// 7) Plot the data itself
		// draws the plot itself
		svg.select("g.datapoints").selectAll("rect.data-point")
			.data(rows_order)
			.enter().append("rect")
			.attr("class", "data-point")
			.attr("fill","rgb(0,127,255)")
			.attr("opacity", 1)
		svg.select("g.datapoints").selectAll("rect.data-point")
			.data(rows_order)
			.exit().remove();
		svg.select("g.datapoints").selectAll("rect.data-point")
			.transition().duration(750)
			.attr("x",function(d) {
				var i = rows_order.indexOf(d);

				if (i==-1){
					return -100000;
				}

				return  xscale(i);
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
				.data(rows_order)
				.enter().append("rect")
				.attr("class", "event-grabbers")
				.attr("fill","rgba(200, 0, 200, 0.0)")
				.attr("x",function(d){
					var i = rows_order.indexOf(d);

					if (i==-1){
						return -100000;
					}

					return  xscale(i);
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

	function updatePlotHighlight(row_numbers){
		var dataset = row_numbers;
		dataset_h = dataset;

		updatePanelHeader();

		// update plot
		var t0 = svg.transition().delay(100).duration(300);
		var t1 = svg.transition().duration(100);

		if(row_numbers.length !== 1){
			svg.select("g.datapoints-h").selectAll("rect.data-point")
				.transition(t1)
				.attr("y", yscale(0))
				.attr("height", 0)

			svg.select("g.x.axis-h").selectAll("text")
				.text("");
			return;
		}

		// 1) Settle the values for the x and y domains (this are the values in the data)
		
		var xdomain = [];
		xdomain[0] = 0;
		xdomain[1] = 1;



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		var yrange = [];
		yrange[0] = padding + ycutoff_h;
		yrange[1] = h - padding - yoffset_h;
		var xrange = [];
		xrange[0] = w - padding - xcutoff + xoffset_h;
		xrange[1] = w - padding - xcutoff_h;



		// 4) Creating the scales
		var xscale_h = d3.scaleBand();

		xscale_h.domain(d3.range.apply(null, xdomain))
			.range(xrange)
		// we'll reset the padding based on the proportion of the current bandwidth and the main chart's bandwith
		// so that they look the same.
		xscale_h.padding((1 - (xscale_h.bandwidth() - xscale.bandwidth()) / xscale_h.bandwidth()) * 2);



		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		var axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale_h, yscale);

		var xaxis = d3.axisBottom()
			.scale(xscale_h)
			.ticks(1);

		// 5) Create X and Y axis
		// var gY = svg.select("g.y.axis-h")
		// 	.attr("transform","translate("+ axis_0["x"] +",0)")
		// 	.transition(t0)
		// 	.call(yaxis);

		// draws the X axis with text label
		var gX = svg.select("g.x.axis-h")
			.attr("transform","translate(0," + axis_0["y"] + ")")

		if (gX.selectAll("text").empty()){
			gX.call(xaxis);
		}

		gX.selectAll("text")
			.attr("class", "x tick")
			.attr("transform", "rotate(-40)")
			.style("text-anchor", "end")
			.text(function(d, i){ 
				var result = null;
				try{
					var game_name = raw_value(dataset_h[i], x_var);
				}
				catch(e){
					var game_name = "";
				}

				result = _.truncate(game_name, {'length': max_names_len, 'omission': '...'});

				return result;
			})



		// 6) Create the background grid
		// Draw the Y grid
		svg.select("g.background-h").selectAll("line.y-grid")
			.data(yscale.ticks())
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("x2", xrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");
		svg.select("g.background-h").selectAll("line.y-grid")
			.data(yscale.ticks())
			.exit().remove()
		svg.select("g.background-h").selectAll("line.y-grid")
				.transition(t0)
				.attr("y1", function(d){ return yscale(d); })
				.attr("y2", function(d){ return yscale(d); })



		// 7) Plot the data itself
		// draws the plot itself
		svg.select("g.datapoints-h").selectAll("rect.data-point")
			.data(dataset)
			.enter().append("rect")
			.attr("class", "data-point")
			.attr("fill","rgb(255,0,255)")
			.attr("opacity", 1)
		svg.select("g.datapoints-h").selectAll("rect.data-point")
			.data(dataset)
			.exit().remove();
		svg.select("g.datapoints-h").selectAll("rect.data-point")
			.transition(t0)
			.attr("x",function(d, i) {
				return  xscale_h(i);
			})
			.attr("y", function(d, i) {
				var v = value(d, y_var);
				return yscale(v);
			})
			.attr("width", xscale_h.bandwidth())
			.attr("height", function(d, i) {
				var v = value(d, y_var);
				
				return yscale.range()[1] - yscale(v);
			})
			.attr("title", function(d) {return value(d, "Name"); })
	};

	function drawt2(app_row_numbers, svgelement){
		if(typeof svgelement === "undefined"){
			svg = d3.selectAll("#t2Viz svg");
		}
		else{
			svg = d3.select(svgelement);
		}

		localstate.datasetRows = app_row_numbers;
		localstate.drawnRows = localstate.datasetRows;

		initDropdowns();
		initt2();
		updatePlot(localstate.drawnRows);
	};

	localstate.data_slices = slice_util.slicerules_factory();

	window.drawt2 = drawt2;
	window.setSizest2 = setSizest2;
	window.drawHighlightt2 = drawHighlightt2;
	window.localSlicet2 = localSlicet2;
	window.syncdropdownt2 = syncdropdownt2;
	window.syncdropdownt2_click = syncdropdownt2_click;
	window.cleardropdownt2_click = cleardropdownt2_click;
})();