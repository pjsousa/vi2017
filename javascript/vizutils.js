;(function(){
	var vizutils = {};

	const X = 0;
	const Y = 1;
	const TOP_LEFT = 0;
	const BOTTOM_RIGHT = 1;

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
	};

	function rectIntersects(rect1, rect2) {
		return (rect1[TOP_LEFT][X] <= rect2[BOTTOM_RIGHT][X] &&
						rect2[TOP_LEFT][X] <= rect1[BOTTOM_RIGHT][X] &&
						rect1[TOP_LEFT][Y] <= rect2[BOTTOM_RIGHT][Y] &&
						rect2[TOP_LEFT][Y] <= rect1[BOTTOM_RIGHT][Y]);
	};

	function rectContains(rect, point) {
		return rect[TOP_LEFT][X] <= point[X] && point[X] <= rect[BOTTOM_RIGHT][X] &&
					 rect[TOP_LEFT][Y] <= point[Y] && point[Y] <= rect[BOTTOM_RIGHT][Y];
	};

	function searchQuadtree_inrect(quadtree, rect, x_acessor, y_acessor){
		var result = [];

		quadtree.visit(function(node, x1, y1, x2, y2){
			// check that quadtree node intersects
			var overlaps = rectIntersects(rect, [[x1, y1], [x2, y2]]);

			// skip if it doesn't overlap the brush
			if (!overlaps) {
				return true;
			}

			// if this is a leaf node (node.length is falsy), verify it is within the brush
			// we have to do this since an overlapping quadtree box does not guarantee
			// that all the points within that box are covered by the brush.
			if (!node.length) {
				var d = node.data;
				var dx = x_acessor(d);
				var dy = y_acessor(d);

				if (rectContains(rect, [dx, dy])) {
					result.push(d);
				}
			}

			// return false so that we traverse into branch (only useful for non-leaf nodes)
			return false;
		});

		return result;
	}


	// we'll want to make these public:
	vizutils["processVoronoi"] = processVoronoi;
	vizutils["processQuadtree"] = processQuadtree;
	vizutils["initBrush_fullplot"] = initBrush_fullplot;
	vizutils["rectIntersects"] = rectIntersects;
	vizutils["rectContains"] = rectContains;
	vizutils["searchQuadtree_inrect"] = searchQuadtree_inrect;
	window.vizutils = vizutils;
})();