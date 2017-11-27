;(function(){
	
	function drawdtl(){
		var dataset = appstate.highlightedRows[0];

		var dtl = d3.select("#dtlPanel");

		dtl.selectAll("#name").html(data_utils.read_value(dataset, "Name"));
		dtl.selectAll("#platform").html(data_utils.read_value(dataset, "Platform"));
		dtl.selectAll("#year_of_release").html(parseInt(data_utils.read_value(dataset, "Year_of_Release")));
		dtl.selectAll("#mean_usercritic_score").html(data_utils.read_value(dataset, "Mean_UserCritic_Score"));

		dtl.selectAll("#rating").html(data_utils.read_value(dataset, "Rating"));

		dtl.selectAll("#genre").html(data_utils.read_value(dataset, "Genre"));
		dtl.selectAll("#publisher").html(data_utils.read_value(dataset, "Publisher"));
		dtl.selectAll("#developer").html(data_utils.read_value(dataset, "Developer"));

		drawBullet();
	};

	function drawBullet(){
		var w_sales = 500;
		var h_sales = 50;
		var padding_sales = 5;
		var xoffset_sales = 0;
		var yoffset_sales = 0;
		var xcutoff_sales = 0;
		var ycutoff_sales = 0;

		var total_var = "Global_Sales";
		var detail_vars = ["NA_Sales", "EU_Sales", "JP_Sales"];

		var isLogScale = false;
		var isCenteredData = false;

		var xscale = null;

		var row_number = appstate.highlightedRows[0];

		var svg = d3.select("#dtlPanel").selectAll("#salesViz");

		svg.attr("width",w_sales)
			.attr("height",h_sales);
		
		var xdomain = [];
		xdomain[0] = 0
		xdomain[1] = data_utils.read_value(row_number, total_var);

		var xrange = [];
		xrange[0] = padding_sales + xoffset_sales;
		xrange[1] = w_sales-padding_sales;

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

		pixelvalues = detail_vars.map(function(d){ return xscale( data_utils.read_value(row_number, d)); });
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
			.attr("fill", function(d,i){ return ["green", "steelblue", "red"][i] });

		//var detail_vars = ["NA_Sales", "EU_Sales", "JP_Sales", "Other_Sales"];

		d3.select("#dtlPanel").selectAll("#salesLegend")
			.selectAll("div.col-xs-3")
			.data(detail_vars)
			.enter().append("div")
				.attr("class", "col-xs-3")
				.append("small");

		d3.select("#dtlPanel").selectAll("#salesLegend")
			.selectAll("small")
			.html(function(d, i){ return d; })
	};

	window.drawdtl = drawdtl;
})();