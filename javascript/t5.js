;(function(){

	var w = -1;
	var h = -1;
	var padding = 20;
	var xoffset = 30;
	var yoffset = 30;
	var xcutoff = 100;
	var ycutoff = 0;
	var r = 2;

	var y_var = "Global_Sales";
	var x_var = "Mean_UserCritic_Score";

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

		var X_mu = d3.mean(row_nums, function(d){ return value(d, "Mean_UserCritic_Score") })
		var X_0mu = row_nums.map(function(d){ return value(d, "Mean_UserCritic_Score") - X_mu; })

		var Y_mu = d3.mean(row_nums, function(d){ return value(d, "Global_Sales") })
		var Y_0mu = row_nums.map(function(d){ return value(d, "Global_Sales") - Y_mu; })

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

		moveCrossair(d);
		showDataTooltip(d, mouse_coord);
		appstate.highlightedRows.push(d);
	});

	dispatch2.on("gameout.scatterplot", function(d){
		appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(d), 1);
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

	function moveCrossair(row_num){

		d3.select("#t5Viz")
			.selectAll("line.y-crossair")
				.attr("y1", yscale_c(value(row_num, y_var)))
				.attr("y2", yscale_c(value(row_num, y_var)))

		d3.select("#t5Viz")
			.selectAll("line.x-crossair")
				.attr("x1", xscale_c(value(row_num, x_var)))
				.attr("x2", xscale_c(value(row_num, x_var)))

		d3.select("#t5Viz")
			.selectAll("circle.x-crossair.y-crossair")
				.attr("cx", xscale_c(value(row_num, x_var)))
				.attr("cy", yscale_c(value(row_num, y_var)))
	};

	function showDataTooltip(row_num, mouse_coord){
		console.log("event", d3.event.pageX, d3.event.pageY);

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
				3) Putting the SVG in place
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
				   .. a "phantom" dot (when we "highligh" we are actually placing this dot on top of the viz)
				   				  ^-- this helps a bit when we have lots of occlusion. but doesn't exactly solve it...
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
		xrange[1] = w-padding - xcutoff;

		// Lets compute the mean and st. deviation of the data
		// ( is done on the fly because these might change depending on the rows selected )
		if(isLogScale){
			x_mu = d3.mean(dataset, function(d){ return Math.log(raw_value(d, x_var)); });
			x_std = d3.deviation(dataset, function(d){ return Math.log(raw_value(d, x_var)); });
			y_mu = d3.mean(dataset, function(d){ return Math.log(raw_value(d, y_var)); });
			y_std = d3.deviation(dataset, function(d){ return Math.log(raw_value(d, y_var)); });
		}
		else{
			x_mu = d3.mean(dataset, function(d){ return raw_value(d, x_var); });
			x_std = d3.deviation(dataset, function(d){ return raw_value(d, x_var); });
			y_mu = d3.mean(dataset, function(d){ return raw_value(d, y_var); });
			y_std = d3.deviation(dataset, function(d){ return raw_value(d, y_var); });
		}

		// 3) Putting the SVG in place
		// lets remove your image placeholder
		d3.select("#t5Viz > img")
			.remove();

		var svg = d3.selectAll("#t5Viz svg")
			.attr("width",w)
			.attr("height",h);



		// 4) Creating the scales
		if(isLogScale){
			yscale = d3.scaleLog();
			xscale = d3.scaleLog();
		}
		else{
			yscale = d3.scaleLinear();
			xscale = d3.scaleLinear();
		}

		yscale.domain(ydomain)
				.range(yrange);

		xscale.domain(xdomain)
			.range(xrange);

		if(isCenteredData){
			if(isLogScale){
				yscale_c = d3.scaleLinear()
						.domain(ydomain.map(function(d){ return (Math.log(d) - y_mu) / y_std; }))
						.range(yrange);

				xscale_c = d3.scaleLinear()
						.domain(xdomain.map(function(d){ return (Math.log(d) - x_mu) / x_std; }))
						.range(xrange);
			}
			else{
				yscale_c = d3.scaleLinear()
						.domain(ydomain.map(function(d){ return (d - y_mu) / y_std; }))
						.range(yrange);

				xscale_c = d3.scaleLinear()
						.domain(xdomain.map(function(d){ return (d - x_mu) / x_std; }))
						.range(xrange);
			}
		}
		else{
			yscale_c = yscale;
			xscale_c = xscale;
		}

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
			  .text("Global Sales (Million Units)")

		// draws the X axis with text label
		gX = svg.append("g")
		.attr("transform","translate(0," + axis_0["y"] + ")")
		.call(xaxis);
		svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[1] + yoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Score");
		
		

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
				.attr("stroke", "rgba(120,120,120,0.2)");

			// Draw the Y zero
			svg.selectAll("line.y-grid-0")
				.data([1e-10])
				.enter().append("line")
					.attr("class", "y-grid-0")
					.attr("x1", xrange[0])
					.attr("y1", function(d){ return yscale_c(d); })
					.attr("x2", xrange[1])
					.attr("y2", function(d){ return yscale_c(d); })
					.attr("stroke-width", 1)
					.attr("stroke", "rgba(120,120,120,0.5)");

			// Draw the X zero
			svg.selectAll("line.x-grid-0")
				.data([1e-10])
				.enter().append("line")
					.attr("class", "x-grid-0")
					.attr("x1", function(d){ return xscale_c(d); })
					.attr("y1", yrange[0])
					.attr("x2", function(d){ return xscale_c(d); })
					.attr("y2", yrange[1])
					.attr("stroke-width", 1)
					.attr("stroke", "rgba(120,120,120,0.5)");



		// 7) Plot the data itself
		// draws the plot itself
		svg.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-t5-"+ d; })
			.attr("r",r)
			.attr("fill","rgb(0,127,255)")
			.style("cursor", "crosshair")
			.attr("cx",function(d, i) {
				var v = value(d, x_var);
				return  xscale_c(v);
			})
			.attr("cy",function(d) {
				var v = value(d, y_var);
				return yscale_c(v);
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
			});



			// 8) Draw the regression line and the pearson's r value
			var corr = compute_personsr_linregress(dataset);

			svg.selectAll("line.corr-line")
				.data([corr])
				.enter().append("line")
					.attr("class", "corr-line")
					.attr("x1", function(d){ return xscale_c(xdomain[0]) - 5; })
					.attr("y1", function(d){ return yscale_c(d["slope"]*xdomain[0] + d["intercept"])})
					.attr("x2", function(d){ return xscale_c(xdomain[1]) - 5; })
					.attr("y2", function(d){ return yscale_c(d["slope"]*xdomain[1] + d["intercept"]); })
					.attr("stroke-width", 1)
					.attr("stroke", "red");

			// draws the pearsons r value of the right handside of the line
			svg.selectAll("text.pearsonsr")
				.data([corr])
				.enter().append("text")
				  .attr("class", "pearsonsr")
				  .attr("y", function(d){ return yscale_c(d["slope"]*xdomain[1] + d["intercept"]); })
				  .attr("x", function(d){ return xscale_c(xdomain[1]) + 5; })
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
					.attr("x1", xrange[0]) 
					.attr("y1", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("x2", xrange[1]) 
					.attr("y2", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("stroke-width", 3)
					.style("pointer-events", "none")
					.attr("stroke", "rgba(255,0,255,0.5)");

			// Draw the X crossair
			svg.selectAll("line.x-crossair")
				.data([0])
				.enter().append("line")
					.attr("class", "x-crossair")
					.attr("x1", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("y1", yrange[0]) 
					.attr("x2", -1000) // this value doesn't matter. we just don't want to see it right away
					.attr("y2", yrange[1]) 
					.attr("stroke-width", 3)
					.style("pointer-events", "none")
					.attr("stroke", "rgba(255,0,255,0.5)");

			// Draw the phantom dot
			svg.selectAll("circle.x-crossair.y-crossair")
				.data([0])
				.enter().append("circle")
					.attr("class", "x-crossair y-crossair")
					.attr("cx", 1000) // this value doesn't matter. we just don't want to see it right away
					.attr("cy", 1000) // this value doesn't matter. we just don't want to see it right away
					.attr("r", 2)
					.style("pointer-events", "none")
					.attr("stroke", "rgba(255,0,255,0.5)");


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
})();