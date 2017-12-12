'use stritct;'
;(function(){
	var slice_util = {};

	// We'll use VALID_SLICES to both sanitize some functions' params 
	// and to enforce the order in which the slices will be applied
	var VALID_SLICES = [
		"t1",
		"t5Global_Sales",
		"t5Mean_UserCritic_Score",
		"t2",
		"t4Year_of_Release",
		"t4Rating",
		"t6Year_of_Release",
		"t6Mean_UserCritic_Score"
	];

	var COLUMN_NAMES = [
		"Year_of_Release",
		"Global_Sales",
		"Mean_UserCritic_Score",
		"", // These are text rules. They will use the column on the rule dict.
		"Year_of_Release",
		"", // These are text rules. They will use the column on the rule dict.
		"Year_of_Release",
		"Mean_UserCritic_Score"
	];

	function slicerules_factory(){
		var result = {};

		result["t1"]                      = [-Infinity, Infinity];
		result["t5Global_Sales"]          = [-Infinity, Infinity];
		result["t5Mean_UserCritic_Score"] = [-Infinity, Infinity];
		result["t2"]                      = ["Platform", null];
		result["t4Year_of_Release"]       = [-Infinity, Infinity];
		result["t4Rating"]                = ["Rating", null];
		result["t6Year_of_Release"]       = [-Infinity, Infinity];
		result["t6Mean_UserCritic_Score"] = [-Infinity, Infinity];

		return result;
	}

	function setSlice(rules, source, column, from, to){

		var _key = [source, column].join("");


		// validate the source|column pair produces a valid key
		if (VALID_SLICES.indexOf(_key) == -1){
			throw new Error("The source|column pair ("+source+"|"+column+") is not valid.")
		}

		// the from|to parameters can't be blank
		if ( typeof from === "undefined" || typeof to === "undefined" ){
			throw new Error("The from and to parameters cannot be undefined. Use null instead to leave them unchanged.");
		}

		// Validate var types
		if(["t2","t4Rating"].indexOf(_key) > -1){
			//"t2" and "t4Rating" must take strings
			if (from !== null && typeof from !== "string"){
				throw new Error("'from' parameter got an invalid vartype for the source|column pair specified.")
			}

			if (to !== null && typeof to !== "string"){
				throw new Error("'to' parameter got an invalid vartype for the source|column pair specified.")
			}
		}
		else{
			// the rest of the rules must take numbers
			if (from !== null && typeof from !== "number"){
				throw new Error("'from' parameter got an invalid vartype for the source|column pair specified.")
			}

			if (to !== null && typeof to !== "number"){
				throw new Error("'to' parameter got an invalid vartype for the source|column pair specified.")
			}

			if (from !== null && to !== null && from > to){
				throw new Error("For numeric values, 'from' parameter must be lower or equal than the 'to' parameter.");
			}
		}

		// update the slice rule
		// or don't... it should be left alone if the value is null
		if (from !== null){
			rules[_key][0] = from;
		}
		
		if (to !== null){
			rules[_key][1] = to;
		}

		return rules;
	};

	function clearSlice(rules, source, column){
		var _key = [source, column].join("");


		// validate the source|column pair produces a valid key
		if (VALID_SLICES.indexOf(_key) == -1){
			throw new Error("The source|column pair ("+source+"|"+column+") is not valid.")
		}

		// Validate var types
		if(["t2","t4Rating"].indexOf(_key) > -1){
			rules[_key] = [rules[_key][0], null];
		}
		else{
			rules[_key] = [-Infinity, Infinity];
		}

		return rules;
	};

	function computeSlices(rules, row_numbers){
		var _r = {};
		var _column_name;
		var _value;
		var _from;
		var _to;

		VALID_SLICES.forEach(function(itr_key, key_idx){
			_r[itr_key] = [];

			// Validate var types
			if(["t2","t4Rating"].indexOf(itr_key) > -1){
				_column_name = rules[itr_key][0];
				_value = rules[itr_key][1];

				if (_value === null){
					_r[itr_key] = row_numbers.map(function(e){ return e; })
				}
				else{
					_r[itr_key] = row_numbers.filter(function(itr_row){ 
						return _value == data_utils.read_value(itr_row, _column_name);
					})
				}
			}
			else{
				_from = parseFloat(rules[itr_key][0]);
				_to = parseFloat(rules[itr_key][1]);
				_column_name = COLUMN_NAMES[key_idx];


				_r[itr_key] = row_numbers.filter(function(itr_row){ 
					var _compare = data_utils.read_value(itr_row, _column_name);
					_compare = parseFloat(_compare);
					return _compare >= _from && _compare <= _to;
				})
			}

		})

		return _r;
	};

	function sliceRows(rules, row_numbers){
		var result;
		var slices = computeSlices(rules, row_numbers);

		result = row_numbers.map(function(e){ return e; });

		VALID_SLICES.forEach(function(itr_key, key_idx){
			if( slices[itr_key].length === row_numbers.length ){
				return;
			}

			result = _.intersection(result, slices[itr_key]);

		});

		return result;
	};

	slice_util["slicerules_factory"] = slicerules_factory;
	slice_util["setSlice"] = setSlice;
	slice_util["clearSlice"] = clearSlice;
	slice_util["computeSlices"] = computeSlices;
	slice_util["sliceRows"] = sliceRows;
	slice_util["VALID_SLICES"] = VALID_SLICES;
	window.slice_util = slice_util;
})()