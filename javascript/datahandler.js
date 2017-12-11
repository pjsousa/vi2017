;(function(){
	/*
		Este ficheiro vai executar no load da página, e fazer fetch de todos os datasources.
		Funções de data utils podemos definir aqui e chamar depois onde forem precisas.
	*/ 
 
	
	var datasources = {};

	/*
	A var datasources é uma hash com os dados em si.

	- datasources["data_v2"]
			é um array com cada uma das linhas do ficheiro.

			Por exe, correndo isto...
				> datasources["data_v2"].length
				....vamos ter o número de linhas:
				: 16717

			Ou, se quiser-mos um registo em concreto, por exemplo o primeiro registo:
				> datasources.data_v2[0]
				: {"Name":"Wii Sports","Platform":"Wii","Year_of_Release":"2006.0","Genre":"Sports" .... }

			Ou, se quisermos só o Nome do primeiro registo...
				> datasources.data_v2[0]["Name"]
				: "Wii Sports"

	- datasources["index_*"]
			As index_Developer, index_Genre, etc... são hash indexes. 

			Dão-nos jeito para umas quantas coisas...

			...saber qual a lista de distinct values numa coluna (por exe. Genre):
				 > Object.keys(datasources["index_Genre"].index)
				 : ["Role-Playing","Puzzle","Shooter","Misc","Fighting","Simulation","Platform","Strategy","Adventure","Action","Sports","Racing"]

			...fazer lookup de um valor numa coluna:
				 > datasources["index_Genre"].index.hasOwnProperty("Action")
				 : true

				 > datasources["index_Genre"].index.hasOwnProperty("Rts")
				 : true

				 (existe action, mas não existe Rts)

			... e o lookup de linhas propriamente dito
				 > datasources["index_Genre"].index["Action"]
				 : [16, 17, 23, 24, 38, 42, 46, 51, 57, 81, 91, 93, 107 .... ]
						 ^-- vamos ver se a linha 16 tem o Genre action....
				 
				 > datasources.data_v2[16]
				 : {"Name":"Grand Theft Auto V","Platform":"PS3","Year_of_Release":"2013.0","Genre":"Action" .... }
																																						tem... ---^
			
	Algumas notas sobre estes exemplos...
	- O Object.keys é uma função do javascript e dá-nos os indices de um objecto.
	Se for um Object/"Hash" dá-nos coisas como "Action", "Puzzle", etc...Se for um array, dá-nos 0, 1, 2, 3, 

	- O hasOwnProperty também é nativa do javascript para ver se determinado objecto tem uma propriedade.

	 */

	// vamos inicializer tudo a undefined, quando o script corre os datasources estão vazios
	datasources["data_v2"] = undefined;
	datasources["index_Developer"] = undefined;
	datasources["index_Genre"] = undefined;
	datasources["index_Name"] = undefined;
	datasources["index_Outlier_Flag"] = undefined;
	datasources["index_Percentage_of_Releases"] = undefined;
	datasources["index_Platform"] = undefined;
	datasources["index_Publisher"] = undefined;
	datasources["index_Rating"] = undefined;
	datasources["index_TBD_Flag"] = undefined;
	datasources["index_Year_of_Release"] = undefined;
	datasources["util_irq_analisys_v2"] = undefined;

	// isto é só porque pode dar jeito ter as keys hardcoded...
	var data_keys = ["data_v2","index_Developer","index_Genre","index_Name","index_Outlier_Flag","index_Percentage_of_Releases","index_Platform","index_Publisher","index_Rating", "index_Year_of_Release","index_TBD_Flag","util_irq_analisys_v2"];
	var file_extensions = ["csv", "json", "json", "json", "json", "json", "json", "json", "json", "json", "json", "json"];

	function load_status(){
		/*
		Devolve o "loading ratio" de todas as keys da datasources.

		> load_status()
		: 0.0
			 ^--- quando chamamos e ainda não recebemos dados nenhuns...

		> load_status()
		: 0.5
			 ^--- quando chamamos e já temos metade dos ficheiros... dá... dáááá... 0.5!
		> load_status()
		: 1.0
			 ^--- Quando termina... You got this... Dá 1.0.
		 */
		
		var status = data_keys
			.map(function(e){ return datasources[e] !== undefined; });

		return d3.sum(status) / data_keys.length;
	};

	function fetch_alldata(done_callback){
		/*
		 Itera todos os ficheiros no data_keys.
		 Faz fetch de cada ficheiro em modo async. 
		 Quando todos os ficheiros retornam, chama o main.
		 */
		done_callback = done_callback || function(){ };
		console.log("Lets fetch ALLLLLL THE DATAS!!!");
		data_keys.forEach(function(itr, idx){
			var ext = file_extensions[idx];
			var fetch_path = "data/" + itr + "." +ext;

			// determina qual a função do d3 a usar
			var d3_fetch = ext == "json" ? d3.json : d3.csv;

			// Faz fetch de cada ficheiro em modo async. 
			d3_fetch(fetch_path, function(error, data){
				// se houver erro... guess i'll die...
				if(error){
					console.log(error)
				}

				if (Array.isArray(data)){
					data.forEach(function(itr, idx){
						itr["row_num"] = idx;
					});
				}



				// store data in datasources
				datasources[itr] = data;

				// Quando todos os ficheiros retornam, chama o main.
				if(load_status() == 1.0){
					done_callback(datasources)
					data_ready();
				}
			});
		});
	};

	/*
	O d3.json e d3.csv são assincronos.
	Fazem a chamada ao webserver e quando os dados chegam, chamam a função de callback que lhe passar-mos.

	d3.json(path_string, <referencia para função>)

	A notação acima é o mais habitual e anonymous functions (pensem.... lambda? +/-...)
	
	- Quer dizer que isto:

				d3.csv("data/data_v2.csv", function(error, data){ 
					console.log("RECEBI OS DADOS PARA O DATA_V2")
				});

	- É igual a isto:
	
				function tratar_data_v2(error, data){
				 console.log("RECEBI OS DADOS PARA O DATA_V2")
				};

				d3.csv("data/data_v2.csv", tratar_data_v2)
	*/

	function get_records(col_names, col_values){
		/*
			get_records(["Genre"], ["Action"])  /// devolve todas as linhas que têm Action
			get_records(["Genre", "Platform"], ["Action", "PS3"]) /// devolve todas as linhas que têm Action e têm PS3
			> [
			{Name: "bla1", ..... },
			{Name: "bla2", ..... }
			]
		 */
		var result = [];
		var rownumbers = [];
		
		try{
			rownumbers = get_index(col_names, col_values);
			result = rownumbers.map(function(itr){ return datasources["data_v2"][itr]; });
		}
		catch(e){
			throw e;
		}

		return result;
	};

	function get_index(col_names, col_values){
		/*
			get_indexes(["Genre"], ["Action"])  /// devolve os row_nums das linhas que têm Action
			get_indexes(["Genre", "Platform"], ["Action", "PS3"])  /// devolve os row_nums das linhas que têm Action e têm PS3
			> [0, 1, 200, 400]
		 */
		
		var result = [];

		if(!Array.isArray(col_names)){
			col_names = [col_names];
		}

		// lets make sure the columns names are all valid
		col_names.forEach(function(col){
			if (typeof datasources["index_" + col] === "undefined"){
				throw new Error(col + " as col_names is not valid.");
			}})

		var row_nums = col_names
			.map(function(col, idx){ 
				return datasources["index_"+col].index[col_values[idx]] || []; })

		result = _.intersection.apply(null, row_nums)

		return result;
	};

	function column_hasvalue(col_name, col_value){
		/*
			column_hasvalue("Genre", "Action")   /// verifica se existe "Action"
			> true

			column_hasvalue("Genre", "LALALAL SPARTA!")  /// verifica se existe "LALALAL SPARTA"
			> false
		 */
		
		var result = null;
		var index_name = "index_" + col_name;

		if (typeof datasources[index_name] === "undefined"){
			throw new Error(col_name + " as col_name is not valid.");
		}

		result = datasources[index_name]["index"].hasOwnProperty(col_value);

		return result;
	};

	function read_column(rows, col_name){
		/*
			read_column(null, ["JP_Sales","EU_Sales","NA_Sales"])  /// devolve só a coluna de JP_Sales de todas as linhas do dataset
			read_column([100, 102], ["JP_Sales"])     /// só devolve a coluna de JP_Sales
			read_column([100, 102], ["JP_Sales", "Genre"])     /// só devolve as colunas de JP_Sales e Genre
			> [
			{JP_Sales: "bla1", "Genre": "blah3" },
			{JP_Sales: "bla2", "Genre": "blah4" }
			]
		 */
			
			var result = 0;

			if(!Array.isArray(col_name)){
				return read_column(rows, [col_name]);
			}

			col_name.forEach(function(col_name){ 
				if (Object.keys(datasources["data_v2"][0]).indexOf(col_name) == -1){
					throw new Error(col_name + " in col_names is not valid.");
				}
			})

			if(rows == null){
					result = datasources.data_v2.map(function(row) {
							var res = {};
							for(var i = 0; i < col_name.length; i++){
									res[col_name[i]] = row[col_name[i]];
							}
							return res;//{col_name[0]:a.JP_Sales , "EU_Sales":a.EU_Sales, "NA_Sales":a.NA_Sales};
					});
			}
			else{
					result = rows.map(function(row_number) {
							var res = {};
							var row = datasources.data_v2[row_number];
							for(var i = 0; i < col_name.length; i++){
									res[col_name[i]] = row[col_name[i]];
							}
							return res;//{col_name[0]:a.JP_Sales , "EU_Sales":a.EU_Sales, "NA_Sales":a.NA_Sales};
					});
					//result = datasources.data_v2.map(function(a) {return {"JP_Sales":a[rows].JP_Sales , "EU_Sales":a.EU_Sales, "NA_Sales":a.NA_Sales};});
			}
			return result;
	};
		
	function get_sales_sum(rows, ref_col_name, ref_col_value){
		/*
			get_sum(null, "Genre","Action")  /// devolve o somatorio dos valores das Sales em cada ano em relaçao ao Genre de Action
			> [
					{Genre: "Action", JP_Sales: "1002", "EU_Sales": "2550", "NA_Sales": "1253", "Year_of_Release":2001 },
					{Genre: "Action", JP_Sales: "2560", "EU_Sales": "100", "NA_Sales": "120", "Year_of_Release":1996 },
				]
		 */
		Array.prototype.contains = function(v) {
				for(var i = 0; i < this.length; i++) {
						if(this[i] === v) return true;
				}
				return false;
		};

		Array.prototype.unique = function() {
				var arr = [];
				for(var i = 0; i < this.length; i++) {
						if(!arr.includes(this[i])) {
								arr.push(this[i]);
						}
				}
				return arr; 
		}
		var sales = [];
		var res = [];
		var n = 0;
		if(rows == null){
				var r = datasources.data_v2.map(a => a["Year_of_Release"]);
				var uniqueYears = r.unique();
				for(var ind = 0; ind < uniqueYears.length; ind++){
						var year = uniqueYears[ind];
						var JP = 0;
						var EU = 0;
						var NA = 0;
						var new_row = {};
						for(var i = 0; i < datasources.data_v2.length; i++){
								var row = datasources.data_v2[i];
								if(row.Year_of_Release == year && row[ref_col_name]==ref_col_value){
										JP += parseFloat(row["JP_Sales"]);
										EU += parseFloat(row["EU_Sales"]);
										NA += parseFloat(row["NA_Sales"]);
								}
						}
						new_row["Year_of_Release"] = year;
						new_row[ref_col_name] = ref_col_value;
						new_row["JP_Sales"] = JP;
						new_row["EU_Sales"] = EU;
						new_row["NA_Sales"] = NA;
						res[ind] = new_row;
				}
		}
		return res;
	};

	function read_value(row_number, col_name){
		var result;

		if (Object.keys(datasources["data_v2"][0]).indexOf(col_name) == -1){
			throw new Error(col_name + " in col_names is not valid.");
		}

		if (typeof datasources["data_v2"][row_number] === "undefined" ){
			throw new Error(row_number + " is not a valid row number.");
		}

		result = datasources["data_v2"][row_number][col_name];

		return result;
	};

	function compute_personsr_linregress(row_nums, x_var, y_var){
		/*
			@TODO: Talvez mudar isto daqui para ser genérico entre qualquer par de colunas?

			Por um lado, isto deviam ser 2 funções:
				- compute pearson's r (a correlação)
				- compute linear regression (o declive + o corte na origem)

			Pelo outro, os cálculos iniciais são os mesmos... 

			Para não fazer os 2 cálculos 2 vezes, juntámos ambos os na mesma funcção.

			Usámos estas fórmulas:
			 - https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
			 - https://en.wikipedia.org/wiki/Linear_regression

			não calculamos os residuais...
		 */
		
		var result = {
			pearsonr: 0,
			slope: 0,
			intercept: 0
		};

		if ( row_nums.length == 0 ){
			return result;
		};

		var X_mu = d3.mean(row_nums, function(d){ return read_value(d, x_var) })
		var X_0mu = row_nums.map(function(d){ return read_value(d, x_var) - X_mu; })

		var Y_mu = d3.mean(row_nums, function(d){ return read_value(d, y_var) })
		var Y_0mu = row_nums.map(function(d){ return read_value(d, y_var) - Y_mu; })

		var _a = d3.sum(row_nums, function(d, i){ return X_0mu[i]*Y_0mu[i]; })

		var _b = Math.sqrt(d3.sum(X_0mu, function(d){ return Math.pow(d, 2); }))
		var _c = Math.sqrt(d3.sum(Y_0mu, function(d){ return Math.pow(d, 2); }))
		var _d = _b*_c;

		var r = _a / _d;
		var slope = _a / Math.pow(_b, 2);;
		var intercept = Y_mu - (slope* X_mu);

		result["pearsonr"] = r;
		result["slope"] = slope;
		result["intercept"] = intercept;

		return result;
	};

	// isto faz com que a datasources exista nos outros ficheiros.
	window.datasources = datasources;
	window.data_utils = {
		load_status: load_status,
		fetch_alldata: fetch_alldata,
		read_column: read_column,
		get_sales_sum: get_sales_sum,
		get_records: get_records,
		get_index: get_index,
		column_hasvalue: column_hasvalue,
		read_value: read_value,
		compute_personsr_linregress: compute_personsr_linregress
	}
})();
