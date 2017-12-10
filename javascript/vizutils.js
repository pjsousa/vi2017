;(function(){
	var vizutils = {};

	function processVoronoi(dataset, x_acessor, y_acessor, topleft_coord, bottomright_coord){
		var result;
		
		result = d3.voronoi()
			.x(x_acessor)
			.y(y_acessor)
			.extent([topleft_coord, bottomright_coord])(dataset);

		return result;
	};

	function processQuadtree(dataset, x_acessor, y_acessor){
		var result;

		result = d3.quadtree()
			.x(x_acessor)
			.y(y_acessor)
			.addAll(dataset);

		return result;
	};

	function initBrush_fullplot(topleft_coord, bottomright_coord){
		var result;

		result = d3.brush()
			.extent([topleft_coord, bottomright_coord]);

		return result;
	}


	// we'll want to make these public:
	vizutils["processVoronoi"] = processVoronoi;
	vizutils["processQuadtree"] = processQuadtree;
	vizutils["initBrush_fullplot"] = initBrush_fullplot;
	window.vizutils = vizutils;
})();