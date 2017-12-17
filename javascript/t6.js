;(function(){
	var w = -1;
	var h = -1;
    var gridSizeX = 40;
    var gridSizeY = 25;
    var legendElementWidth = -1;
    var buckets = 10;
	var padding = 20;
    
	var xoffset = 30;
	var yoffset = 30;
    
	var xcutoff = 30;
	var ycutoff = 30;
    
    var dataset;
    var initdropdowns_quirk = false;
    var aux;
    var y_brush, x_brush,xrange=[];
    var xScale, yScale;
    var scoreLabels;
    var legendYoffset, legendXoffset;
    
    var colors = ["#ffffd9","#edf8b1","#c7e9b4","#7fcdbb","#41b6c4","#1d91c0","#225ea8","#253494","#081d58","#000000"];
    var emptyColor = "#ffffff";
    var scoreIntervals = ["90/100","80/90","70/80","60/70","50/60","40/50","30/40","20/30","10/20","0/10"];
    var years;
    
    var localstate = {
		datasetRows: [],
		selectedRows: [],
		highlightedRows: [],
		data_slices: {},
		clearbrush_quirk: null,
        selectedAttr: "Genre",
        selectedValue: "Action"
	};

	function setSizest6(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
        legendElementWidth = gridSizeX;
        legendYoffset = 60;
        legendXoffset = 120;
	}
    
    function initDropdowns(){
		if(!initdropdowns_quirk){
			initdropdowns_quirk = true;

			resetDropdownValues();
			
			dropdown_util.setSelection_values('.t6Values', appstate.data_slices["t6Mean_UserCritic_Score"][1]);
            
			dropdown_util.register_listener("#t6Atts", function(idx, value_str){
				value_str = value_str.split(" ").join("_");
				resetDropdownValues();
				slice_util.clearSlice(appstate.data_slices, "t6Mean_UserCritic_Score", "");
				slice_util.setSlice(appstate.data_slices, "t6Mean_UserCritic_Score", "", value_str, null);
				appdispatch.dataslice.call("dataslice", this, "t6");
			});

			dropdown_util.register_listener("#t6Values", function(idx, value_str){
				var current_dropdownatt = dropdown_util.read_atts();
				slice_util.setSlice(appstate.data_slices, "t6", "", current_dropdownatt, value_str)
				appdispatch.dataslice.call("dataslice", this, "t6");
			});
		}
	};
    
    function resetDropdownValues(){
		var current_dropdownatt = dropdown_util.read_atts(".t6Atts");
		localstate.dropdown_vals = data_utils.get_uniquevalues_dataset(current_dropdownatt);
		dropdown_util.setValueList_values(".t6Values", localstate.dropdown_vals);
	};

    function drawt6(app_row_numbers){
        if(typeof svgelement === "undefined"){
			svg = d3.selectAll("#t6Viz svg");
		}
		else{
			svg = d3.select(svgelement);
		}
        
        localstate.datasetRows = app_row_numbers;
		dataset = data_utils.read_column(localstate.datasetRows,["Mean_UserCritic_Score","Year_of_Release"]);
        years = data_utils.get_uniquevalues_dataset("Year_of_Release");
        years.reverse();
        var index = years.indexOf("2017.0");
        years.splice(index,1);
        index = years.indexOf("2020.0");
        years.splice(index,1);
        
        
		//initDropdowns();
        aux = new Array(years.length);
        for(var i = 0; i< years.length; i++){
            aux[i] = new Array(scoreIntervals.length);
        }
        initt6();
        createScroll();
    }
    
    function getNumber(d){
        var yearInd = years.findIndex(x=> x == d.year);
        var intInd = scoreIntervals.findIndex(x => x == d.interval);
        if(aux[yearInd][intInd] == -1){ return emptyColor};
        return aux[yearInd][intInd];
    }

    
    function createScroll(){
        var content = document.getElementById("t6Viz");
        content.addEventListener('scroll',function(evt){
            var head = document.getElementById("score-container");
            var children = head.children;
            var n = 0;
            for(var i = 0; i < children.length; i++){
                if(head.children[i].getAttribute("id") == "score"){
                    head.children[i].setAttribute("transform","translate("+ (xScale+ gridSizeX*n) + ","+ (yoffset+this.scrollTop) +") rotate(-40)");
                    n++;
                }else if(head.children[i].getAttribute("id") == "score-rect"){
                    head.children[i].setAttribute("y",this.scrollTop);
                }
            }
            
            var heatmapLegends = document.getElementsByClassName("legend-heatmap");
            for(var i = 0; i < heatmapLegends.length; i++){
                document.getElementsByClassName("legend-heatmap")[i].children[0].setAttribute("y", legendElementWidth * i + legendYoffset + this.scrollTop);
                document.getElementsByClassName("legend-heatmap")[i].children[1].setAttribute("y", legendElementWidth * i + legendYoffset + 25 + this.scrollTop);
                
            }
            
            
            
        }, false);
    }
    
    function drawHighlightt6(from_target){
        
    }
    
    
    // Create Event Handlers for mouse
    function handleMouseOver(d, i) {  
    }

    function handleMouseOut(d, i) {

    }
    
	function initt6(){	
        d3.select("#t6Viz > img").remove();
        var row_indexes = data_utils.get_index(["Genre"],["Shooter"]);
        var dataset = data_utils.read_column(row_indexes,["Mean_UserCritic_Score","Year_of_Release"]);
        

        yScale = ycutoff + yoffset+padding;
        xScale = xcutoff  + xoffset+50;
        xrange[0] = padding + xoffset;
		xrange[1] = w-padding - xcutoff;
        
        svg = d3.select("#t6Viz").append("svg")
                                .attr("width", w)
                                .attr("height", h+500);
        

        
        var yearLabels = svg.selectAll(".yearLabel")
            .data(years)
            .enter().append("text")
                .attr("class","year-legend");
    
        svg.selectAll(".year-legend")    
            .attr("transform",function(d,i){
                return "translate(" + (padding + xoffset )+"," + (yScale + gridSizeY* i)+ ")";
            })
            .style("text-anchor","middle")                
            .attr("class",function(d,i){return ((i>=0 && i<=40) ? "yearLabel mono axis axis-year" : "yearLabel mono axis");})
            .text(function(d){ return d.split(".")[0]; });
       



        
        var setInterval = function(value){
            if(value >= 90 && value < 100){
                return scoreIntervals[0];
            }
            else if(value >= 80 && value < 90){
                return scoreIntervals[1];
            }
            else if(value >= 70 && value < 80){
                return scoreIntervals[2];
            }
            else if(value >= 60 && value < 70){
                return scoreIntervals[3];
            }
            else if(value >= 50 && value < 60){
                return scoreIntervals[4];
            }
            else if(value >= 40 && value < 50){
                return scoreIntervals[5];
            }
            else if(value >= 30 && value < 40){
                return scoreIntervals[6];
            }
            else if(value >= 20 && value < 30){
                return scoreIntervals[7];
            }
            else if(value >= 10 && value < 20){
                return scoreIntervals[8];
            }
            else if(value < 10){
                return scoreIntervals[9];
            }
        };
        
        
        var grouped = [];

        
        dataset.forEach(function(d,i){
            
            var interval = setInterval(d.Mean_UserCritic_Score);
            var year = d.Year_of_Release;
            
            grouped.push({
                year: year,
                interval: interval,
                value: d.Mean_UserCritic_Score
            });
            
            var yearInd = years.findIndex(x=> x == year);
            var intInd = scoreIntervals.findIndex(x => x == interval);
            
            var element = aux[yearInd][intInd];
            if(element == null)
                aux[yearInd][intInd] = 1;
            else
                aux[yearInd][intInd]+= 1;
        });
        
        for(var i = 0; i< years.length; i++){
            for(var j = 0; j < scoreIntervals.length; j++){
                if(aux[i][j]==null){
                    aux[i][j] = -1;
                    grouped.push({
                        year: years[i],
                        interval: scoreIntervals[j],
                        value: 0
                    })
                }
            }
        }
        
        
        
        var colorScale = d3.scaleQuantile()
                        .domain([0, buckets - 1, d3.max(grouped, function(d){      
                            return getNumber(d);
                        })])
                        .range(colors);
        
        var cards = svg.selectAll(".year")
                .data(grouped, function(d){
                    return d.interval + ":" + d.year;
                });

        cards.append("title");
        
        cards.enter().append("rect")
            .attr("x", function(d,i){ return xcutoff+ xoffset+10 +(scoreIntervals.findIndex(x => x == d.interval) ) * gridSizeX; })
            .attr("y", function(d,i){ return yoffset+ycutoff+4 + (years.findIndex(x=> x ==d.year)) * gridSizeY; })
            .attr("class","score bordered")
            .attr("width", gridSizeX)
            .attr("height", gridSizeY)
            .style("fill", function(d){
                if(!isNaN(getNumber(d)) )
                    return colorScale(getNumber(d))
                return getNumber(d);
            })
            .on("mouseover",handleMouseOver)
            .on("mouseout", handleMouseOut);
        
        
        var legend = svg.selectAll(".legend-heatmap")
            .data([0].concat(colorScale.quantiles()), function(d){ return d; });
        
        legend.enter().append("g")
            .attr("class","legend-heatmap");
        
        svg.selectAll(".legend-heatmap").append("rect")
            .attr("id","legend-heatmap-rect")
            .attr("x", w-legendXoffset)
            .attr("y",function(d,i){ return legendElementWidth * i + legendYoffset;})
            .attr("width", gridSizeX/2)
            .attr("height", legendElementWidth)
            .style("fill", function(d,i){ return colors[i];});
        
        svg.selectAll(".legend-heatmap").append("text")
            .attr("class", "mono")
            .attr("id","legend-heatmap-text")
            .style("fill","#000000")
            .text(function(d) { return "≥ " + Math.round(d); })
            .attr("x", w-legendXoffset+30)
            .attr("y", function(d,i){ return legendElementWidth * i + legendYoffset + 25;});
        
        var container = svg.append("g").attr("id","score-container");
        container.append("rect")
            .attr("id","score-rect")
            .attr("x",0)
            .attr("y",0)
            .attr("width",500)
            .attr("height",60)
            .style("fill","#eee");
        
        scoreLabels = container.selectAll(".scoreLabel")
            .data(scoreIntervals)
            .enter().append("text").attr("transform",function(d,i){
                    return "translate("+ (xScale+ gridSizeX*i) + ","+ (yoffset)+ ") rotate(-40)"
                })
                .attr("id","score")
                .attr("class",function(d,i){return ((i>=0 && i<=9) ? "scoreLabel mono axis axis-interval" : "scoreLabel mono axis");})
            .text(function(d){return d;})
            .style("text-anchor","end"); 
        
            

        
        
	};
    
    window.drawt6 = drawt6;
    window.setSizest6 = setSizest6;
})();