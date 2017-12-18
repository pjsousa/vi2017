;(function(){
/*
var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = 600 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

// Parse the date / time
var	parseDate = d3.time.format("%Y-%m").parse;

var x_variable = "Percentage";
var y_variable = "Rating";
  */   	
    
    //t4 viewport
    var w = 400;// -1;//500
    var h = 380;//-1;//420
   
    //number of different ratings to display 
    var number_of_ratings = 9;
    
    //small multiple dimensions
    var small_mult_per_column = 3;
    var small_mult_width = 120;
    var small_mult_height = 80;
    var space_bet_mult_y = 3;
    var space_bet_mult_x = 20;
    
    //title (header) of the small multiple dimensions
    var small_multiple_title_height = 20;
    var title_padding_y = 5;
    
    //small multiple position
    var current_col = -1;
    var current_row = 0;
    
    //bar dimensions
    var bar_width = small_mult_width;
    var bar_height = small_mult_height / number_of_ratings - 5;
    var space_bet_bar_y = 5;
    
    //
    var current_year_index;
    
    var wscale = d3.scaleLinear()
                 .domain([0, 100])
                 .range([0, small_mult_width - 20])
    ;
    
    var hscale = d3.scaleOrdinal()
                    .domain(["E", "T", "M", "E10", "AO", "EC", "KA", "RP", "Unknown"])
                    .range([0, small_mult_height])
    ;
    
    var xaxis = d3.axisTop()
                    .scale(wscale)
                    .ticks(3)
                    .tickFormat(d3.format(".0s"))
    ;
    
    var yaxis = d3.axisLeft()
                    .scale(hscale)
                    .ticks(10)
    
    ;
                
    
    var formatPercent = d3.format(".0%");
    
    function drawt4(app_row_numbers){
        //DATA RELATED   
        //dataset contains the count of each rating for each year p.e. 
        //{Year_of_Release: "2001.0", E: 205, T: 107, M: 27, E10+: 0, …}
        dataset = data_utils.get_rating_counts(app_row_numbers);
        
        dataset.sort(function(x,y) { return d3.descending(x.Year_of_Release, y.Year_of_Release)} );
        
//DRAWING RELATED
        d3.select("#t4Viz > img")
				.remove();
        
        //drawing viewport
        var svg = d3.select("#t4Viz")
                //.data([0]).enter()
                .append("svg")
                .attr("id", "t4viewport")
                .attr("width", w)
                .attr("height", h)
                ;
//GOOD ONE
            svg.selectAll("svg.small_multiples")
                .data(dataset)
                    .enter().append("svg")
                    .attr("id", function(d, i) { return get_year(d, i); } )
                    .attr("class", "small_multiples")
                    .attr("width", small_mult_width)
                    .attr("height", small_mult_height)
                    .attr("y", function(d, i) {return calc_mult_y(i); } )   
                    .attr("x", function(d, i) {return calc_mult_x(i); } ) 
                    //this calculates the rating with the highest count for this year, so that this value can be used when doing percentages for each bar
                    .attr("max", function (d) { var yearly_ratings = Object.values(d); 
                                               yearly_ratings = yearly_ratings.slice(1, yearly_ratings.length);
                                               var max = yearly_ratings.reduce(function(a, b) {
                                                    return Math.max(a, b);
                                                });
                                               return max; } ) 
                    //title of each small multiple
                    .append("text")
                        .attr("dy", ".71em")
                        .attr("text-anchor", "start")
                        .attr("font-size", "1.1em")
                        //.attr("y", 10)
                        .text(function (d, i) { return d.Year_of_Release.substring(0, 4); } )
        //eixos    
        svg.selectAll("svg.small_multiples")
                    .append("g")
                        .attr("transform","translate(20, " + small_multiple_title_height + ")")  
                        .attr("class","x axis")
                        .attr("width", small_mult_width - 20)
                        .call(xaxis)  
                    svg.selectAll("svg.small_multiples")
                        .append("g")
                        .attr("transform","translate(20, " + small_multiple_title_height + ")") 
                        .attr("class", "y axis")
                        .call(yaxis)

            //cada barra do multiple
            svg.selectAll("svg.small_multiples")
                    .each(function (itr) { 
                        d3.select(this).selectAll("rect.datapoints")
                        .data(["E", "T", "M", "E10", "AO", "EC", "KA", "RP", "Unknown"]).enter()
                        .append("rect")
                        .attr("class", "datapoints")
                        .attr("id", function(d) { return d; } )//function(d, i) { return calc_bar_id(d, i); } )
                        .attr("x", function(d, i) { return calc_bar_x(d, i) ; } )
                        .attr("y", function(d, i) {return calc_bar_y(d, i); } )
                        .attr("width", function(d) {    var thisValue = itr[d]; 
                                                        var parentXValue = d3.select(this.parentNode).attr("max");
                                                        var finalWidth = ( thisValue / parentXValue ) * small_mult_width; 

                                                        return finalWidth; } )
                        .attr("height", bar_height)
                        .attr("fill", "blue")
                    })
        
                    //each bar of multiple multiple_index   
                    /*.selectAll("rect")
                    .data(dataset)
                    .enter().append("rect")
                        .attr("width", function(d, i) { calc_bar_width(d, i); } )
                        .attr("height", bar_height)
                        .attr("x", function(d, i) { calc_bar_x(d, i); } )
                        .attr("y", function(d, i) { calc_bar_y(d, i); } )
                        .attr("fill", "black")*/
                    ;      
       } 
    
        function calc_small_multiple_max_width(itr_data)
    {
        var thisValue = itr_data; 
        var parentXValue = d3.select(this.parentNode).attr("max");
        var finalWidth = ( thisValue / parentXValue ) * small_mult_width; 
        
        return finalWidth;
    }
    
        function calc_translate(i)
        {
            var x = calc_mult_x(i);
            var y = calc_mult_y(i);
            return "translate(" + x + ", " + y + ")";
        }
    
        function what_year(d,i)
        {
            //console.log(Object.values(d));
            return Object.values(d);
        }
    
        function calc_bar_id(d, i)
        {
            console.log("d: " + d + "i: " + i );
        if(i == 0)
            return "AO = " + d.AO;
        else if(i == 1)
            return "E = " + d.E;
        else if(i == 2)
            return "E10+ = " + d.E10;
        
            else return 5;//d.M;
        }
    
        function calc_bar_width(d, i)
        {
            console.log(Object.values(d));
            if(d == "E")
                return d.E;
            else if(d == "T")
                return d.E;
            else if(d == "M")
                return d.E;
            else if(d == "E10")
                return d.E;
            else if(d == "AO")
                return d.E;
            else if(d == "EC")
                return d.E;
            else if(d == "KA")
                return d.E;
            else if(d == "RP")
                return d.E;
            else if(d == "Unknown")
                return d.E;
                    /*case(M):
                        console.log("E: " + dataset[current_year_index].E);
                        //return dataset[current_year_index].E;
                    case(1):
                        console.log("T: " + dataset[current_year_index].T);
                        //return dataset[current_year_index].T;   */
        }
                
        function calc_bar_x(d, i)
        {
            return 20;
        }
        
        function calc_bar_y(d, i)
        {
            return  small_multiple_title_height + title_padding_y + i * (bar_height + space_bet_bar_y); 
        }
        
        function calc_mult_y(i)
        {
            if( i % small_mult_per_column == 0)
                current_row = 0;
            else
                current_row++;
            return space_bet_mult_y + small_mult_height * current_row;
        }
        
        function calc_mult_x(i)
        {
            if( i % small_mult_per_column == 0)
                current_col++;
            return  (small_mult_width + space_bet_mult_x)  * current_col;
        }
        
        //calculate the year corresponding to the small multiple
        function get_year(d, i)
        {
            return d.Year_of_Release;
        }
    
        function setSizest4(boundingRect){
            w = boundingRect.width;
            h = boundingRect.height;
            small_mult_height = h/ small_mult_per_column;
            console.log(w,h);
	       };
    
    
    window.drawt4 = drawt4;
    window.setSizest4 = setSizest4;
    
})();
    
  /*  
    
var x = d3.scale.ordinal().rangeRoundBands([0, width], .05);

var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickFormat(d3.time.format("%Y-%m"));

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .ticks(10);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

d3.csv("bar-data.csv", function(error, data) {

    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.value = +d.value;
    });
	
  x.domain(data.map(function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
    .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.55em")
      .attr("transform", "rotate(-90)" );

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Value ($)");

  svg.selectAll("bar")
      .data(data)
    .enter().append("rect")
      .style("fill", "steelblue")
      .attr("x", function(d) { return x(d.date); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });

    })*/