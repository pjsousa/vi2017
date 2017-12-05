;(function(){
	var w = -1;
	var h = -1;
	var padding = 20;
	var xoffset = 30;
	var yoffset = 30;
	var xcutoff = 100;
	var ycutoff = 0;

	function setSizest6(boundingRect){
		w = boundingRect.width;
		h = boundingRect.height;
		console.log(w,h);
	}

	function drawt6(){	
        d3.select("#t1Viz > img").remove();
        var dataset = data_utils.get_records(["Genre"],["Action"]);
        var row_indexes = data_utils.get_index(["Genre"],["Action"]);
        var sales_numbers = data_utils.read_column(row_indexes,["Mean_UserCritic_Score"]);
        
        
        var svgContainer = d3.select("#t6Viz").append("svg")
                                     .attr("width", 200)
                                     .attr("height", 200);
        //Draw the Rectangle
        var rectangle = svgContainer.append("rect")
                             .attr("x", 10)
                             .attr("y", 10)
                            .attr("width", 50)
                            .attr("height", 100);
        
	};
    window.drawt6 = drawt6;
})();