;(function(){
	var w = -1;
	var h = -1;
	var padding = 30;
	var xoffset = 40;
	var yoffset = 30;
	var xcutoff = 40;
	var ycutoff = 0;
	var r = 2;
	var voronoiRadius = 30;

	var y_var = "Global_Sales";
	var x_var = "Mean_UserCritic_Score";

	var dispatch = d3.dispatch("gamehover", "gameout", "brushmove", "brushleave", "brushend");

	var localstate = {
		datasetRows: [],
		drawnRows: [],
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

	var voronoi = null;
	var last_hover = null;
	var quadtree = null;

	var svg;
	var brush;
	var zoom;


	dispatch.on("gamehover.scatterplot", function(d){
		mouse_coord = d3.mouse(this);

		localstate.highlightedRows.push(d);
		appstate.highlightedRows.push(d);

		moveCrossair(d);
		showDataTooltip(d, mouse_coord);
	});

	dispatch.on("gameout.scatterplot", function(d){
		localstate.highlightedRows.splice(localstate.highlightedRows.indexOf(d), 1);
		appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(d), 1);
		hideCrossair();
		hideDataTooltip(d);
	});

	dispatch.on("brushmove", function(){
		// get the current mouse position
		var coords = d3.mouse(this);

		var d = voronoi.find(coords[0], coords[1], voronoiRadius);

		if(d !== null){
			d = d.data;

			last_hover = d;
			
			if (appstate.highlightedRows.indexOf(d) == -1){
				dispatch.call("gameout", null, last_hover);
				dispatch.call("gamehover", this, d);
				
				appdispatch.gamehover.call("gamehover", this, d, "t5");
			}
		}
		else{
			d = last_hover
			
			dispatch.call("gameout", null, d);
			
			appdispatch.gameout.call("gameout", this, d, "t5");
		}
	});

	dispatch.on("brushleave", function(){
		d = last_hover
		// lets notify ourselves
		dispatch.call("gameout", null, d);
		
		appdispatch.gameout.call("gameout", this, d, "t5");
	});

	dispatch.on("brushend", function(){
		var selection = d3.event.selection;
		var brushedNodes = [];

		if (localstate.clearbrush_quirk){
			return;
		}

		if(selection){
			brushedNodes = vizutils.searchQuadtree_inrect(quadtree, selection, valueX, valueY)
		}

		// lets do zoom
		if (!selection) {
			//if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
			xscale.domain(xdomain);
			yscale.domain(ydomain);
			brushedNodes = localstate.datasetRows;
		} else {
			xscale.domain([selection[0][0], selection[1][0]].map(xscale.invert, xscale));
			yscale.domain([selection[0][1], selection[1][1]].map(yscale.invert, yscale));
			localstate.clearbrush_quirk = true;
			svg.select(".brush").call(brush.move, null);
			localstate.clearbrush_quirk = false;
		}

		localstate.drawnRows = brushedNodes;
		// global slice
		// slice_util.setSlice(appstate.data_slices, "t5", x_var, 
		// 										xscale.domain()[0], xscale.domain()[1])
		// slice_util.setSlice(appstate.data_slices, "t5", y_var, 
		// 										yscale.domain()[1], yscale.domain()[0])
		// local slice
		// slice_util.setSlice(localstate.data_slices, "t5", x_var, 
		// 										xscale.domain()[0], xscale.domain()[1])
		// slice_util.setSlice(localstate.data_slices, "t5", y_var, 
		// 										yscale.domain()[1], yscale.domain()[0])


		// ### X) Calculate Voronoi points
		voronoi = vizutils.processVoronoi(localstate.drawnRows, valueX, valueY, 
																		[xrange[0], yrange[0]], [xrange[1], yrange[1]])

		// ### X) generate a quadtree for faster lookups for brushing
		quadtree = vizutils.processQuadtree(localstate.drawnRows, valueX, valueY)

		// update plot
		updatePlot(localstate.datasetRows);

		appdispatch.dataslice.call("dataslice", this, "t5", localstate.drawnRows);
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

	function valueX(d, i){
		var v = value(d, x_var);
		return  xscale(v);
	};

	function valueY(d, i){
		var v = value(d, y_var);
		return yscale(v);
	};

	function moveCrossair(row_num){

		d3.select("#t5Viz")
			.selectAll("line.y-crossair")
				.attr("y1", yscale(value(row_num, y_var)))
				.attr("y2", yscale(value(row_num, y_var)))

		d3.select("#t5Viz")
			.selectAll("line.x-crossair")
				.attr("x1", xscale(value(row_num, x_var)))
				.attr("x2", xscale(value(row_num, x_var)))

		drawHighlightt5();
	};

	function drawHighlightt5(from_target){
		var row_nums = appstate.highlightedRows;
		
		var g = d3.selectAll("#t5Viz svg g.highlight");

		var circles = g.selectAll("circle.x-crossair.y-crossair")
			.data(row_nums);

		circles.enter()
			.append("circle")
				.attr("class", "x-crossair y-crossair")
				.attr("r", r+1)
		circles.exit().remove();

		g.selectAll("circle.x-crossair.y-crossair")
			.style("pointer-events", "none")
			.attr("fill", "fuchsia")
			.attr("cx", valueX)
			.attr("cy", valueY)

		if(["clv","t2"].indexOf(from_target) > -1){
			g.selectAll("circle.x-crossair.y-crossair")
				.transition()
				.duration(100)
				.attr("r", r+10)

				g.selectAll("circle.x-crossair.y-crossair")
					.transition()
					.delay(100)
					.duration(100)
					.attr("r", r+1)

			g.selectAll("circle.x-crossair.y-crossair")
				.transition()
				.delay(200)
				.duration(100)
				.attr("r", r+10)

			g.selectAll("circle.x-crossair.y-crossair")
				.transition()
				.delay(300)
				.duration(100)
				.attr("r", r+1)
		}
	};

	function hideCrossair(){
		d3.select("#t5Viz")
			.selectAll("line.y-crossair")
				.attr("y1", -10000)
				.attr("y2", -10000)

		d3.select("#t5Viz")
			.selectAll("line.x-crossair")
				.attr("x1", -10000)
				.attr("x2", -10000)

		drawHighlightt5();
	};

	function showDataTooltip(row_num, mouse_coord){

		d3.select("#t5Viz").
			selectAll("div.data-tooltip")
			.style("opacity", 1.0)
			.style("top", (mouse_coord[1]-5)+"px")    // no idea why the bad offsets...
			.style("left", (mouse_coord[0]+40)+"px")  // no idea why the bad offsets...
			.html(data_utils.read_value(row_num, "Name"));
	};

	function showAxisTooltips(row_num){
		// d3.select("#t5Viz").
		// 	selectAll("div.data-tooltip")
		// 	.style("opacity", 1.0)
		// 	.style("top", (d3.event.pageY-15)+"px")
		// 	.style("left", (d3.event.pageX+15)+"px")
		// 	.html(value(row_num, "Name"));
	};

	function hideDataTooltip(row_num){
		d3.select("#t5Viz").
			selectAll("div.data-tooltip")
			.style("opacity", 0);
	};

	function hideAxisTooltips(row_num){
		// d3.select("#t5Viz").
		// 	selectAll("div.data-tooltip")
		// 	.style("opacity", 1.0)
		// 	.style("top", (d3.event.pageY-15)+"px")
		// 	.style("left", (d3.event.pageX+15)+"px")
		// 	.html(value(row_num, "Name"));
	};

	function setSizest5(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
		console.log(w,h);
	};

	function initt5(){
		var dataset = localstate.datasetRows;

		// 1) Settle the values for the x and y domains (this are the values in the data)
		ydomain = [];
		ydomain[0] = 1.05 * d3.max(dataset, function(d){ return parseFloat(raw_value(d, y_var)); });
		ydomain[1] = 0.95 * d3.min(dataset, function(d){ return parseFloat(raw_value(d, y_var)); });;
		xdomain = [];
		xdomain[0] = 0.95 * d3.min(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });;
		xdomain[1] = 1.05 * d3.max(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		yrange = [];
		yrange[0] = padding;
		yrange[1] = h - padding - yoffset - ycutoff;
		xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;


		// 3) Resizing the SVG
		// lets remove your image placeholder
		d3.select("#t5Viz > img")
			.remove();

		svg.attr("width",w)
			.attr("height",h);

		svg.selectAll("defs")
			.data([0])
			.enter().append("defs").append("clipPath")
				.attr("id","t5clip")
				.append("rect")
				.attr("x",xrange[0])
				.attr("y",yrange[0])
				.attr("width",xrange[1]-xrange[0])
				.attr("height",yrange[1]-yrange[0]);



		// 4) Creating the scales
		yscale = d3.scaleLinear();
		xscale = d3.scaleLinear();

		yscale.domain(ydomain)
				.range(yrange);

		xscale.domain(xdomain)
			.range(xrange);


		// ### X) Calculate Voronoi points
		voronoi = vizutils.processVoronoi(dataset, valueX, valueY, 
																		[xrange[0], yrange[0]], [xrange[1], yrange[1]])

		// ### X) Create Brush for select+zoom
		brush = vizutils.initBrush_fullplot([xrange[0], yrange[0]], [xrange[1], yrange[1]])

		// ### X) generate a quadtree for faster lookups for brushing
		quadtree = vizutils.processQuadtree(dataset, valueX, valueY)



		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale);

		yaxis = d3.axisLeft()
			.scale(yscale);

		xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(10);



		// X) Append group for Axis and background grid
		svg.selectAll("g.background")
			.data([0]).enter().append("g")
				.attr("class", "background")
				.attr("clip-path","url(#t5clip)");

		svg.selectAll("g.x.axis")
			.data([0]).enter().append("g")
				.attr("transform", "translate(0," + axis_0["y"] + ")")
				.attr("class", "x axis")

		svg.selectAll("g.y.axis")
			.data([0]).enter().append("g")
				.attr("transform","translate("+ axis_0["x"] +",0)")
				.attr("class", "y axis");



		// X) Append group for data points grid
		svg.selectAll("g.datapoints")
			.data([0]).enter().append("g")
				.attr("class", "datapoints")
				.attr("clip-path","url(#t5clip)")



		// X) Append group for highlighting artifacts
		svg.selectAll("g.highlight")
			.data([0]).enter().append("g")
				.attr("class", "highlight")
				.attr("clip-path","url(#t5clip)")



		// X) Append group for catching events
		svg.selectAll("g.brush")
			.data([0]).enter().append("g")
				.attr("class", "brush")
				.call(brush);

		svg.selectAll("g.brush")
			.on("mousemove", function(){
				dispatch.call("brushmove", this);
			})
			.on("mouseleave", function(){
				dispatch.call("brushleave", this);
			});

		brush.on('end', function(){
			dispatch.call("brushend", this);
		});



		// draws the Y axis with text label
		svg.selectAll("text.y-axis-label")
			.data([0]).enter().append("text")
				.attr("class", "y-axis-label")
				.attr("transform", "rotate(-90)")
				.attr("x", -yrange[0])
				.attr("y", xrange[0] - xoffset)
				.attr("fill", "black")
				.style("text-anchor", "end")
				.text("Global Sales ( Million Units )")

		// draws the X axis with text label
		svg.selectAll("text.x-axis-label")
			.data([0]).enter().append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[1] + yoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Score ( / 100 )");


			// 9) Draw the hovering crossair
			// Draw the Y crossair
			svg.select("g.highlight").selectAll("line.y-crossair")
				.data([0])
				.enter().append("line")
					.attr("class", "y-crossair")
					.attr("stroke-dasharray", 3, 3)
					.attr("x1", xrange[0]) 
					.attr("y1", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("x2", xrange[1]) 
					.attr("y2", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("stroke-width", 1)
					.style("pointer-events", "none")
					.attr("stroke", "fuchsia");

			// Draw the X crossair
			svg.select("g.highlight").selectAll("line.x-crossair")
				.data([0])
				.enter().append("line")
					.attr("class", "x-crossair")
					.attr("stroke-dasharray", 3, 3)
					.attr("x1", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("y1", yrange[0]) 
					.attr("x2", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("y2", yrange[1]) 
					.attr("stroke-width", 1)
					.style("pointer-events", "none")
					.attr("stroke", "fuchsia");


			// 10) Place tooltips
			// Data tooltip
			d3.select("#t5Viz").selectAll("div.data-tooltip")
				.data([0])
				.enter().append("div")
					.attr("class", "data-tooltip")
					.style("position", "absolute")
					.style("z-index", "10")
					.style("opacity", 0)
					.style("border", "solid 3px rgba(0,0,0,0.7)")
					.style("background-color", "rgba(255,255,255,0.7)")
					.style("pointer-events", "none")
					.style("padding", "5px 10px")
	};

	function updatePlot(row_numbers){
		var dataset = row_numbers;

		// update plot
		var t0 = svg.transition().duration(100);
		var t1 = svg.transition().delay(100).duration(500);

		// 5) Create X and Y axis
		// draws the Y axis with text label
		var gY = svg.select("g.y.axis")
			.transition(t0)
			.call(yaxis);

		// draws the X axis with text label
		var gX = svg.select("g.x.axis")
			.transition(t0)
			.call(xaxis);

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

		// Draw the X grid
		svg.select("g.background").selectAll("line.x-grid")
			.data(xscale.ticks())
			.enter().append("line")
				.attr("class", "x-grid")
				.attr("y1", yrange[0])
				.attr("y2", yrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");
		svg.select("g.background").selectAll("line.x-grid")
			.data(xscale.ticks())
			.exit().remove()
		svg.select("g.background").selectAll("line.x-grid")
				.transition(t1)
				.attr("x1", function(d){ return xscale(d); })
				.attr("x2", function(d){ return xscale(d); })

		// Draw the Y zero
		svg.select("g.background").selectAll("line.y-grid-0")
			.data([1e-10])
			.enter().append("line")
				.attr("class", "y-grid-0")
				.attr("x1", xrange[0])
				.attr("x2", xrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.5)");
		svg.select("g.background").selectAll("line.y-grid-0")
				.transition(t1)
				.attr("y1", function(d){ return yscale(d); })
				.attr("y2", function(d){ return yscale(d); })

		// Draw the X zero
		svg.select("g.background").selectAll("line.x-grid-0")
			.data([1e-10])
			.enter().append("line")
				.attr("class", "x-grid-0")
				.attr("y1", yrange[0])
				.attr("y2", yrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.5)");
		svg.select("g.background").selectAll("line.x-grid-0")
				.transition(t1)
				.attr("x1", function(d){ return xscale(d); })
				.attr("x2", function(d){ return xscale(d); })



		// 7) Plot the data itself
		// draws the plot itself
		svg.select("g.datapoints").selectAll("circle.data-point")
			.data(dataset)
			.enter().append("circle")
				.attr("id", function(d){ return "d-t5-"+ d; })
				.attr("class", "data-point")
				.attr("r",r)
				.attr("opacity", 1)
				.attr("fill","rgb(0,127,255)")
				.style("cursor", "none")
				.transition(t1)
				.attr("title", function(d) {return value(d, "Name"); })
		svg.select("g.datapoints").selectAll("circle.data-point")
			.data(dataset)
			.exit().remove();
		svg.select("g.datapoints").selectAll("circle.data-point")
			.transition(t1)
			.attr("cx",valueX)
			.attr("cy",valueY)
	};

	function drawt5(app_row_numbers, svgelement){
		/*
			"Drawing t5" means:
	
				1) Settle the values for the x and y domains (this are the values in the data)
				2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
				3) Resizing the SVG
				4) Creating the scales
						- ( can either be linear or logarithmic and centered or not centered )

				[... start composing the viz ...]

				5) Create X and Y axis
				6) Create the background grid
					^-- which is composed by..
					.. an X Grid -> the vertical lines across the X axis
					.. a  Y Grid -> the horizontal lines across the Y axis
					.. a  Y Zero -> an horizontal line a bit thciker to indentify the Y origin when it doesn't match the plot axis
					.. an X Zero -> a vertical    line a bit thciker to indentify the X origin when it doesn't match the plot axis
				7) Plot the data itself
				8) Draw the regression line and the pearson's r value
				9) Draw the hovering crossair
					 ^-- which is composed by..
					 .. an X line
					 .. a  Y line
					 .. a group to place as many "phantom" dots as there are rownums in appstate.highlightedRows.
										^-- we use phantom dots instead of the real dots to help a bit when we have lots of occlusion.
				10) Place tooltips
					 .. For the data
					 .. For the X Axis
					 .. For the Y Axis

				The drawing is done (kinda) "once". The events, effects, highlights are just updating text, colors x's and y's.
				Unless we change the change the dataset behind the viz, we don't get back to this anymore.

				The frequency of the viz are the games themselves. This makes it easier, 
				since we have the same frequency as the raw data...
		 */
		
		if(typeof svgelement === "undefined"){
			svg = d3.selectAll("#t5Viz svg");
		}
		else{
			svg = d3.select(svgelement);
		}

		localstate.datasetRows = app_row_numbers;
		localstate.drawnRows = localstate.datasetRows

		initt5();

		updatePlot(localstate.datasetRows);
	};

	localstate.data_slices = slice_util.slicerules_factory();

	window.drawt5 = drawt5;
	window.setSizest5 = setSizest5;
	window.drawHighlightt5 = drawHighlightt5
})();