;(function(){
    function drawt1(){

        //var dataset = data_utils.read_column(null, ["JP_Sales", "EU_Sales", "NA_Sales", "Year_of_Release"]);
        var dataset = data_utils.get_sales_sum(null,"Developer","Nintendo");
        console.log(dataset);
        var r = dataset.map(a => a.Year_of_Release);
        var maxYear = r.reduce(function(a,b){ return Math.max(a,b);});
        var minYear = 1987;
        
        dataset.sort(function(x,y) { return d3.ascending(x.Year_of_Release, y.Year_of_Release)} );
        
        d3.select("#t1Viz > img")
                .remove();

        var w = 400;
        var h = 300;
        var padding = 30;

        x_variable = "Year_of_Release";
		y_variable = "JP_Sales";

        var svg = d3.select("#t1Viz").append("svg")
            .attr("width", w)
            .attr("height",h);
        
		var y = d3.scaleLinear()
			.range([padding,h-padding]);

		var x = d3.scaleLinear()
            .range([padding,w-padding]);


        var valueline = d3.line()
            .x(function(d) {return x(d.Year_of_Release);})
            .y(function(d) {return y(d.JP_Sales);});
        
        var valueline2 = d3.line()
            .x(function(d) {return x(d.Year_of_Release);})
            .y(function(d) {return y(d.EU_Sales);});
        
        var valueline3 = d3.line()
            .x(function(d) {return x(d.Year_of_Release);})
            .y(function(d) {return y(d.NA_Sales);});

        x.domain([minYear,maxYear]);
        y.domain([d3.max(dataset, function(d){ return d["NA_Sales"]; }),0]);
        var yaxis = d3.axisLeft()
            .scale(y);

		var xaxis = d3.axisBottom()
            .scale(x);
        
        svg.append("g")
            .attr("transform","translate(30,0)")
            .attr("class","y axis")
            .call(yaxis);
        
        svg.append("g")
            .attr("transform","translate(0,"+(h-padding)+")")
            .call(xaxis);    

        svg.append("path")
            .datum(dataset)
            .attr("fill","none")
            .attr("stroke","steelblue")
            .attr("stroke-width",1.5)
            .attr("d",valueline);

        svg.append("path")
            .datum(dataset)
            .attr("fill","none")
            .attr("stroke","red")
            .attr("stroke-width",1.5)
            .attr("d",valueline2);
        
        svg.append("path")
            .datum(dataset)
            .attr("fill","none")
            .attr("stroke","green")
            .attr("stroke-width",1.5)
            .attr("d",valueline3);
        
    };
window.drawt1 = drawt1;    
})();