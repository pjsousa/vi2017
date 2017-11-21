;(function(){

	var dispatch = d3.dispatch("gamehover");
	var selectedBar, selectedCircle;


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

		var X_mu = d3.mean(rown_nums, function(d){ return data_utils.read_value(d, "Mean_UserCritic_Score") })
		var X_0mu = rown_nums.map(function(d){ return data_utils.read_value(d, "Mean_UserCritic_Score") - X_mu; })

		var Y_mu = d3.mean(rown_nums, function(d){ return data_utils.read_value(d, "Global_Sales") })
		var Y_0mu = rown_nums.map(function(d){ return data_utils.read_value(d, "Global_Sales") - Y_mu; })

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
	}


	dispatch.on("gamehover.scatterplot", function(d){

		if(selectedCircle != null){
			selectedCircle.attr("fill", "purple");
		}

		selectedCircle = d3.select("#d-t5-"+d);
		selectedCircle.attr("fill", "red");
		console.log(typeof selectedCircle, "#d-t5-"+d);
	});

	function drawt5(){

		// our (fnRV) FuNction to Read Values...
		var _fnRv = data_utils.read_value;

		// FIXED SIZE FOR NOW
		var w = 400;
		var h = 300;

		var dataset = appstate.datasetRows;

		var padding = 40;
		var r = 3;

		var y_var = "Global_Sales";
		var x_var = "Mean_UserCritic_Score";

		var ydomain = [];
		ydomain[0] = d3.max(dataset, function(d){ return parseFloat(_fnRv(d, y_var)); });
		ydomain[1] = 0;
		var xdomain = [];
		xdomain[0] = 0;
		xdomain[1] = d3.max(dataset, function(d) { return parseFloat(_fnRv(d, x_var)) });
		
		var yrange = [];
		yrange[0] = padding;
		yrange[1] = h-padding;
		var xrange = [];
		xrange[0] = padding;
		xrange[1] = w-padding;

		var corr = compute_personsr_linregress(dataset);

		// lets remove your image placeholder
		d3.select("#t5Viz > img")
			.remove();

		var svg = d3.select("#t5Viz")
			.append("svg")
			.attr("width",w)
			.attr("height",h);

		var hscale = d3.scaleLinear()
			.domain(ydomain)
			.range(yrange);

		var xscale = d3.scaleLinear()
		.domain(xdomain)
		.range(xrange);

		var yaxis = d3.axisLeft()
			.scale(hscale);

		var xaxis = d3.axisBottom()
			.scale(xscale)
			.ticks(10);

		// draws the Y axis with text label
		gY = svg.append("g")
		.attr("transform","translate("+ padding +",0)")  
		.attr("class","y axis")
		.call(yaxis)
			.append("text")
			  .attr("class", "label")
			  .attr("transform", "rotate(-90)")
			  .attr("y", -padding + 15)
			  .attr("x", -h/2)
			  .attr("fill", "black")
			  .style("text-anchor", "middle")
			  .text("Global Sales (Million Units)")

		// draws the X axis with text label
		gX = svg.append("g")
		.attr("transform","translate(0," + (h-padding) + ")")
		.call(xaxis)
		.append("text")
			.attr("class", "label")
			.attr("x", w / 2)
			.attr("y", padding)
			.attr("fill", "black")
			.style("text-anchor", "middle")
			.text("Score");
		
		// draws the plot itself
		svg.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.attr("id", function(d){ return "d-t5-"+ d; })
			.attr("r",r)
			.attr("fill","purple")
			.attr("cx",function(d, i) {
				var v = _fnRv(d, x_var);
				if (v <= 0) {return padding;}
				return  xscale(v);
			})
			.attr("cy",function(d) {
				var v = _fnRv(d, y_var);
				return hscale(v);
			})
			.attr("title", function(d) {return _fnRv(d, "Name"); })
			.on("mouseover", function(d){
				dispatch.call("gamehover", d, d);
			});


			// draws the regression line
			svg.selectAll("line.corr-line")
				.data([corr])
				.enter().append("line")
					.attr("class", "corr-line")
					.attr("x1", function(d){ return xscale(xdomain[0]) - 5; })
					.attr("y1", function(d){ return hscale(d["slope"]*xdomain[0] + d["intercept"])})
					.attr("x2", function(d){ return xscale(xdomain[1]) - 5; })
					.attr("y2", function(d){ return hscale(d["slope"]*xdomain[1] + d["intercept"]); })
					.attr("stroke-width", 1)
					.attr("stroke", "red");

			// draws the pearsons r value of the right handside of the line
			svg.selectAll("text.pearsonsr")
				.data([corr])
				.enter().append("text")
				  .attr("class", "pearsonsr")
				  .attr("y", function(d){ return hscale(d["slope"]*xdomain[1] + d["intercept"]); })
				  .attr("x", function(d){ return xscale(xdomain[1]) + 5; })
				  .attr("fill", "red")
				  .style("text-anchor", "start")
				  .style("font-size", "10px")
				  .text(function(d){ return "r: " + d["pearsonr"]; });



	};

	window.drawt5 = drawt5;
})();