;(function(){
	function drawdtl(){
		var dataset = appstate.highlightedRows[0];

		console.log(dataset)

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
		
	}

	window.drawdtl = drawdtl;
})();