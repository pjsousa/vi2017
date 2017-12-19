;(function(){
	var w = -1;
	var h = -1;
	var padding = 30; //30
	var xoffset = 40;
	var yoffset = 30;//30
	var xcutoff = 100; //40
	var ycutoff = 30;
	var r = 2;


	var x_variable = "Year_of_Release";
	var y_variable = ["JP_Sales", "EU_Sales", "NA_Sales"];
	var colors = [ "#cf171a", "#4e92ca", "#4daf4a" ]; // these were +- taken from color brewer [68%, 70%, 49%]

	var dispatch = d3.dispatch("gamehover", "gameout", "dropdowvals");

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
	
	var localstate = {
		datasetRows: [],
		drawnRows: [],
		selectedRows: [],
		highlightedRows: [],
		data_slices: {},
		clearbrush_quirk: null,
		selectedGenre: null
	};
	var initdropdowns_quirk = false;
		
	dispatch.on("gamehover.lineplot", function(d, all_rownums, dataset){
		// lets place ALL the rows in highligh!
		all_rownums.forEach(function(row_num){
			appstate.highlightedRows.push(row_num);
		});
	});

	dispatch.on("gameout.lineplot", function(d, all_rownums, dataset){
		all_rownums.forEach(function(row_num){
			appstate.highlightedRows.splice(appstate.highlightedRows.indexOf(row_num), 1);
		});
	});

	dispatch.on("dropdowvals", function(idx, value_str){
		var current_dropdownatt = dropdown_util.read_atts(".t1Atts");
		localstate.selectedGenre = value_str;
		slice_util.setSlice(localstate.data_slices, "t1", "Genre", current_dropdownatt, value_str);

		d3.select("#cleart1")
			.style("visibility", "visible")
			.style("pointer-events", "all");

		localstate.drawnRows = slice_util.sliceRows(localstate.data_slices, localstate.datasetRows);
		dataset = data_utils.get_sales_sum(localstate.drawnRows, localstate.selectedGenre);
		initt1();

		appdispatch.dataslice.call("dataslice", this, "t1", localstate.drawnRows);
	});

	function brushed(isend) {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom"){
			return; // ignore brush-by-zoom
		}

		var s = d3.event.selection || x_brush.range();

		var range = x_brush.range();

		var domain_vals = s
			.map(x_brush.invert, x_brush)
			.map(function(e){ return e.getFullYear(); });

		if(s[1]-s[0] <=160 || s[1]-s[0] < 0){
				svg.select(".selection").attr("width","160");
				s[1] = s[0]+160;
				if(s[1]>range[1]){
						s[1] = range[1];
						s[0] = range[1] - 160;
						svg.select(".handle--w").attr("x",s[1]-160);
						svg.select(".selection").attr("x",s[1]-160-3);
				}
				svg.select(".handle--e").attr("x",s[1]);
		}

		if(s[1] <= range[1]){
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

			if(isend){
				slice_util.setSlice(localstate.data_slices, "t1", "", domain_vals[0], domain_vals[1]);
				localstate.drawnRows = slice_util.sliceRows(localstate.data_slices, localstate.datasetRows);

				appdispatch.dataslice.call("dataslice", this, "t1", localstate.drawnRows);
			}
		}
	}

	function zoomed() {
		if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush"){
			return; // ignore zoom-by-brush
		}

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
	};

	function setSizest1(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;

	}
    
    function showInfo(){
        var modal = document.getElementById('myModal');
        var btn = document.getElementById("button-info-line");
        var span = document.getElementsByClassName("close")[4];
        var text = document.getElementById("info-text");

        // When the user clicks on the button, open the modal 
        btn.onclick = function() {
            modal.style.display = "block";
            text.innerHTML = "This graph ilustrates the sales evolution of a specific genre over time. To change the genre, select one of the options from the drop down menu. To show fewer or more years, increase the size of the grey bar by clicking on one of its sides with the mouse, and dragging the bar. You can also move the bar to show different intervals.";
        }

        // When the user clicks on <span> (x), close the modal
        span.onclick = function() {
            modal.style.display = "none";
        }

        // When the user clicks anywhere outside of the modal, close it
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        }
        
        
    }
    

	function cleardropdownt1_click(evt){
		resetDropdownValues();

		var current_dropdownatt = dropdown_util.read_atts(".t1Atts");
		localstate.selectedGenre = null;
		slice_util.clearSlice(localstate.data_slices, "t1", "Genre")
		slice_util.setSlice(localstate.data_slices, "t1", "Genre", current_dropdownatt, null);
		
		d3.select("#cleart1")
			.style("visibility", "hidden")
			.style("pointer-events", "none");

		localstate.drawnRows = slice_util.sliceRows(localstate.data_slices, localstate.datasetRows);

		dataset = data_utils.get_sales_sum(localstate.drawnRows, localstate.selectedGenre);
		initt1();

		appdispatch.dataslice.call("dataslice", this, "t1", localstate.drawnRows);
		evt.preventDefault();
	};


	function initDropdowns(){

		if(!initdropdowns_quirk){
			initdropdowns_quirk = true;

			resetDropdownValues();

			dropdown_util.setSelection_values('.t1Values', appstate.data_slices["t1Genre"][1]);

			dropdown_util.register_listener("#t1Values", function(idx, value_str){
				dispatch.call("dropdowvals", null, idx, value_str);
			});
		}
	};

	function resetDropdownValues(){
		var current_dropdownatt = dropdown_util.read_atts(".t1Atts");
		localstate.dropdown_vals = data_utils.get_uniquevalues_dataset(current_dropdownatt);
		dropdown_util.setValueList_values(".t1Values", localstate.dropdown_vals);
	};
	
	function drawt1(app_row_numbers){
		if(typeof svgelement === "undefined"){
			svg = d3.selectAll("#t1Viz svg");
		}
		else{
			svg = d3.select(svgelement);
		}

		localstate.datasetRows = app_row_numbers;
		localstate.drawnRows = localstate.datasetRows
		dataset = data_utils.get_sales_sum(localstate.drawnRows, localstate.selectedGenre);

		initDropdowns();

		initt1();

		showInfo();
	};

	function initt1(){
		/*
			"Drawing t1" means:
				1) ...
				2) ...
				
				The frequency of the viz are ...
		 */
		var t0 = svg.transition().duration(100);
		var t1 = svg.transition().delay(100).duration(500);

		var r = dataset.map(a => a.Year_of_Release);
		var maxYear = r.reduce(function(a,b){ return Math.max(a,b);});
		var minYear = 1987;

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
			.call(zoom)
								.on("wheel.zoom", null);
		
		//definir o eixo y
		y = d3.scaleLinear()
			.range([yrange[0],yrange[1]]);

		//definir o eixo x e passar os anos de floats para anos
		var parseTime = d3.timeParse("%Y")
			bisectDate = d3.bisector(function(d){return d.Year_of_Release;}).left;
		dataset.forEach(function(d) {
			var date = d.Year_of_Release.split(".");
			if(date[0]==-1){
				date[0] = 1995;
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
			.scale(x)
						.tickFormat(d3.timeFormat("%Y"));
		
		//legendas   
		var legW = 200;
		var legH = 100;
        d3.select("#t1Viz").selectAll("div.t1Legend").selectAll(".legend").remove();
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
			
			legend.append("rect")
				.attr("x",5)
				.attr("y",legendSpace * i/2 + legendSpace - 10)
				.attr("width", 4)
				.attr("height", 10)
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
		svg.select(".focus").remove();
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
			.attr("y",yrange[0]-10)
			.attr("width",xrange[1]-xrange[0])
			.attr("height",yrange[1]-yrange[0]+10);
		
				svg.select(".y-axis-label").remove();
				svg.select(".y-axis").remove();
				svg.select(".axis--x").remove();
				svg.select(".x-axis-label").remove();
				
		svg.append("g")
			.attr("transform","translate("+(xrange[0])+",0)")
			.attr("class","y-axis")
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
				
        svg.select(".line1").remove();
		svg.append("path")
			.datum(dataset) 
			.attr("class", "line1")
			.attr("clip-path","url(#t1clip)")
			.attr("fill","none")
			.attr("stroke",colors[0])
			.attr("stroke-width",3)
			.attr("d",valueline);

        svg.select(".line2").remove();
		svg.append("path")
			.datum(dataset)
			.attr("class", "line2")
			.attr("clip-path","url(#t1clip)")
			.attr("fill","none")
			.attr("stroke",colors[1])
			.attr("stroke-width",3)
			.attr("d",valueline2);
		
        svg.select(".line3").remove();
		svg.append("path")
			.datum(dataset)
			.attr("class", "line3")
			.attr("clip-path","url(#t1clip)")
			.attr("fill","none")
			.attr("stroke",colors[2])
			.attr("stroke-width",3)
			.attr("d",valueline3);


		var all_points = d3.range(dataset.length)
			.map(function(itr_x){ return y_variable.map(function(itr_y){ return [itr_x, itr_y]; })});
				
		all_points = _.flatten(all_points);
				
        svg.selectAll("g.g-focus").remove();
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
			.attr("r", 4)
			.attr("clip-path","url(#t1clip)")
			.attr("cx", function(d){ return x(dataset[d[0]][x_variable]) }) 
			.attr("cy", function(d){ return y(dataset[d[0]][d[1]]) })
			.attr("fill", function(d){ return colors[y_variable.indexOf(d[1])];}); 
		
		gfocus.selectAll("circle.data-points-hidden")
			.attr("r", 7)
			.attr("clip-path","url(#t1clip)")
			.attr("cx", function(d){ return x(dataset[d[0]][x_variable]); })
			.attr("cy", function(d){ return y(dataset[d[0]][d[1]]) })
			.attr("fill", "rgba(1,0,0,0)")
			.on("mouseover", function(d){
				var row_num = d[0];
				var column_name = d[1];

				var year = dataset[row_num].Year_of_Release;//raw_value(row_num,x_variable);
				var sales = dataset[row_num][column_name];
				var all_rownums = datasources["index_"+x_variable].index[year.getFullYear()+".0"];

				dispatch.call("gamehover", null, d, all_rownums, dataset);
				appdispatch.gamehover.call("gamehover", null, all_rownums, "t1");

				var textForm = d3.format(".3f");
				focus.attr("transform", "translate(" + x(year) + "," + y(sales) + ")");
				focus.select("text").text(function() { return textForm(sales); });
				focus.select(".x-hover-line").attr("y2", yrange[1]- y(sales));
				focus.select(".y-hover-line").attr("x2", w + w);

				focus.style("display", null);
				d3.selectAll(".hover-line").style("stroke","rgb(255, 86, 0)");//colors[y_variable.indexOf(column_name)]);
				d3.selectAll(".focus").style("stroke","black");
				d3.selectAll(".focus circle").style("stroke","rgb(255, 86, 0)");//colors[y_variable.indexOf(column_name)]);
			})
			.on("mouseout", function(d){
				// lets notify ourselves!
				var row_num = d[0];
				var column_name = d[1];

				var year = dataset[row_num].Year_of_Release;//raw_value(row_num,x_variable);
				var sales = dataset[row_num][column_name];

				var all_rownums = datasources["index_"+x_variable].index[year.getFullYear()+".0"];

				dispatch.call("gameout", null, d, all_rownums, dataset);
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
			.on("brush", brushed.bind(null, false))
			.on("end", brushed.bind(null, true))

		svg.select(".context").remove();
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
			.call(brush.move, [xrange[1]-200,xrange[1]]);
        


		//////////////////////////////////////////////////////////////////////////END BRUSH
	};

	localstate.data_slices = slice_util.slicerules_factory();

	window.drawt1 = drawt1;
	window.setSizest1 = setSizest1;
	window.cleardropdownt1_click = cleardropdownt1_click;
})();

