;(function(){

	


	function drawt5(){
		var w = 400;
		var h = 300;

		//var dataset = datasources["data_v2"].slice(0, 10000);
		var dataset = datasources["data_v2"];

		d3.select("#t5Viz > img")
			.remove();

		var svg = d3.select("#t5Viz")
		.append("svg")
		.attr("width",w)
		.attr("height",h)
		.attr("fill", "blue");

		var padding = 30;
		var bar_w = 15;
		var r = 1;

		x_variable = "Mean_UserCritic_Score";
		y_variable = "Global_Sales";

		var hscale = d3.scaleLinear()
			.domain([d3.max(dataset, function(d){ return parseFloat(d[y_variable]); }),0])
			.range([padding,h-padding]);

		var xscale = d3.scaleLinear()
		.domain([0.0,d3.max(dataset, function(d) {
			return parseFloat(d[x_variable]);})])
		.range([padding,w-padding]);

		var yaxis = d3.axisLeft()
		.scale(hscale);

		var xaxis = d3.axisBottom()
		.scale(xscale)
		.ticks(10);

		// var cscale = d3.scaleLinear()
		// .domain([d3.min(dataset, function(d) { return  d.year;}),
		// 	d3.max(dataset, function(d) { return d.year;})])
		// .range(["red", "blue"]);


		gY = svg.append("g")
		.attr("transform","translate(30,0)")  
		.attr("class","y axis")
		.call(yaxis);

		gX = svg.append("g")
		.attr("transform","translate(0," + (h-padding) + ")")
		.call(xaxis);
		
		svg.selectAll("circle")
			.data(dataset)
			.enter().append("circle")
			.attr("r",r)
			.attr("fill","purple")
			.attr("cx",function(d, i) {
				if (d[x_variable] <= 0) {return padding;}
				return  xscale(d[x_variable]);
			})
			.attr("cy",function(d) {
				return hscale(d[y_variable]);
			})
			.attr("title", function(d) {return d.title;})
			.on("mouseover", function(d){
				dispatch.call("movieEnter", d, d);
			});
	};

	window.drawt5 = drawt5;
})();