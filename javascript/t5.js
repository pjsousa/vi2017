;(function(){

	var w = -1;
	var h = -1;
	var padding = 20;
	var xoffset = 30;
	var yoffset = 30;
	var xcutoff = 30;
	var ycutoff = 0;
	var r = 2;
	var voronoiRadius = 30;

	var y_var = "Global_Sales";
	var x_var = "Mean_UserCritic_Score";

	var dispatch = d3.dispatch("gamehover");
	var dispatch2 = d3.dispatch("gameout");

	var xscale = null;
	var yscale = null;
	var x_mu = null;
	var x_std = null;
	var y_mu = null;
	var y_std = null;

	var voronoi = null;
	var last_hover = null;
	var quadtree;

	var brush;
	var zoom;
	var clearbrush_quirk;

	function compute_personsr_linregress(row_nums){
		/*
			@TODO: Talvez mudar isto daqui para ser genérico entre qualquer par de colunas?

			Por um lado, isto deviam ser 2 funções:
				- compute pearson's r (a correlação)
				- compute linear regression (o declive + o corte na origem)

			Pelo outro, os cálculos iniciais são os mesmos... 

			Para não fazer os 2 cálculos 2 vezes, juntámos ambos os na mesma funcção.

			Usámos estas fórmulas:
			 - https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
			 - https://en.wikipedia.org/wiki/Linear_regression

			não calculamos os residuais...
		 */
		
		var result = {
			pearsonr: 0,
			slope: 0,
			intercept: 0
		};

		if ( row_nums.length == 0 ){
			return result;
		};

		var X_mu = d3.mean(row_nums, function(d){ return value(d, x_var) })
		var X_0mu = row_nums.map(function(d){ return value(d, x_var) - X_mu; })

		var Y_mu = d3.mean(row_nums, function(d){ return value(d, y_var) })
		var Y_0mu = row_nums.map(function(d){ return value(d, y_var) - Y_mu; })

		var _a = d3.sum(row_nums, function(d, i){ return X_0mu[i]*Y_0mu[i]; })

		var _b = Math.sqrt(d3.sum(X_0mu, function(d){ return Math.pow(d, 2); }))
		var _c = Math.sqrt(d3.sum(Y_0mu, function(d){ return Math.pow(d, 2); }))
		var _d = _b*_c;

		var r = _a / _d;
		var slope = _a / Math.pow(_b, 2);;
		var intercept = Y_mu - (slope* X_mu);

		result["pearsonr"] = r;
		result["slope"] = slope;
		result["intercept"] = intercept;

		return result;
	};

	dispatch.on("gamehover.scatterplot", function(d){
		mouse_coord = d3.mouse(this);

		appstate.highlightedRows.push(d);

		moveCrossair(d);
		showDataTooltip(d, mouse_coord);
	});

	dispatch2.on("gameout.scatterplot", function(d){
		appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(d), 1);
		hideCrossair();
		hideDataTooltip(d);
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

	function rectIntersects(rect1, rect2) {
		const X = 0;
		const Y = 1;
		const TOP_LEFT = 0;
		const BOTTOM_RIGHT = 1;
		return (rect1[TOP_LEFT][X] <= rect2[BOTTOM_RIGHT][X] &&
						rect2[TOP_LEFT][X] <= rect1[BOTTOM_RIGHT][X] &&
						rect1[TOP_LEFT][Y] <= rect2[BOTTOM_RIGHT][Y] &&
						rect2[TOP_LEFT][Y] <= rect1[BOTTOM_RIGHT][Y]);
	};

	function rectContains(rect, point) {
		const X = 0;
		const Y = 1;
		const TOP_LEFT = 0;
		const BOTTOM_RIGHT = 1;
		return rect[TOP_LEFT][X] <= point[X] && point[X] <= rect[BOTTOM_RIGHT][X] &&
					 rect[TOP_LEFT][Y] <= point[Y] && point[Y] <= rect[BOTTOM_RIGHT][Y];
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
		
		var g = d3.selectAll("#t5Viz svg g.x-crossair.y-crossair");

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
			.attr("cx", function(row_num){ return xscale(value(row_num, x_var))})
			.attr("cy", function(row_num){ return yscale(value(row_num, y_var))})

		if(from_target == "clv"){
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

	function hideHighlight(){
		
	}

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
	}

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
	}

	function drawt5(){
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

		var dataset = appstate.datasetRows;

		// 1) Settle the values for the x and y domains (this are the values in the data)
		var ydomain = [];
		ydomain[0] = d3.max(dataset, function(d){ return parseFloat(raw_value(d, y_var)); });
		ydomain[1] = d3.min(dataset, function(d){ return parseFloat(raw_value(d, y_var)); });;
		var xdomain = [];
		xdomain[0] = d3.min(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });;
		xdomain[1] = d3.max(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });



		// 2) Settle the values for the x and y ranges (this are the values/dimensions in pixels)
		var yrange = [];
		yrange[0] = padding;
		yrange[1] = h - padding - yoffset - ycutoff;
		var xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w - padding - xcutoff;

		// Lets compute the mean and st. deviation of the data
		// ( is done on the fly because these might change depending on the rows selected )
		x_mu = d3.mean(dataset, function(d){ return raw_value(d, x_var); });
		x_std = d3.deviation(dataset, function(d){ return raw_value(d, x_var); });
		y_mu = d3.mean(dataset, function(d){ return raw_value(d, y_var); });
		y_std = d3.deviation(dataset, function(d){ return raw_value(d, y_var); });


		// 3) Resizing the SVG
		// lets remove your image placeholder
		d3.select("#t5Viz > img")
			.remove();

		var svg = d3.selectAll("#t5Viz svg")
			.attr("width",w)
			.attr("height",h);

		svg.append("defs").append("clipPath")
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
		voronoi = d3.voronoi()
			.x(function(d, i) {
				var v = value(d, x_var);
				return  xscale(v);
			})
			.y(function(d) {
				var v = value(d, y_var);
				return yscale(v);
			})
			.extent([[xrange[0], yrange[0]], [xrange[1], yrange[1]]])(dataset);


		// ### X) Create Brush for select+zoom
		brush = d3.brush()
			.extent([[xrange[0], yrange[0]], [xrange[1], yrange[1]]])



		// ### X) generate a quadtree for faster lookups for brushing
		quadtree = d3.quadtree()
			.x(function(d, i) {
				var v = value(d, x_var);
				return  xscale(v);
			})
			.y(function(d) {
				var v = value(d, y_var);
				return yscale(v);
			})
			.addAll(dataset);


		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		var axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale);

		var yaxis = d3.axisLeft()
			.scale(yscale);

		var xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(10);

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
		.attr("class","x axis")
		.call(xaxis);
		svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[1] + yoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Score ( / 100 )");
		

		// 6) Create the background grid
		// Draw the Y grid
		svg.selectAll("line.y-grid")
			.data(yscale.ticks())
			.enter().append("line")
				.attr("class", "y-grid")
				.attr("x1", xrange[0])
				.attr("y1", function(d){ return yscale(d); })
				.attr("x2", xrange[1])
				.attr("y2", function(d){ return yscale(d); })
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");

		// Draw the X grid
		svg.selectAll("line.x-grid")
			.data(xscale.ticks())
			.enter().append("line")
				.attr("class", "x-grid")
				.attr("x1", function(d){ return xscale(d); })
				.attr("y1", yrange[0])
				.attr("x2", function(d){ return xscale(d); })
				.attr("y2", yrange[1])
				.attr("stroke-width", 1)
				.attr("stroke", "rgba(120,120,120,0.2)");

			// Draw the Y zero
			svg.selectAll("line.y-grid-0")
				.data([1e-10])
				.enter().append("line")
					.attr("class", "y-grid-0")
					.attr("x1", xrange[0])
					.attr("y1", function(d){ return yscale(d); })
					.attr("x2", xrange[1])
					.attr("y2", function(d){ return yscale(d); })
					.attr("stroke-width", 1)
					.attr("stroke", "rgba(120,120,120,0.5)");

			// Draw the X zero
			svg.selectAll("line.x-grid-0")
				.data([1e-10])
				.enter().append("line")
					.attr("class", "x-grid-0")
					.attr("x1", function(d){ return xscale(d); })
					.attr("y1", yrange[0])
					.attr("x2", function(d){ return xscale(d); })
					.attr("y2", yrange[1])
					.attr("stroke-width", 1)
					.attr("stroke", "rgba(120,120,120,0.5)");



		// 7) Plot the data itself
		// draws the plot itself
		gPoints = svg.selectAll("g.datapoints")
			.data([0])
			.enter().append("g")
				.attr("class", "datapoints")
				.attr("clip-path","url(#t5clip)")

		gPoints.selectAll("circle.data-point")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-t5-"+ d; })
			.attr("class", "data-point")
			.attr("r",r)
			.attr("opacity", 1)
			.attr("fill","rgb(0,127,255)")
			.style("cursor", "none")
			.attr("cx",function(d, i) {
				var v = value(d, x_var);
				return  xscale(v);
			})
			.attr("cy",function(d) {
				var v = value(d, y_var);
				return yscale(v);
			})
			.attr("title", function(d) {return value(d, "Name"); });


			// 8) Draw the regression line and the pearson's r value
			var corr = compute_personsr_linregress(dataset);

			svg.selectAll("line.corr-line")
				.data([corr])
				.enter().append("line")
					.attr("class", "corr-line")
					.attr("x1", function(d){ return xscale(xdomain[0]) - 5; })
					.attr("y1", function(d){ return yscale(d["slope"]*xdomain[0] + d["intercept"])})
					.attr("x2", function(d){ return xscale(xdomain[1]) - 5; })
					.attr("y2", function(d){ return yscale(d["slope"]*xdomain[1] + d["intercept"]); })
					.attr("stroke-width", 1)
					.attr("stroke", "red");

			// draws the pearsons r value of the right handside of the line
			svg.selectAll("text.pearsonsr")
				.data([corr])
				.enter().append("text")
					.attr("class", "pearsonsr")
					.attr("y", function(d){ return yscale(d["slope"]*xdomain[1] + d["intercept"]); })
					.attr("x", function(d){ return xscale(xdomain[1]) + 5; })
					.attr("fill", "red")
					.style("text-anchor", "start")
					.style("font-size", "10px")
					.text(function(d){ return "r: " + d3.format(".3f")(d["pearsonr"]); });



			// 9) Draw the hovering crossair
			// Draw the Y crossair
			svg.selectAll("line.y-crossair")
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
			svg.selectAll("line.x-crossair")
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


			// attach the brush to the chart
			svg.selectAll("g.brush")
				.data([0])
				.enter().append('g')
				.attr('class', 'brush')
				.call(brush)
				.on('mousemove.voronoi', function(){
					// get the current mouse position
					var coords = d3.mouse(this);

					// use the new diagram.find() function to find the Voronoi site
					// closest to the mouse, limited by max distance voronoiRadius
					var d = voronoi.find(coords[0], coords[1], voronoiRadius);

					if(d !== null){
						d = d.data;

						last_hover = d;
						// lets notify ourselves
						
						if (appstate.highlightedRows.indexOf(d) == -1){
							dispatch2.call("gameout", null, last_hover);
							dispatch.call("gamehover", this, d);
							// and also the app. so that the linked views can change
							// for the app we also pass from were we hovered.
							appdispatch.gamehover.call("gamehover", this, d, "t5");
						}
					}
					else{
						d = last_hover
						// lets notify ourselves
						dispatch2.call("gameout", null, d);
						
						appdispatch.gameout.call("gameout", this, d, "t5");
					}

					// highlight the point if we found one
					//highlight(site && site.data);
				})
				.on('mouseleave.voronoi', function(){
					d = last_hover
					// lets notify ourselves
					dispatch2.call("gameout", null, d);
					
					appdispatch.gameout.call("gameout", this, d, "t5");
				});

			brush.on('end', function(){
				var selection = d3.event.selection;
				var brushedNodes = [];

				// if we have no selection, just reset the brush highlight to no nodes
				// if (!selection) {
				// 	console.log("No selection");
				// 	return;
				// }
				
				if (clearbrush_quirk){
					return;
				}

				if(selection){
					// begin an array to collect the brushed nodes

					// traverse the quad tree, skipping branches where we do not overlap
					// with the brushed selection box
					quadtree.visit(function(node, x1, y1, x2, y2){
						// check that quadtree node intersects
						const overlaps = rectIntersects(selection, [[x1, y1], [x2, y2]]);

						// skip if it doesn't overlap the brush
						if (!overlaps) {
							return true;
						}

						// if this is a leaf node (node.length is falsy), verify it is within the brush
						// we have to do this since an overlapping quadtree box does not guarantee
						// that all the points within that box are covered by the brush.
						if (!node.length) {
							const d = node.data;
							const dx = xscale(value(d, x_var));
							const dy = yscale(value(d, y_var));

							if (rectContains(selection, [dx, dy])) {
								brushedNodes.push(d);
							}
						}

						// return false so that we traverse into branch (only useful for non-leaf nodes)
						return false;
					});

					console.log(brushedNodes);
				}


				// lets do zoom
				if (!selection) {
				  //if (!idleTimeout) return idleTimeout = setTimeout(idled, idleDelay);
				  xscale.domain(xdomain);
				  yscale.domain(ydomain);
				  brushedNodes = dataset;
				} else {
				  xscale.domain([selection[0][0], selection[1][0]].map(xscale.invert, xscale));
				  yscale.domain([selection[0][1], selection[1][1]].map(yscale.invert, yscale));
				  clearbrush_quirk = true;
				  svg.select(".brush").call(brush.move, null);
				  clearbrush_quirk = false;
				}

				// ### X) Calculate Voronoi points
				voronoi = d3.voronoi()
					.x(function(d, i) {
						var v = value(d, x_var);
						return  xscale(v);
					})
					.y(function(d) {
						var v = value(d, y_var);
						return yscale(v);
					})
					.extent([[xrange[0], yrange[0]], [xrange[1], yrange[1]]])(brushedNodes);

				// ### X) generate a quadtree for faster lookups for brushing
				quadtree = d3.quadtree()
					.x(function(d, i) {
						var v = value(d, x_var);
						return  xscale(v);
					})
					.y(function(d) {
						var v = value(d, y_var);
						return yscale(v);
					})
					.addAll(brushedNodes);
				
				var t = svg.transition().duration(750);
				svg.select("g.x.axis").transition(t).call(xaxis);
				svg.select("g.y.axis").transition(t).call(yaxis);

				svg.selectAll("circle.data-point")
					.transition()
					.duration(1000)
					.attr("cx",function(d, i) {
						var v = value(d, x_var);
						return  xscale(v); })
					.attr("cy",function(d) {
						var v = value(d, y_var);
						return yscale(v); })

			});


			//svg.selectAll("g.brush")
				//.call(zoom);


			// Draw the group to highlight dots (as there are rownums in appstate.highlightedRows)
			// The dots themselves are added/removed latter in drawHighlightt5 when the events fire.
			svg.selectAll("g.x-crossair.y-crossair")
				.data([0])
				.enter().append("g")
					.attr("class", "x-crossair y-crossair");


			// 10) Place tooltips
			// Data tooltip
			d3.select("#t5Viz").selectAll("div.data-tooltip")
				.data([0])
				.enter().append("div")
					.attr("class", "data-tooltip")
					.style("position", "absolute")
					.style("z-index", "10")
					.style("opacity", 0)
					.style("border", "solid 3px rgba(0,127,255,0.7)")
					.style("background-color", "rgba(255,255,255,0.7)")
					.style("pointer-events", "none")
					.style("padding", "5px 10px")

			// X axis toolip
			svg.selectAll("div.x-tooltip")
				.data([0])
				.enter().append("div")
			
			// Y axis toolip
			svg.selectAll("div.x-tooltip")
				.data([0])
				.enter().append("div")

	};

	window.drawt5 = drawt5;
	window.setSizest5 = setSizest5;
	window.drawHighlightt5 = drawHighlightt5
})();