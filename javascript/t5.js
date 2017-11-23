;(function(){

	var w = 500;
	var h = 300;
	var padding = 50;
	var xoffset = 40;
	var yoffset = 30;
	var xcutoff = 40;
	var ycutoff = 30;
	var r = 5;

	var y_var = "Global_Sales";
	var x_var = "Mean_UserCritic_Score";

	var dispatch = d3.dispatch("gamehover");
	var selectedBar, selectedCircle;

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

	function compute_personsr_linregress(rown_nums){
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

		if ( rown_nums.length == 0 ){
			return result;
		};

		var X_mu = d3.mean(rown_nums, function(d){ return value(d, "Mean_UserCritic_Score") })
		var X_0mu = rown_nums.map(function(d){ return value(d, "Mean_UserCritic_Score") - X_mu; })

		var Y_mu = d3.mean(rown_nums, function(d){ return value(d, "Global_Sales") })
		var Y_0mu = rown_nums.map(function(d){ return value(d, "Global_Sales") - Y_mu; })

		var _a = d3.sum(rown_nums, function(d, i){ return X_0mu[i]*Y_0mu[i]; })

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

		if(selectedCircle != null){
			selectedCircle.attr("fill", "rgb(0,127,255)");
		}

		selectedCircle = d3.select("#d-t5-"+d);
		selectedCircle.attr("fill", "rgb(255,127,0)");

		console.log("gamehover fired on the viz", d);
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
	function raw_value(rown_num, variable){
		return data_utils.read_value(rown_num, variable);
	};

	function centered_value(rown_num, variable){

		return raw_value(rown_num, variable);
	};

	function value(rown_num, variable){
		var result;
		var raw_v = raw_value(rown_num, variable);

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

	function drawt5(){

		// FIXED SIZE FOR NOW

		var dataset = appstate.datasetRows.slice(0, 100);

		var ydomain = [];
		ydomain[0] = d3.max(dataset, function(d){ return parseFloat(raw_value(d, y_var)); });
		ydomain[1] = d3.min(dataset, function(d){ return parseFloat(raw_value(d, y_var)); });;
		var xdomain = [];
		xdomain[0] = d3.min(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });;
		xdomain[1] = d3.max(dataset, function(d) { return parseFloat(raw_value(d, x_var)) });
		
		var yrange = [];
		yrange[0] = padding;
		yrange[1] = h - padding - yoffset;
		var xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w-padding;

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

		var corr = compute_personsr_linregress(dataset);

		// lets remove your image placeholder
		d3.select("#t5Viz > img")
			.remove();

		var svg = d3.select("#t5Viz")
			.append("svg")
			.attr("width",w)
			.attr("height",h);

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

		//                                                                       //
		// Either way, centered or not, from now on we use yscale_c and xscale_c //
		//                                                                       //

		//calculate axis origins
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

		if( !isLogScale ){
			
			// Draw the Y grid
			svg.selectAll("line.corr-line")
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
			svg.selectAll("line.corr-line")
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
			svg.selectAll("line.corr-line")
				.data([0])
				.enter().append("line")
					.attr("class", "y-grid")
					.attr("x1", xrange[0])
					.attr("y1", function(d){ return yscale_c(d); })
					.attr("x2", xrange[1])
					.attr("y2", function(d){ return yscale_c(d); })
					.attr("stroke-width", 1)
					.attr("stroke", "rgba(120,120,120,0.5)");

			// Draw the X zero
			svg.selectAll("line.corr-line")
				.data([0])
				.enter().append("line")
					.attr("class", "x-grid")
					.attr("x1", function(d){ return yscale_c(d); })
					.attr("y1", yrange[0])
					.attr("x2", function(d){ return yscale_c(d); })
					.attr("y2", yrange[1])
					.attr("stroke-width", 1)
					.attr("stroke", "rgba(120,120,120,0.5)");
			}

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
		
		// draws the plot itself
		svg.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-t5-"+ d; })
			.attr("r",r)
			.attr("fill","rgb(0,127,255)")
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
				dispatch.call("gamehover", null, d);
				// and also the app. so that the linked views can change
				// for the app we also pass from were we hovered.
				appdispatch.gamehover.call("gamehover", null, d, "t5");
			});


			// draws the regression line
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
				  .text(function(d){ return "r: " + d["pearsonr"]; });

	};

	window.drawt5 = drawt5;
})();