;(function(){
	var dutil = {};

	var ATT_COLS_LOOKUP = ["Platform", "Genre", "Publisher", "Developer"];

	function read_atts(attSelector){
		attSelector = attSelector || '.t2Atts';
		var result = $(attSelector).selectpicker('val').split(" ").join("_");
		return result;
	};

	function read_values(valSelector){
		valSelector = valSelector || '.t2Values';
		var result = $(valSelector).selectpicker('val');
		return result;
	};

	function reset_atts(attSelector){
		attSelector = attSelector || '.t2Atts';
		$(attSelector).selectpicker('deselectAll');
		$(attSelector).selectpicker('refresh');
	};

	function reset_values(valSelector){
		valSelector = valSelector || '.t2Values';
		$(valSelector).selectpicker('deselectAll');
		$(valSelector).selectpicker('refresh');
	};

	function setSelection_atts(attSelector, value){
		attSelector = attSelector || '.t2Atts';
		$(attSelector).selectpicker('val', value);
		$(attSelector).selectpicker('refresh');
	};

	function setSelection_values(valSelector, value){
		valSelector = valSelector || '.t2Values';
		$(valSelector).selectpicker('val', value);
		$(valSelector).selectpicker('refresh');
	};

	function setValueList_values(valSelector, values_arr, note_arr){
		valSelector = valSelector || ".t2Values";

		d3.selectAll(valSelector + " select option")
			.remove();

		d3.select(valSelector + " select").selectAll("option")
			.data(values_arr)
			.enter().append("option")
				.attr("data-subtext", function(d,i){ return note_arr ? note_arr[i] : ""})
				.html(function(d){ return d; })

		$(valSelector).selectpicker('refresh');
	}

	function register_listener(target_dropdown, fn_callback){
		// 
		// the raw arguments should be:
		// changed_arguments = [clickedIndex, $option.prop('selected'), state];
		// 
		// you can check here:
		// https://github.com/silviomoreto/bootstrap-select/blob/0f8b136213f1f752bdb1444e621d546d549c3ccb/js/bootstrap-select.js#L1408
		$(target_dropdown).on('changed.bs.select', function (event, clickedIndex, selected, state) {
			fn_callback.apply(this, [clickedIndex - 1, $(this).selectpicker('val')].concat(arguments));
		});

	};

	dutil["read_atts"] = read_atts;
	dutil["read_values"] = read_values;
	dutil["reset_atts"] = reset_atts;
	dutil["reset_values"] = reset_values;
	dutil["setSelection_atts"] = setSelection_atts;
	dutil["setSelection_values"] = setSelection_values;
	dutil["register_listener"] = register_listener;
	dutil["setValueList_values"] = setValueList_values;
	window.dropdown_util = dutil;
})();