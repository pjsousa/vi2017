;(function(){
    // [Q] Eu na T5 fiz um montão louco de batota e guardei algumas coisas 
    // fora do drawT5(). Um bocado mais para facilitar os contextos de algumas 
    // coisas nas funções auxiliares.
    
    var dispatch = d3.dispatch("gamehover");
    var dispatch2 = d3.dispatch("gameout");

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

    function drawt1(){
        /*
            "Drawing t1" means:
                1) ...
                2) ...
                
                The frequency of the viz are ...
         */
        
        //var dataset = data_utils.read_column(null, ["JP_Sales", "EU_Sales", "NA_Sales", "Year_of_Release"]);
        var dataset = data_utils.get_sales_sum(null,"Developer","Nintendo");
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

        var svg = d3.select("#t1Viz svg")
            .attr("width", w)
            .attr("height",h);
        
        //definir o eixo y
		var y = d3.scaleLinear()
			.range([padding,h-padding]);

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
		var x = d3.scaleTime()
            .range([padding,w-padding]);
        
//        var color = d3.scaleOrdinal(d3.schemeCategory10);
//        color.domain(d3.keys(dataset[0]).filter(function(key){ return key !== "Year_of_Release" && key !== "Developer";}));
//        
//        var regions = color.domain().map(function(name){
//            return{
//                name: name,
//                values: dataset.map(function(d){
//                    return {
//                        date: d.Year_of_Release,
//                        sales: d[name]
//                    };
//                })
//            };
//            
//        });
//        
//        
//        x.domain(d3.extent(dataset, function(d) { return d.Year_of_Release; }))
//            .tickFormat(d3.timeFormat("%Y"));
//        y.domain([
//            d3.max(regions, function(c){
//                return d3.max(c.values, function(v){
//                    return v.sales;
//                });
//            }),
//            d3.min(regions, function(c){
//                return d3.min(c.values, function(v){
//                    return v.sales;
//                });
//            })
//            
//        ]);
//        
//        var yaxis = d3.axisLeft()
//            .scale(y);
//
//		var xaxis = d3.axisBottom()
//            .scale(x);
//        
//        //legend
//        var legend = svg.selectAll("g")
//                        .data(regions)
//                        .enter()
//                        .append("g")
//                        .attr("class","legend");
//        legend.append("rect")
//            .attr("x",w - 20)
//            .attr("y", function(d,i){
//            return i*20;
//        })
//        .attr("width",10)
//        .attr("height",10)
//        .style("fill", function(d){
//            return color(d.name);
//        });
//        
//        legend.append('text')
//          .attr('x', w - 8)
//          .attr('y', function(d, i) {
//            return (i * 20) + 9;
//          })
//          .text(function(d) {
//            return d.name;
//          });
//        
//        //draw lines
//        var line = d3.line()
//          .x(function(d) {
//            return x(d.date);
//          })
//          .y(function(d) {
//            return y(d.sales);
//          });
//            //.curve(d3.curveBasis);
//        
//        var region = svg.selectAll(".region")
//                        .data(regions)
//                        .enter().append("g")
//                        .attr("class","region");
//        
//        region.append("path")
//                .attr("class", "region")
//                .attr("d", function(d){
//                    return line(d.values);
//                })
//                .style("stroke",function(d){
//                    return color(d.name);
//                });
////        region.append("text")
////            .datum(function(d){
////                return{
////                    name: d.name,
////                    value: d.values[d.values.length-1]
////                };
////            })
////            .attr("transform", function(d) {
////                return "translate(" + x(d.value.date) + "," + y(d.value.sales) + ")";
////              })
////              .attr("x", 3)
////              .attr("dy", ".35em")
////              .text(function(d) {
////                return d.name;
////              });
//        
//        //draw axis
//        svg.append("g")
//            .attr("transform","translate(30,0)")
//            .attr("class","y axis")
//            .call(yaxis);
//        
//        svg.append("g")
//            .attr("transform","translate(0,"+(h-padding)+")")
//            .call(xaxis); 

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        //criar os valores de cada linha de sales
        var valueline = d3.line()
            .x(function(d) {return x(d.Year_of_Release);})
            .y(function(d) {return y(d.JP_Sales);});
        
        var valueline2 = d3.line()
            .x(function(d) {return x(d.Year_of_Release);})
            .y(function(d) {return y(d.EU_Sales);});
        
        var valueline3 = d3.line()
            .x(function(d) {return x(d.Year_of_Release);})
            .y(function(d) {return y(d.NA_Sales);});

        //definir o domain de cada eixo
        x.domain(d3.extent(dataset, function(d) { return d.Year_of_Release; }))
            .tickFormat(d3.timeFormat("%Y"));
        y.domain([d3.max(dataset, function(d){ return d["NA_Sales"]; }),0]);
        
        
        var yaxis = d3.axisLeft()
            .scale(y);

		var xaxis = d3.axisBottom()
            .scale(x);
        
        //legendas       
        
        
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
        

        // [Q] Isto não é realmente chamado. pode sair?
        function mousemove(){
            /* Deprecate this? */
            var x0 = x.invert(d3.mouse(this)[0]), 
                i = bisectDate(dataset,x0,1),
                d0 = dataset[i-1],
                d1 = dataset[i],
                d = x0 - d0.Year_of_Release > d1.Year_of_Release - x0 ? d1:d0;
            var sale = 0;
            focus.attr("transform", "translate(" + x(d.Year_of_Release) + "," + y(d.NA_Sales) + ")");
            focus.select("text").text(function() { return d.NA_Sales; });
            focus.select(".x-hover-line").attr("y2", h - y(d.NA_Sales));
            focus.select(".y-hover-line").attr("x2", w + w);
        }
        
        //criar o grafico
        svg.append("g")
            .attr("transform","translate(30,0)") // [Q] Aaarhhgg what? "30" ? O_O
            .attr("class","y axis")
            .call(yaxis);
        
        svg.append("g")
            .attr("transform","translate(0,"+(h-padding)+")")
            .call(xaxis);    

        svg.append("path")
            .datum(dataset) // [Q] Nestes datums, acho que querias chamar o data() e depois o enter()? Pareceu-me que não tão a ser usados, so...
            .attr("fill","none")
            .attr("stroke","steelblue")
            .attr("stroke-width",1.5)
            .attr("d",valueline)
            // [Q] Se pendurarmos os eventos nos circles que eu pus no final, deixamos de precisar destes .on()'s todos. Yes?'
            .on("mouseover", function() { 
                    focus.style("display", null); 
                    d3.selectAll(".hover-line").style("stroke","steelblue"); d3.selectAll(".focus").style("stroke","black");d3.selectAll(".focus circle").style("stroke","steelblue");
            })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", function(){
                var x0 = x.invert(d3.mouse(this)[0]), 
                i = bisectDate(dataset,x0,1),
                d0 = dataset[i-1],
                d1 = dataset[i],
                d = x0 - d0.Year_of_Release > d1.Year_of_Release - x0 ? d1:d0;
                focus.attr("transform", "translate(" + x(d.Year_of_Release) + "," + y(d.JP_Sales) + ")");
                focus.select("text").text(function() { return d.JP_Sales; });
                focus.select(".x-hover-line").attr("y2", h - y(d.JP_Sales));
                focus.select(".y-hover-line").attr("x2", w + w); });

        svg.append("path")
            .datum(dataset)
            .attr("fill","none")
            .attr("stroke","red")
            .attr("stroke-width",1.5)
            .attr("d",valueline2)
            .on("mouseover", function() { 
                    focus.style("display", null); 
                    d3.selectAll(".hover-line").style("stroke","red"); 
                    d3.selectAll(".focus").style("stroke","black");
                    d3.selectAll(".focus circle").style("stroke","red");
            })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", function(){
                var x0 = x.invert(d3.mouse(this)[0]), 
                i = bisectDate(dataset,x0,1),
                d0 = dataset[i-1],
                d1 = dataset[i],
                d = x0 - d0.Year_of_Release > d1.Year_of_Release - x0 ? d1:d0;
                focus.attr("transform", "translate(" + x(d.Year_of_Release) + "," + y(d.EU_Sales) + ")");
                focus.select("text").text(function() { return d.EU_Sales; });
                focus.select(".x-hover-line").attr("y2", h - y(d.EU_Sales));
                focus.select(".y-hover-line").attr("x2", w + w);
        });
        
        svg.append("path")
            .datum(dataset)
            .attr("fill","none")
            .attr("stroke","green")
            .attr("stroke-width",1.5)
            .attr("d",valueline3)
            .on("mouseover", function() { 
                    focus.style("display", null); 
                    d3.selectAll(".hover-line").style("stroke","green"); 
                    d3.selectAll(".focus").style("stroke","black");
                    d3.selectAll(".focus circle").style("stroke","green");
            })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove", function(){
                var x0 = x.invert(d3.mouse(this)[0]), 
                i = bisectDate(dataset,x0,1),
                d0 = dataset[i-1],
                d1 = dataset[i],
                d = x0 - d0.Year_of_Release > d1.Year_of_Release - x0 ? d1:d0;
                focus.attr("transform", "translate(" + x(d.Year_of_Release) + "," + y(d.NA_Sales) + ")");
                focus.select("text").text(function() { return d.NA_Sales; });
                focus.select(".x-hover-line").attr("y2", h - y(d.NA_Sales));
                focus.select(".y-hover-line").attr("x2", w + w);
        });

        /* 
            [Q] (Acho que) não mudei nada dentro da drawT1(). Mas daqui para baixo foi adicionado por mim
            Isto "rouba" algumas variáveis das tuas e desenha circulos transparantes que coincidem com os dados 
            para apanharem os eventos do rato.

            We'll steal these from above:
                - dataset
                - x
                - y
                - parseTime
         */
        
        var x_variable = "Year_of_Release";
        // so..... I noticed Other_Sales is GONE! GONE I TELL U!
        var y_variable = ["JP_Sales", "EU_Sales", "NA_Sales"];
        var colors = [ "steelblue", "red", "green" ];

        var all_points = d3.range(dataset.length)
            .map(function(itr_x){ return y_variable.map(function(itr_y){ return [itr_x, itr_y]; })});

        all_points = _.flatten(all_points);
        /*   ^--- think of all_points as if it was a todo list of circles to draw...
            we need to do:
            [[0, "NA_Sales"]
             [0, "EU_Sales"]
             ....]
         */

        svg.selectAll("circle.data-points")
            .data(all_points)
            .enter().append("circle")
                .attr("class", "data-points");
        svg.selectAll("circle.data-points")
            .attr("r", 10)
            .attr("cx", function(d){ return x(dataset[d[0]][x_variable]) }) // d[0] is the row_num, d[1] is the column name
            .attr("cy", function(d){ return y(dataset[d[0]][d[1]]) })
            .attr("fill", "rgba(255,0,0,0)") //rgba(255,0,0,1) would make the circles red
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

                // this is kind of the same as Iris did.
                focus.attr("transform", "translate(" + x(dataset[row_num][x_variable]) + "," + y(dataset[row_num][column_name]) + ")");
                focus.select("text").text(function() { return dataset[row_num][column_name]; });
                focus.select(".x-hover-line").attr("y2", h - y(dataset[row_num][column_name]));
                focus.select(".y-hover-line").attr("x2", w + w);
                
                focus.style("display", null); 
                d3.selectAll(".hover-line").style("stroke",colors[y_variable.indexOf(column_name)]);
                d3.selectAll(".focus").style("stroke","black");
                d3.selectAll(".focus circle").style("stroke",colors[y_variable.indexOf(column_name)]);
            })
            .on("mouseout", function(d){
                // lets notify ourselves!
                var row_num = d[0];
                var column_name = d[1];

                var year = dataset[row_num][x_variable].getFullYear() + ".0";
                var all_rownums = datasources["index_"+x_variable].index[year];

                dispatch2.call("gameout", null, d, all_rownums, dataset);

                focus.style("display", "none");
                console.log("Out")
            });




    };
window.drawt1 = drawt1;    
})();