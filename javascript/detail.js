;(function(){
	var w = -1;
	var w_scores = -1;
	var h_sales = 20;
	var h_scores = 130;
	
	function drawdtl(){
		var dataset = appstate.highlightedRows[0];

		var dtl = d3.select("#dtlPanel");

		dtl.selectAll("#name").html(data_utils.read_value(dataset, "Name"));
		dtl.selectAll("#platform").html(data_utils.read_value(dataset, "Platform"));
		dtl.selectAll("#year_of_release").html(parseInt(data_utils.read_value(dataset, "Year_of_Release")));
		dtl.selectAll("#mean_usercritic_score").html(data_utils.read_value(dataset, "Mean_UserCritic_Score"));
		dtl.selectAll("#global_sales").html(data_utils.read_value(dataset, "Global_Sales") + " M");

		dtl.selectAll("#rating").html(data_utils.read_value(dataset, "Rating"));

		dtl.selectAll("#genre").html(data_utils.read_value(dataset, "Genre"));
		dtl.selectAll("#publisher").html(data_utils.read_value(dataset, "Publisher"));
		dtl.selectAll("#developer").html(data_utils.read_value(dataset, "Developer"));

		drawSales();
		drawScores();
	};

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

	function setSizesdtl(boundingRect){
		w = boundingRect.width;
		//h_sales = boundingRect.height;
	};

	function drawSales(){
		var padding_sales = 5;
		var xoffset_sales = 5;
		var yoffset_sales = 0;
		var xcutoff_sales = 0;
		var ycutoff_sales = 0;

		var total_var = "Global_Sales";
		var detail_vars = ["JP_Sales", "EU_Sales", "NA_Sales"];
		//var sales_colors = [ "#e41a1c", "#377eb8", "#4daf4a" ]; // these were taken from color brewer
		var sales_colors = [ "#cf171a", "#4e92ca", "#4daf4a" ]; // these were +- taken from color brewer [68%, 70%, 49%]
		var detail_vars_captions = ["Japan", "Europe", "N. America"];

		var isLogScale = false;
		var isCenteredData = false;

		var xscale = null;

		var row_number = appstate.highlightedRows[0];

		var svg = d3.select("#dtlPanel").selectAll("#salesViz");

		svg.attr("width",w)
			.attr("height",h_sales);
		
		var xdomain = [];
		xdomain[0] = 0
		xdomain[1] = 1;

		var xrange = [];
		xrange[0] = padding_sales + xoffset_sales;
		xrange[1] = w - padding_sales - xcutoff_sales;

		var yrange = [];
		yrange[0] = padding_sales;
		yrange[1] = h_sales - padding_sales - yoffset_sales;

		if(isLogScale){
			xscale = d3.scaleLog();
		}
		else{
			xscale = d3.scaleLinear();
		}

		xscale.domain(xdomain)
			.range(xrange);

		var pixelvalues;
		var pixeloffsets;

		pixelvalues = detail_vars.map(function(d){ return xscale( data_utils.read_value(row_number, d) / data_utils.read_value(row_number, "Global_Sales") ) ; });
		var _rescale =  d3.min([d3.sum(pixelvalues), xrange[1] - xrange[0]]) / d3.sum(pixelvalues);
		pixelvalues = pixelvalues.map(function(d){ return d * _rescale });

		pixeloffsets = pixelvalues.slice(1, pixelvalues.length)
				.map(function(d,i){ return d3.sum(pixelvalues.slice(0, i+1)); });
		pixeloffsets.unshift(0);

		svg.selectAll("rect")
			.data(detail_vars)
			.enter().append("rect");
		svg.selectAll("rect")
			.transition()
			.duration(500)
			.attr("x", function(d, i){ return pixeloffsets[i]; })
			.attr("y", yrange[0])
			.attr("width", function(d, i){ return pixelvalues[i] })
			.attr("height", yrange[1]-yrange[0])
			.attr("stroke", "#222")
			.attr("stroke-width", 2)
			.attr("fill", function(d,i){ return sales_colors[i]; });

		d3.select("#dtlPanel").selectAll("#salesLegend")
			.selectAll("div.col-xs-4")
			.data(detail_vars)
			.enter().append("div")
				.attr("class", "col-xs-4")
				.append("small")
					.style("border-left", function(d, i){ return "solid 3px " + sales_colors[i]; })
					.style("padding-left", "3px");

		d3.select("#dtlPanel").selectAll("#salesLegend")
			.selectAll("small")
			.style("font-size", "0.6em")
			.html(function(d, i){ 
				return detail_vars_captions[i] + " ("+ data_utils.read_value(row_number,detail_vars[i]) +")"; })
	};

	function drawScores(){
		var w_scores = $(".scoresVizParent").get(0).getClientRects()[0].width;
		var padding_scores = 5;
		var xoffset_scores = 30;
		var yoffset_scores = 30;
		var xcutoff_scores = 30;
		var ycutoff_scores = 30;
		var top_rows = 2;

		var user_var = "User_Score_Norm";
		var critic_var = "Critic_Score";
		var user_var_c = "User_Count";
		var critic_var_c = "Critic_Count";

		var detail_vars = ["JP_Sales", "EU_Sales", "NA_Sales"];
		var sales_colors = [ "#e41a1c", "#377eb8", "#4daf4a" ]; // these were taken from color brewer
		var detail_vars_captions = ["Japan", "Europe", "N. America"];

		var xscale = null;

		var row_number = appstate.highlightedRows[0];

		var score_counts = [data_utils.read_value(row_number, user_var_c), 
									data_utils.read_value(row_number, critic_var_c)]

		var svg = d3.select("#dtlPanel").selectAll("#scoresViz");

		svg
			.attr("width",w_scores)
			.attr("height",h_scores);

		var t0 = svg.transition().duration(100);
		var t1 = svg.transition().delay(100).duration(500);
		
		var xdomain = [];
		xdomain[0] = 0
		xdomain[1] = 2;

		var ydomain = [];
		ydomain[0] = 100;
		ydomain[1] = 0;


		var xrange = [];
		xrange[0] = padding_scores + xoffset_scores;
		xrange[1] = w_scores - padding_scores - xcutoff_scores;

		var yrange = [];
		yrange[0] = padding_scores;
		yrange[1] = h_scores - padding_scores - yoffset_scores;



		yscale = d3.scaleLinear();
		xscale = d3.scaleBand();

		yscale.domain(ydomain)
			.range(yrange);

		xscale.domain(d3.range.apply(null, xdomain))
			.range(xrange)
			.padding(0.1)



		// 5) Create X and Y axis
		//calculate the placement of the origins for both axis
		var axis_0 = axisOrigins(xdomain, ydomain, xrange, yrange, xscale, yscale);

		var yaxis = d3.axisLeft()
			.scale(yscale)
			.ticks(5);

		var xaxis = d3.axisBottom()
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



		// X) Append group for data points grid
		svg.selectAll("g.datapoints")
			.data([0]).enter().append("g")
				.attr("class", "datapoints")



			// 5) Create X and Y axis
			var gY = svg.select("g.y.axis")
				.transition(t0)
				.call(yaxis);

			// draws the X axis with text label
			var gX = svg.select("g.x.axis")
			gX.selectAll("text")
				.attr("class", "x tick")
				.attr("class", "x tick")
				.style("text-anchor", "middle")
				.text(function(d, i){ 
					var result = [
						"User Score",
						"Critic Score"
					];
					
					return result[i];
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
					.attr("y2", function(d){ return yscale(d); });



		// 7) Plot the data itself
		// draws the plot itself
		svg.select("g.datapoints").selectAll("rect.data-point")
			.data([0, 1])
			.enter().append("rect")
			.attr("class", "data-point")
			.attr("fill","rgb(255, 197, 0)")
			.attr("opacity", 1)
		svg.select("g.datapoints").selectAll("rect.data-point")
			.data([0, 1])
			.exit().remove();
		svg.select("g.datapoints").selectAll("rect.data-point")
			.transition().duration(750)
			.attr("x",function(d, i) {
				return  xscale(i);
			})
			.attr("y", function(d, i) {
				var _var = [user_var, critic_var];
				var v = data_utils.read_value(row_number, _var[i]);
				return yscale(v);
			})
			.attr("width", xscale.bandwidth())
			.attr("height", function(d, i) {
				var _var = [user_var, critic_var];
				var v = data_utils.read_value(row_number, _var[i]);
				var result;

				if (v<0){
					// turns out we didn't have data for this
					result = 0;
				}
				else{
					result = yscale.range()[1] - yscale(v)
				}
				return result;
			});

		// 7) Plot the data itself
		// draws the inside-plot labels
		svg.select("g.datapoints").selectAll("text.data-point")
			.data([0, 1])
			.enter().append("text")
			.attr("class", "data-point")
			.attr("fill","rgb(0,0,0)")
			.style("font-size", 10)
			.style("text-anchor", "middle")
		svg.select("g.datapoints").selectAll("text.data-point")
			.data([0, 1])
			.exit().remove();
		svg.select("g.datapoints").selectAll("text.data-point")
			.transition().duration(750)
			.attr("x",function(d, i) {
				return  xscale(i) + xscale.bandwidth() / 2;
			})
			.attr("y", function(d, i) {
				var _var = [user_var, critic_var];
				var v = data_utils.read_value(row_number, _var[i]);
				var result;

				if (v < 0 || score_counts[i] < 0){
					result = yscale(50);
				}
				else{
					result = yscale(v) - 4
				}

				return result;
			})
			.text(function(d, i){ 
				var _var = [user_var, critic_var];
				var v = data_utils.read_value(row_number, _var[i]);
				var result;

				if (v < 0 || score_counts[i] < 0){
					result = "Unknown";
				}
				else{
					result = d3.format(".1f")(v);
				}

				return  result;
			})

			var dtl = d3.select("#dtlPanel");

			dtl.selectAll("#usercritic_diff").html(data_utils.read_value(row_number, "Critic_User_Diff"));
			dtl.selectAll("#user_count").html(Math.max(score_counts[0],0));
			dtl.selectAll("#critc_count").html(Math.max(score_counts[1],0));
	};

	window.drawdtl = drawdtl;
	window.setSizesdtl = setSizesdtl;
})();