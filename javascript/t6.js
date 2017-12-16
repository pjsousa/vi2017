;(function(){
	var w = -1;
	var h = -1;
    var gridSizeX = 25;
    var gridSizeY = 20;
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
        legendElementWidth = gridSizeY*2;
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
		//initDropdowns();
        aux = new Array(years.length);
        for(var i = 0; i< years.length; i++){
            aux[i] = new Array(scoreIntervals.length);
        }
        initt6();
    }
    
    function getNumber(d){
        var yearInd = years.findIndex(x=> x == d.year);
        var intInd = scoreIntervals.findIndex(x => x == d.interval);
        if(aux[yearInd][intInd] == -1){ return emptyColor};
        return aux[yearInd][intInd];
    }
    
	function initt6(){	
        d3.select("#t6Viz > img").remove();
        var row_indexes = data_utils.get_index(["Genre"],["Action"]);
        var dataset = data_utils.read_column(row_indexes,["Mean_UserCritic_Score","Year_of_Release"]);
        

        var yScale = ycutoff + yoffset;
        var xScale = xcutoff  + xoffset;
        
        svg = d3.select("#t6Viz").append("svg")
                                     .attr("width", w)
                                     .attr("height", h);
        
        var scoreLabels = svg.selectAll(".scoreLabel")
            .data(scoreIntervals)
            .enter().append("text")
                .text(function(d){return d;})
                .style("text-anchor","end")
                .attr("transform",function(d,i){
                    return "translate("+ (padding + xoffset )+"," + (yScale + gridSizeY* i)+ ")";
                })
                .attr("class",function(d,i){return ((i>=0 && i<=9) ? "scoreLabel mono axis axis-interval" : "scoreLabel mono axis");});
        
        var yearLabels = svg.selectAll(".yearLabel")
            .data(years)
            .enter().append("text")
                .attr("class","year-legend");
    
        svg.selectAll(".year-legend")    
            .attr("transform",function(d,i){
                return "translate(" + (xScale+ gridSizeX*i) + ","+ yoffset+ ") rotate(40)";
            })
            .style("text-anchor","middle")                
            .attr("class",function(d,i){return ((i>=0 && i<=22) ? "yearLabel mono axis axis-year" : "yearLabel mono axis");})
            .text(function(d){ return d; });
       


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
            .attr("y", function(d,i){ return yoffset+15 +(scoreIntervals.findIndex(x => x == d.interval) ) * gridSizeY; })
            .attr("x", function(d,i){ return xScale + (years.findIndex(x=> x ==d.year)) * gridSizeX; })
            .attr("class","score bordered")
            .attr("width", gridSizeX)
            .attr("height", gridSizeY)
            .style("fill", function(d){
                if(!isNaN(getNumber(d)) )
                    return colorScale(getNumber(d))
                return getNumber(d);
            });
        
        
        var legend = svg.selectAll(".legend")
            .data([0].concat(colorScale.quantiles()), function(d){ return d.value; });
        
        legend.enter().append("g")
            .attr("class","legend");
        
        legend.append("rect")
            .attr("x", function(d,i){ return legendElemetnWidth * i;})
            .attr("y",h)
            .attr("width", legendElementWidth)
            .attr("height", gridSizeY/2)
            .style("fill", function(d,i){ return colors[i];});
        
        legend.append("text")
            .attr("class", "mono")
            .text(function(d) { return "≥ " + Math.round(d); })
            .attr("x", function(d, i) { return legendElementWidth * i; })
            .attr("y", h + gridSizeY);
        
        
	};
    
    window.drawt6 = drawt6;
    window.setSizest6 = setSizest6;
})();