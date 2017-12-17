'use stritct;'
;(function(){
	var slice_util = {};

	/*
		# OBJECTIVE

		These are just a set of utility functions to slice data and store slice states.
		We can define here all the diferent slices we have in the app and then create as many 
		set of rules as we want. 

		This means we can instanciate one global rule set in the app context and use 
		across all dashboards.Or create a local rule set for each dashboard. In this
		 second case, it is not the most modular way to do it, but since we don't have too much
		 nor too complex rules, having it this way facilitates our dev work while experimenting 
		 with adding or droping rules (local or global) as we go along).

		 Ultimatelly, the main objective that we want is:
		  - get a bunch of row numbers
		  - look for the rows that have on specific value (e.g. "Action" in the Genre column) 
		  - (or maybe) look for the rows that have the Global sales between [30, 45]
		  - combine all the active rules and get a set of rows that match all our arbitrary conditions.
	 */

	/*
		# ADDING RULES

		To add a new slice rule we need to:
		1) Give it a key name (usually '<source><column>') in the VALID_SLICES variable
		2) Give it an entry in COLUMN_NAMES. Can either be:
			- the name of a column (for numeric slices)
			- an empty string (the the value lookup slices)
		3) If it is a lookup slice, we need to add its key name to the LOOKUP_SLICES variable (the same value we gave it in the VALID_SLICES)
		4) Actually place the rule in the result of the slicerules_factory.

	 */

	/*
		# EXAMPLES

		For the examples below, consider the following fake dataset with 10 rows:
		fake_data["data_v2"] =[
		 {"Name":"FIFA: Road to World Cup 98",      "Platform":"PS",   "Year_of_Release":"1997.0",   "Genre":"Sports",      "Publisher":"Electronic Arts",       "NA_Sales":"0.14",    "EU_Sales":"0.09",  "JP_Sales":"0.46", "Other_Sales":"0.05",   "Global_Sales":"0.73",   "Critic_Score":"-1.0",    "Critic_Count":"-1.0",    "User_Score":"-1.0",   "User_Count":"-1.0",     "Developer":"Unknown",              "Rating":"Unknown",  "TBD_Flag":"False",    "Outlier_Flag":"True",    "User_Score_Norm":"-10.0",   "Critic_User_Diff":"9.0",      "Percentage_of_Releases":"93.42560553633218",     "Mean_UserCritic_Score":"-5.5",  "row_num":0}
		,{"Name":"Shark Tale",                      "Platform":"GC",   "Year_of_Release":"2004.0",   "Genre":"Action",      "Publisher":"Activision",            "NA_Sales":"0.23",    "EU_Sales":"0.06",  "JP_Sales":"0.0",  "Other_Sales":"0.01",   "Global_Sales":"0.3",    "Critic_Score":"69.0",    "Critic_Count":"23.0",    "User_Score":"0.0",    "User_Count":"-1.0",     "Developer":"Edge of Reality",      "Rating":"E",        "TBD_Flag":"True",     "Outlier_Flag":"False",   "User_Score_Norm":"0.0",     "Critic_User_Diff":"69.0",     "Percentage_of_Releases":"35.30183727034121",     "Mean_UserCritic_Score":"34.5",  "row_num":1}
		,{"Name":"Shadowrun",                       "Platform":"X360", "Year_of_Release":"2007.0",   "Genre":"Role-Playing","Publisher":"Microsoft Game Studios","NA_Sales":"0.41",    "EU_Sales":"0.02",  "JP_Sales":"0.0",  "Other_Sales":"0.04",   "Global_Sales":"0.47",   "Critic_Score":"66.0",    "Critic_Count":"57.0",    "User_Score":"7.5",    "User_Count":"156.0",    "Developer":"FASA Studio",          "Rating":"M",        "TBD_Flag":"False",    "Outlier_Flag":"False",   "User_Score_Norm":"75.0",    "Critic_User_Diff":"-9.0",     "Percentage_of_Releases":"7.101086048454469",     "Mean_UserCritic_Score":"70.5",  "row_num":2}
		,{"Name":"CSI: Fatal Conspiracy",           "Platform":"X360", "Year_of_Release":"2010.0",   "Genre":"Adventure",   "Publisher":"Ubisoft",               "NA_Sales":"0.11",    "EU_Sales":"0.04",  "JP_Sales":"0.0",  "Other_Sales":"0.01",   "Global_Sales":"0.17",   "Critic_Score":"42.0",    "Critic_Count":"9.0",     "User_Score":"4.8",    "User_Count":"4.0",      "Developer":"Telltale Games",       "Rating":"M",        "TBD_Flag":"False",    "Outlier_Flag":"False",   "User_Score_Norm":"48.0",    "Critic_User_Diff":"-6.0",     "Percentage_of_Releases":"7.729083665338646",     "Mean_UserCritic_Score":"45.0",  "row_num":3}
		,{"Name":"PictoImage",                      "Platform":"DS",   "Year_of_Release":"2007.0",   "Genre":"Puzzle",      "Publisher":"Sega",                  "NA_Sales":"0.09",    "EU_Sales":"0.0",   "JP_Sales":"0.0",  "Other_Sales":"0.01",   "Global_Sales":"0.1",    "Critic_Score":"61.0",    "Critic_Count":"11.0",    "User_Score":"0.0",    "User_Count":"-1.0",     "Developer":"Sega",                 "Rating":"E",        "TBD_Flag":"True",     "Outlier_Flag":"False",   "User_Score_Norm":"0.0",     "Critic_User_Diff":"61.0",     "Percentage_of_Releases":"29.406850459482037",    "Mean_UserCritic_Score":"30.5",  "row_num":4}
		,{"Name":"BlazBlue: Continuum Shift II",    "Platform":"3DS",  "Year_of_Release":"2011.0",   "Genre":"Fighting",    "Publisher":"PQube",                 "NA_Sales":"0.05",    "EU_Sales":"0.01",  "JP_Sales":"0.04", "Other_Sales":"0.01",   "Global_Sales":"0.11",   "Critic_Score":"64.0",    "Critic_Count":"14.0",    "User_Score":"6.1",    "User_Count":"19.0",     "Developer":"Arc System Works",     "Rating":"T",        "TBD_Flag":"False",    "Outlier_Flag":"False",   "User_Score_Norm":"61.0",    "Critic_User_Diff":"3.0",      "Percentage_of_Releases":"17.95774647887324",     "Mean_UserCritic_Score":"62.5",  "row_num":5}
		,{"Name":"Emergency 2012",                  "Platform":"DS",   "Year_of_Release":"2010.0",   "Genre":"Simulation",  "Publisher":"Rondomedia",            "NA_Sales":"0.0",     "EU_Sales":"0.01",  "JP_Sales":"0.0",  "Other_Sales":"0.0",    "Global_Sales":"0.02",   "Critic_Score":"-1.0",    "Critic_Count":"-1.0",    "User_Score":"-1.0",   "User_Count":"-1.0",     "Developer":"Unknown",              "Rating":"Unknown",  "TBD_Flag":"False",    "Outlier_Flag":"True",    "User_Score_Norm":"-10.0",   "Critic_User_Diff":"9.0",      "Percentage_of_Releases":"36.33466135458167",     "Mean_UserCritic_Score":"-5.5",  "row_num":6}
		,{"Name":"Lost Planet 3",                   "Platform":"PC",   "Year_of_Release":"2013.0",   "Genre":"Shooter",     "Publisher":"Capcom",                "NA_Sales":"0.0",     "EU_Sales":"0.04",  "JP_Sales":"0.0",  "Other_Sales":"0.0",    "Global_Sales":"0.04",   "Critic_Score":"61.0",    "Critic_Count":"17.0",    "User_Score":"6.2",    "User_Count":"210.0",    "Developer":"Spark Unlimited",      "Rating":"T",        "TBD_Flag":"False",    "Outlier_Flag":"False",   "User_Score_Norm":"62.0",    "Critic_User_Diff":"-1.0",     "Percentage_of_Releases":"11.397058823529411",    "Mean_UserCritic_Score":"61.5",  "row_num":7}
		,{"Name":"Disgaea 5: Alliance of Vengeance","Platform":"PS4",  "Year_of_Release":"2015.0",   "Genre":"Role-Playing","Publisher":"Nippon Ichi Software",  "NA_Sales":"0.11",    "EU_Sales":"0.08",  "JP_Sales":"0.06", "Other_Sales":"0.04",   "Global_Sales":"0.29",   "Critic_Score":"80.0",    "Critic_Count":"43.0",    "User_Score":"8.1",    "User_Count":"173.0",    "Developer":"Nippon Ichi Software", "Rating":"T",        "TBD_Flag":"False",    "Outlier_Flag":"False",   "User_Score_Norm":"81.0",    "Critic_User_Diff":"-1.0",     "Percentage_of_Releases":"17.491749174917494",    "Mean_UserCritic_Score":"80.5",  "row_num":8}
		,{"Name":"Downstream Panic!",               "Platform":"PSP",  "Year_of_Release":"2008.0",   "Genre":"Action",      "Publisher":"Atari",                 "NA_Sales":"0.03",    "EU_Sales":"0.0",   "JP_Sales":"0.0",  "Other_Sales":"0.0",    "Global_Sales":"0.03",   "Critic_Score":"-1.0",    "Critic_Count":"-1.0",    "User_Score":"-1.0",   "User_Count":"-1.0",     "Developer":"Unknown",              "Rating":"Unknown",  "TBD_Flag":"False",    "Outlier_Flag":"True",    "User_Score_Norm":"-10.0",   "Critic_User_Diff":"9.0",      "Percentage_of_Releases":"31.254379817799578",    "Mean_UserCritic_Score":"-5.5",  "row_num":9}];
	*/


	// We'll use VALID_SLICES to both sanitize some functions' params 
	// and to enforce the order in which the slices will be applied
	var VALID_SLICES = [
		"t1",
		"t1Genre",
		"t5Global_Sales",
		"t5Mean_UserCritic_Score",
		"t2",
		"t4",
		"t4Year_of_Release",
		"t4Rating",
		"t6",
		"t6Year_of_Release",
		"t6Mean_UserCritic_Score"
	];

	/* 
		COLUMN_NAMES is a positional array that must be the same sice as VALID SLICES 
	 	and is concatenated with it elementwise to validate some of the parameter in the functions
	 	below. Also serves as a lookup index so we can know which column is being used in the numeric slices.
 	*/
	var COLUMN_NAMES = [
		"Year_of_Release",
		"Genre",
		"Global_Sales",
		"Mean_UserCritic_Score",
		"", // These are LOOKUP rules. They will use the column on the rule dict.
		"", // These are LOOKUP rules. They will use the column on the rule dict.
		"Year_of_Release",
		"", // These are text rules. They will use the column on the rule dict.
		"",// These are text rules. They will use the column on the rule dict.
		"Year_of_Release",
		"Mean_UserCritic_Score"
	];
    
    var LOOKUP_SLICES = [
		"t1Genre",
		"t2",
		"t4",
		"t4Rating",
		"t6"
	];

	var LOOKUP_SLICES = [
		"t1Genre",
		"t2",
		"t4",
		"t4Rating",
		"t6"
	];

	/*
		This creates a new object with a rule set.
	 */
	function slicerules_factory(){
		var result = {};

		/*
			These are the rules.
				If we're creating a numeric slice we use a [-Infinity, Infinity] array
				For Lookups we give it the default 
		 */

		result["t1"]                      = [-Infinity, Infinity];
		result["t1Genre"]                 = ["Genre", null];
		result["t5Global_Sales"]          = [-Infinity, Infinity];
		result["t5Mean_UserCritic_Score"] = [-Infinity, Infinity];
		result["t2"]                      = ["Platform", null];
		result["t4"]                      = ["Platform", null];
		result["t4Year_of_Release"]       = [-Infinity, Infinity];
		result["t4Rating"]                = ["Rating", null];
		result["t6"]                      = ["Platform", null];
		result["t6Year_of_Release"]       = [-Infinity, Infinity];
		result["t6Mean_UserCritic_Score"] = [-Infinity, Infinity];

		return result;
	};

	/**
	 Gets a rule set and writes the "from" and/or "to" values into the rule mapped by source|column.
	 If Either of the from or to are null, it leaves the value unchanged.

	# For Example: 
		This creates a new rule set and changes the t1 time interval
	
		var rules = slice_util.slicerules_factory();
		var _r = slice_util.setSlice(rules, "t1", "", 2000, 2017);

		Variable _r will be:
			{"t1": [ 2000, 2017 ],    ******This one didn't come with Inifinity*****
			"t1Genre": [ "Genre", null ], 
			"t5Global_Sales": [ -Infinity, Infinity ], 
			"t5Mean_UserCritic_Score": [ -Infinity, Infinity ], 
			"t2": [ 'Platform', null ], 
			"t4": [ 'Platform', null ], 
			"t4Year_of_Release": [ -Infinity, Infinity ], 
			"t4Rating": [ 'Rating', null ], 
			"t6": [ 'Platform', null ], 
			"t6Year_of_Release": [ -Infinity, Infinity ], 
			"t6Mean_UserCritic_Score": [ -Infinity, Infinity ]};


	# For Example:
		This creates a new rule set and changes the upper limit of the t6 time interval
		var rules = slice_util.slicerules_factory();
		var _r = slice_util.setSlice(rules, "t6", "Year_of_Release", null, 2017);
		
		Variable _r will be:
			{"t1": [ -Infinity, Infinity ],
			"t1Genre": [ "Genre", null ], 
			"t5Global_Sales": [ -Infinity, Infinity ], 
			"t5Mean_UserCritic_Score": [ -Infinity, Infinity ], 
			"t2": [ 'Platform', null ], 
			"t4": [ 'Platform', null ], 
			"t4Year_of_Release": [ -Infinity, Infinity ], 
			"t4Rating": [ 'Rating', null ], 
			"t6": [ 'Platform', null ], 
			"t6Year_of_Release": [ -Infinity, 2017 ],  ******This one only wrote in the upper limit*****
			"t6Mean_UserCritic_Score": [ -Infinity, Infinity ]};
	 */
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
		if(LOOKUP_SLICES.indexOf(_key) > -1){
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

	/*
		clear slice set the given source|column to the default values
	
		# For Example:
			reset only the "t6Year_of_Release" rule.
			_r = slice_util.clearSlice(rules, "t6", "Year_of_Release");

			OR

			reset only the "t2" rule
			_r = slice_util.clearSlice(rules, "t2", "");

	 */
	function clearSlice(rules, source, column){
		var _key = [source, column].join("");


		// validate the source|column pair produces a valid key
		if (VALID_SLICES.indexOf(_key) == -1){
			throw new Error("The source|column pair ("+source+"|"+column+") is not valid.")
		}

		// Validate var types
		if(LOOKUP_SLICES.indexOf(_key) > -1){
			rules[_key] = [rules[_key][0], null];
		}
		else{
			rules[_key] = [-Infinity, Infinity];
		}

		return rules;
	};

	/*
		Gets a set of rules and an array of row_numbers, then computes the result of each rule.
		Rule-by-rule, returns the row_numbers that pass it.

		For Example:
			var row_numbers = [0,1,2,3,4,5,6,7,8,9];
			rules = {"t1":                     [ 2000, 2010 ],
							"t1Genre":                 [ "Genre", null ],
							"t5Global_Sales":          [ -Infinity, Infinity ], 
							"t5Mean_UserCritic_Score": [ -Infinity, Infinity ], 
							"t2":                      [ 'Platform', null ], 
							"t4":                      [ 'Platform', null ], 
							"t4Year_of_Release":       [ -Infinity, Infinity ], 
							"t4Rating":                [ 'Rating', null ], 
							"t6":                      [ 'Platform', null ], 
							"t6Year_of_Release":       [ -Infinity, Infinity ], 
							"t6Mean_UserCritic_Score": [ -Infinity, Infinity ] }

			_r = slice_util.computeSlices(rules, row_numbers);

			Variable _r will be:
			>			{"t1":                      [ 1, 2, 3, 4, 6, 9 ],
						"t1Genre": 								 [0,1,2,3,4,5,6,7,8,9],
						"t5Global_Sales":          [0,1,2,3,4,5,6,7,8,9],
						"t5Mean_UserCritic_Score": [0,1,2,3,4,5,6,7,8,9],
						"t2":                      [0,1,2,3,4,5,6,7,8,9],
						"t4":                      [0,1,2,3,4,5,6,7,8,9],
						"t4Year_of_Release":       [0,1,2,3,4,5,6,7,8,9],
						"t4Rating":                [0,1,2,3,4,5,6,7,8,9],
						"t6":                      [0,1,2,3,4,5,6,7,8,9],
						"t6Year_of_Release":       [0,1,2,3,4,5,6,7,8,9],
						"t6Mean_UserCritic_Score": [0,1,2,3,4,5,6,7,8,9]}


			# For Example:

			var row_numbers = [0,1,2,3,4,5,6,7,8,9];
			rules = {"t1":                     [ -Infinity, 2000 ],
							"t1Genre":                 [ "Genre", null ],
							"t5Global_Sales":          [ 0.29, Infinity ], 
							"t5Mean_UserCritic_Score": [ 30, 50 ], 
							"t2":                      [ 'Platform', "X360" ], 
							"t4":                      [ 'Platform', null ], 
							"t4Year_of_Release":       [ -Infinity, Infinity ], 
							"t4Rating":                [ 'Rating', "E" ], 
							"t6":                      [ 'Platform', null ], 
							"t6Year_of_Release":       [ -Infinity, Infinity ], 
							"t6Mean_UserCritic_Score": [ -Infinity, Infinity ] }
			
			_r = slice_util.computeSlices(rules, row_numbers);

			Variable _r will be:
			>		{"t1":                      [0],
						"t1Genre": 								 [0,1,2,3,4,5,6,7,8,9],
						"t5Global_Sales":          [0,1,2,8],
						"t5Mean_UserCritic_Score": [1,3,4],
						"t2":                      [2,3],
						"t4":                      [0,1,2,3,4,5,6,7,8,9],
						"t4Year_of_Release":       [0,1,2,3,4,5,6,7,8,9],
						"t4Rating":                [1,4],
						"t6":                      [0,1,2,3,4,5,6,7,8,9],
						"t6Year_of_Release":       [0,1,2,3,4,5,6,7,8,9],
						"t6Mean_UserCritic_Score": [0,1,2,3,4,5,6,7,8,9]}

	 */
	function computeSlices(rules, row_numbers){
        var _r = {};
		var _column_name;
		var _value;
		var _from;
		var _to;

		VALID_SLICES.forEach(function(itr_key, key_idx){
			_r[itr_key] = [];

			// Validate var types
			if(LOOKUP_SLICES.indexOf(itr_key) > -1){
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

	/*
		Gets a rule set and an array of row numbers. Returns the intersection of all rules.

		# For Example:
			var row_numbers = [0,1,2,3,4,5,6,7,8,9];
			rules = {"t1":                     [ 2000, 2010 ],
							"t1Genre":                 [ "Genre", null ],
							"t5Global_Sales":          [ -Infinity, Infinity ], 
							"t5Mean_UserCritic_Score": [ -Infinity, Infinity ], 
							"t2":                      [ 'Platform', null ], 
							"t4":                      [ 'Platform', null ], 
							"t4Year_of_Release":       [ -Infinity, Infinity ], 
							"t4Rating":                [ 'Rating', null ], 
							"t6":                      [ 'Platform', null ], 
							"t6Year_of_Release":       [ -Infinity, Infinity ], 
							"t6Mean_UserCritic_Score": [ -Infinity, Infinity ] }
			_r = slice_util.sliceRows(rules, row_numbers);

			Variable _r will be:
			> [ 1, 2, 3, 4, 6, 9 ];


		# For Example:
			var row_numbers = [0,1,2,3,4,5,6,7,8,9];
			rules = {"t1":                     [ -Infinity, Infinity ],
							"t1Genre":                 [ "Genre", null ],
							"t5Global_Sales":          [ -Infinity, Infinity ], 
							"t5Mean_UserCritic_Score": [ 30, 50 ], 
							"t2":                      [ 'Platform', null ], 
							"t4":                      [ 'Platform', null ], 
							"t4Year_of_Release":       [ -Infinity, Infinity ], 
							"t4Rating":                [ 'Rating', "E" ], 
							"t6":                      [ 'Platform', null ], 
							"t6Year_of_Release":       [ -Infinity, Infinity ], 
							"t6Mean_UserCritic_Score": [ -Infinity, Infinity ] }
			_r = slice_util.sliceRows(rules, row_numbers);

			Variable _r will be:
			> [ 1, 4 ];

	 */
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