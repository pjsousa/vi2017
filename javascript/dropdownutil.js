;(function(){
	var dutil = {};

	var ATT_COLS_LOOKUP = ["Platform", "Genre", "Year of Release", "Publisher", "Developer"];

	function read_atts(){
		var result = $('.t2Atts').selectpicker('val').split(" ").join("_");
		return result;
	};

	function read_values(){
		var result = $('.t2Values').selectpicker('val');
		return result;
	};

	function reset_atts(){
		$('.t2Atts').selectpicker('deselectAll');
		$('.t2Atts').selectpicker('refresh');
	};

	function reset_values(){
		$('.t2Values').selectpicker('deselectAll');
		$('.t2Values').selectpicker('refresh');
	};

	function setSelection_atts(value){
		$('.t2Atts').selectpicker('val', value);
		$('.t2Atts').selectpicker('refresh');
	};

	function setSelection_values(value){
		$('.t2Values').selectpicker('val', value);
		$('.t2Values').selectpicker('refresh');
	};

	function setValueList_values(values_arr){
		d3.selectAll(".t2Values select option")
			.remove();

		d3.select(".t2Values select").selectAll("option")
			.data(values_arr)
			.enter().append("option")
			.html(function(d){ return d; })

		$('.t2Values').selectpicker('refresh');
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