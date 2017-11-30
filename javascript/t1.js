;(function(){
	// [Q] Eu na T5 fiz um montão louco de batota e guardei algumas coisas 
	// fora do drawT5(). Um bocado mais para facilitar os contextos de algumas 
	// coisas nas funções auxiliares.
	var w = -1;
	var h = -1;
	var padding = 30; //30
	var xoffset = 40;
	var yoffset = 30;//30
	var xcutoff = 100; //40
	var ycutoff = 30;
	var r = 2;

	// [Q] Reparei que não butastes o Other_Sales, e então não butei também... mas... O_o
	var x_variable = "Year_of_Release";
	var y_variable = ["JP_Sales", "EU_Sales", "NA_Sales"];
	var colors = [ "red", "steelblue", "green" ];

	var dispatch = d3.dispatch("gamehover");
	var dispatch2 = d3.dispatch("gameout");

	var x = null;
	var y = null;
	
	//brush and zoom
	var x_brush = null;
	var y_brush = null;
	var svg = null;
	var context = null;
	var xaxis = null;
	var yaxis = null;
	var zoom = null;
	var brush = null;
	var valueline = null;
	var valueline2 = null;
	var valueline3 = null;
	var dataset = null;
	var xrange = [];
	
	dispatch.on("gamehover.lineplot", function(d, all_rownums, dataset){
		// lets place ALL the rows in highligh!
		all_rownums.forEach(function(row_num){
			appstate.highlightedRows.push(row_num);
		});
	});

	dispatch2.on("gameout.lineplot", function(d, all_rownums, dataset){
		all_rownums.forEach(function(row_num){
			appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(row_num), 1);
		});
	});

	
	function brushed() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
		var s = d3.event.selection || x_brush.range();
		x.domain(s.map(x_brush.invert, x_brush));
		svg.selectAll(".line1").attr("d",valueline);
		svg.selectAll(".line2").attr("d",valueline2);
		svg.selectAll(".line3").attr("d",valueline3);
		svg.selectAll("g.g-focus").selectAll("circle.data-points")
			.attr("cx", function(d){ return x(dataset[d[0]]["Year_of_Release"]) });
		svg.selectAll("g.g-focus").selectAll("circle.data-points-hidden")
			.attr("cx", function(d){ return x(dataset[d[0]]["Year_of_Release"]) });
		svg.select(".axis--x").call(xaxis);
		svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
								 .scale(xrange[1] / (s[1] - s[0]))
								 .translate(-s[0], 0));
	}

	function zoomed() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
		console.log("zooom");
		var t = d3.event.transform;
		x.domain(t.rescaleX(x_brush).domain());
		svg.selectAll(".line1").attr("d",valueline);
		svg.selectAll(".line2").attr("d",valueline2);
		svg.selectAll(".line3").attr("d",valueline3);
		svg.selectAll("g.g-focus").selectAll("circle.data-points")
			.attr("cx", function(d){ return x(dataset[d[0]]["Year_of_Release"]) });
		svg.selectAll("g.g-focus").selectAll("circle.data-points-hidden")
			.attr("cx", function(d){ return x(dataset[d[0]]["Year_of_Release"]) });
		svg.select(".axis--x").call(xaxis);
		context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
	}
	
	function setSizest1(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
		console.log(w,h);
	}
	
	function drawt1(){
		/*
			"Drawing t1" means:
				1) ...
				2) ...
				
				The frequency of the viz are ...
		 */

		//var dataset = data_utils.read_column(null, ["JP_Sales", "EU_Sales", "NA_Sales", "Year_of_Release"]);
		dataset = data_utils.get_sales_sum(null,"Developer","Nintendo");
		var r = dataset.map(a => a.Year_of_Release);
		var maxYear = r.reduce(function(a,b){ return Math.max(a,b);});
		var minYear = 1987;  // [Q] Why though?
		
		dataset.sort(function(x,y) { return d3.ascending(x.Year_of_Release, y.Year_of_Release)} );

		var yrange = [];
		yrange[0] = padding;
		yrange[1] = h - padding - yoffset - ycutoff;
		//var xrange = [];
		xrange[0] = padding + xoffset;
		xrange[1] = w-padding - xcutoff;
		
		
		/////////////////////////////////////////////////////////////BEGIN ZOOM
		
		zoom = d3.zoom()
			.scaleExtent([1, Infinity])
			.translateExtent([[xrange[0],0],[xrange[1],yrange[0]]])
			.extent([[xrange[0],0],[xrange[1],yrange[0]]])
			.on("zoom",zoomed);      

		
		////////////////////////////////////////////////////////////////////////END ZOOM
		
		d3.select("#t1Viz > img")
				.remove();

		svg = d3.select("#t1Viz svg")
			.attr("class","zoom")
			.attr("width", w)
			.attr("height",h)
			.call(zoom);
		
		//definir o eixo y
		y = d3.scaleLinear()
			.range([yrange[0],yrange[1]]);

		//definir o eixo x e passar os anos de floats para anos
		var parseTime = d3.timeParse("%Y")
			bisectDate = d3.bisector(function(d){return d.Year_of_Release;}).left;
		dataset.forEach(function(d) {
			var date = d.Year_of_Release.split(".");
			if(date[0]==-1){
				date[0] = 1970;
			}
			d.Year_of_Release= parseTime(date[0]);
		});
		x = d3.scaleTime()
			.range([xrange[0],xrange[1]]);
		
		
		//criar os valores de cada linha de sales
		valueline = d3.line()
			.x(function(d) {return x(d.Year_of_Release);})
			.y(function(d) {return y(d.JP_Sales);});
		
		valueline2 = d3.line()
			.x(function(d) {return x(d.Year_of_Release);})
			.y(function(d) {return y(d.EU_Sales);});
		
		valueline3 = d3.line()
			.x(function(d) {return x(d.Year_of_Release);})
			.y(function(d) {return y(d.NA_Sales);});

		//definir o domain de cada eixo
		x.domain(d3.extent(dataset, function(d) { return d.Year_of_Release; }))
			.tickFormat(d3.timeFormat("%Y"));
		y.domain([d3.max(dataset, function(d){ return d["NA_Sales"]; }),0]);
		
		
		yaxis = d3.axisLeft()
			.scale(y);

		xaxis = d3.axisBottom()
			.scale(x);
		
		//legendas   
		var legW = 200;
		var legH = 100;
		var legend = d3.select("#t1Viz").selectAll("div.t1Legend").append("svg")
			.attr("width",legW)
			.attr("height",legH)
			.style("position", "absolute")
			.style("z-index", "10")
			.style("top","50px")
			.style("left", (xrange[1]+20)+"px");
		
		var legendSpace = 40;
		var legendNames = ["Japan", "Europe", "North America"];
		legendNames.forEach(function(d,i){
			
			legend.append("circle")
				.attr("r",3)
				.attr("cx",10)
				.attr("cy",legendSpace * i/2 + legendSpace)
				.attr("class","legend")
				.style("fill",function(d){return colors[i];});
										  
			legend.append("text")
				.attr("x", 15)  // space legend
				.attr("y",legendSpace * i/2 + legendSpace)
				.attr("class", "legend_text")    // style the legend
				.style("fill", "black")
				.text(d.toString());            
			
		})
		
		//tooltip       
		var focus = svg.append("g")
						.attr("class","focus")
						.attr("pointer-events", "none")
						.style("display","none");
		
		focus.append("line")
			.attr("class", "x-hover-line hover-line")
			.attr("y1", 0)
			.attr("y2", h);

		focus.append("line")
			.attr("class", "y-hover-line hover-line")
			.attr("x1", w)
			.attr("x2", w);

		focus.append("circle")
			.attr("r", 7.5);

		focus.append("text")
			.attr("x", 15)
			.attr("dy", ".31em");
	
		
		//criar o grafico
		svg.append("defs").append("clipPath")
			.attr("id","t1clip")
			.append("rect")
			.attr("x",xrange[0])
			.attr("y",yrange[0])
			.attr("width",xrange[1]-xrange[0])
			.attr("height",yrange[1]-yrange[0]);
		
		svg.append("g")
			.attr("transform","translate("+(xrange[0])+",0)")
			.attr("class","y axis")
			.call(yaxis);

		svg.append("text")
			  .attr("class", "y-axis-label")
			  .attr("transform", "rotate(-90)")
			  .attr("x", -yrange[0])
			  .attr("y", xrange[0] - xoffset)
			  .attr("fill", "black")
			  .style("text-anchor", "end")
			  .text("Sales ( Million Units )")
		
		svg.append("g")
			.attr("transform","translate(0,"+(yrange[1])+")")
			.attr("class","axis axis--x")
			.call(xaxis);
		svg.append("text")
			.attr("class", "x-axis-label")
			.attr("x", xrange[1])
			.attr("y", yrange[1] + yoffset)
			.attr("fill", "black")
			.style("text-anchor", "end")
			.text("Year");

		svg.append("path")
			.datum(dataset) // [Q] Nestes datums, acho que querias chamar o data() e depois o enter()? Pareceu-me que não tão a ser usados, so...
			.attr("class", "line1")
			.attr("clip-path","url(#t1clip)")
			.attr("fill","none")
			.attr("stroke",colors[0])
			.attr("stroke-width",1.5)
			.attr("d",valueline);

		svg.append("path")
			.datum(dataset)
			.attr("class", "line2")
			.attr("clip-path","url(#t1clip)")
			.attr("fill","none")
			.attr("stroke",colors[1])
			.attr("stroke-width",1.5)
			.attr("d",valueline2);
		
		svg.append("path")
			.datum(dataset)
			.attr("class", "line3")
			.attr("clip-path","url(#t1clip)")
			.attr("fill","none")
			.attr("stroke",colors[2])
			.attr("stroke-width",1.5)
			.attr("d",valueline3);

		/* 
			[Q] Daqui para baixo foi adicionado por mim.
			Isto "rouba" algumas variáveis das tuas e desenha circulos transparantes que coincidem com os dados 
			para apanharem os eventos do rato.

			[Q] O que mudei mais lá para cima (dentro da drawt1) foi a parte das 
			dimensões, offsets, cutoffs... Que nos vai dar jeito para pôr 
			o layout com tamanhos mais consistentes na página toda.

			We'll steal these from above:
				- dataset
				- x
				- y
				- parseTime
		 */

		var all_points = d3.range(dataset.length)
			.map(function(itr_x){ return y_variable.map(function(itr_y){ return [itr_x, itr_y]; })});

		all_points = _.flatten(all_points);
		/*   ^--- think of all_points as if it was a todo list of circles to draw...
			we need to do:
			[[0, "NA_Sales"]
			 [0, "EU_Sales"]
			 ....]
		 */

		var gfocus = svg.selectAll("g.g-focus")
			.data([0])
			.enter().append("g")
				.attr("class", "g-focus");

		gfocus.selectAll("circle.data-points")
			.data(all_points)
			.enter().append("circle")
				.attr("class", "data-points");        
	
		gfocus.selectAll("circle.data-points-hidden")
			.data(all_points)
			.enter().append("circle")
				.attr("class", "data-points-hidden");  
		
		gfocus.selectAll("circle.data-points")
			.attr("r", 2)
			.attr("clip-path","url(#t1clip)")
			.attr("cx", function(d){ return x(dataset[d[0]][x_variable]) }) // d[0] is the row_num, d[1] is the column name
			.attr("cy", function(d){ return y(dataset[d[0]][d[1]]) })
			.attr("fill", function(d){ return colors[y_variable.indexOf(d[1])];}); //rgba(255,0,0,1) would make the circles red
		
		gfocus.selectAll("circle.data-points-hidden")
			.attr("r", 7)
			.attr("clip-path","url(#t1clip)")
			.attr("cx", function(d){ return x(dataset[d[0]][x_variable]) }) // d[0] is the row_num, d[1] is the column name
			.attr("cy", function(d){ return y(dataset[d[0]][d[1]]) })
			.attr("fill", "rgba(1,0,0,0)")//function(d){ return colors[y_variable.indexOf(d[1])];}) //rgba(255,0,0,1) would make the circles red
			.on("mouseover", function(d){
				// 
				// DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER 
				// [Q] Há aqui um bug... Amanhã falamos.
				// DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER DISCLAIMER 
				// 
				// now our events can have context!
				// the d argument as things like :
				// [27, "NA_Sales"]
				// [30, "NA_Sales"]
				// ...
				// we can use d to look for stuff in the dataset var or in data_utils
				// 
				// Also, for code inspiration purposes, this is pretty much the same kind of circles from T5... :)
				// 
				// 
				// 
				
				var row_num = d[0];
				var column_name = d[1];

				var year = dataset[row_num][x_variable].getFullYear() + ".0";
				var all_rownums = datasources["index_"+x_variable].index[year];

				dispatch.call("gamehover", null, d, all_rownums, dataset);
				appdispatch.gamehover.call("gamehover", null, all_rownums, "t1");

				var textForm = d3.format(".3f");
			
				// this is kind of the same as Iris did.
				focus.attr("transform", "translate(" + x(dataset[row_num][x_variable]) + "," + y(dataset[row_num][column_name]) + ")");
				focus.select("text").text(function() { return textForm(dataset[row_num][column_name]); });
				focus.select(".x-hover-line").attr("y2", yrange[1]- y(dataset[row_num][column_name]));
				focus.select(".y-hover-line").attr("x2", w + w);
				
				focus.style("display", null); 
				d3.selectAll(".hover-line").style("stroke","fuchsia");//colors[y_variable.indexOf(column_name)]);
				d3.selectAll(".focus").style("stroke","black");
				d3.selectAll(".focus circle").style("stroke","fuchsia");//colors[y_variable.indexOf(column_name)]);
			})
			.on("mouseout", function(d){
				// lets notify ourselves!
				var row_num = d[0];
				var column_name = d[1];

				var year = dataset[row_num][x_variable].getFullYear() + ".0";
				var all_rownums = datasources["index_"+x_variable].index[year];

				dispatch2.call("gameout", null, d, all_rownums, dataset);
				appdispatch.gameout.call("gameout", null, all_rownums, "t1");

				focus.style("display", "none");
			});

		//////////////////////////////////////////////////////////////////////////BEGIN BRUSH
		
		var brush_height = 15;//h - padding - yoffset;
		
		y_brush = d3.scaleLinear()
			.range([brush_height,yrange[1]]);
		x_brush = d3.scaleTime()
			.range([xrange[0],xrange[1]]);
		
		//definir o domain de cada eixo
		x_brush.domain(x.domain());
		

		var xaxis_brush = d3.axisBottom()
			.scale(x_brush);
		
		brush = d3.brushX()
			.extent([[xrange[0],0],[xrange[1],brush_height]])
			.on("brush end", brushed);
		
		context = svg.append("g")
			.attr("class","context")
			.attr("transform","translate(0,"+ (yrange[1]+35)+")");
		context.append("g")
			.attr("class","axis axis--x")
			.attr("transform","translate(0," + brush_height + ")" )
			.call(xaxis_brush);
		context.append("g")
			.attr("class","brush")
			.call(brush)
			.call(brush.move, x_brush.range());
		
		//////////////////////////////////////////////////////////////////////////END BRUSH

	};
window.drawt1 = drawt1;    
window.setSizest1 = setSizest1;
})();