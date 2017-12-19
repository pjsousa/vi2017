;(function(){
	var localstate = {
		dropdown_vals: [],
		picked_value: null
	}

	var dispatch = d3.dispatch("dropdowvals");

	dispatch.on("dropdowvals", function(idx, value_str){
		var row_num = localstate.dropdown_vals[idx];
		localstate.picked_value = row_num;
		
		d3.select("#cleargamefind")
			.style("visibility", "visible")
			.style("pointer-events", "all");

		appstate.highlightedRows.push(row_num);

		appdispatch.gamehover.call("gamehover", this, row_num, "gamefind");
	});

	function initDropDownFind(){
		var n_years = 7;
		
		var row_numbers = Object.keys(datasources.index_Year_of_Release.index).slice(-n_years)
			.map(function(d){
				return data_utils.get_index(["Year_of_Release"], [d]);
			});
		row_numbers = _.union.apply(null, row_numbers);

		localstate.dropdown_vals = row_numbers;

		resetDropdownValues();

		dropdown_util.register_listener("#gamefind", function(idx, value_str){
			dispatch.call("dropdowvals", null, idx, value_str);
		});
	};

	function resetDropdownValues(){
		var names = localstate.dropdown_vals.map(function(d){
			var game_name = data_utils.read_value(d, "Name");
			return _.truncate(game_name, {'length': 40, 'omission': '...'})}); 

		var platforms = localstate.dropdown_vals.map(function(d){
			return data_utils.read_value(d, "Platform"); });

		dropdown_util.setValueList_values(".gamefind", names, platforms);
	};

	function cleardropdowngamefind_click(evt){
		cleardropdowngamefind();
		evt.preventDefault();
	};

	function cleardropdowngamefind(){
		var _pos = appstate.highlightedRows.indexOf(localstate.picked_value);

		if(localstate.picked_value == null){
			return;
		}

		resetDropdownValues();

		if (_pos > -1){
			appstate.highlightedRows.splice(_pos, 1);
		}

		d3.select("#cleargamefind")
			.style("visibility", "hidden")
			.style("pointer-events", "none");

		localstate.picked_value = null;
		appdispatch.gameout.call("gameout", this, localstate.picked_value, "gamefind");
	};

	window.initDropDownFind = initDropDownFind;
	window.cleardropdowngamefind_click = cleardropdowngamefind_click;
	window.cleardropdowngamefind = cleardropdowngamefind;
})();