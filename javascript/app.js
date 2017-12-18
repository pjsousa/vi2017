;(function(){
	var appstate = {
			datasetRows: [],
			selectedRows: [],
			highlightedRows: [],
			data_slices: {}
		};

		/* About appstate..
			- highlightedRows: row_numbers being hovered. 
								All visualizations read and write here. 
								We can only fire mouse moves/overs in 1 viz at a time so that's ok...
								... when we fire some "mouseover" de "mouseout" of someother viz already fired.

			- selectedRows: This is a catalogue of selections made in the viz. 
								Mostly fired by "clicks" and "brushes".

								Should have arrays of [<who made the selection>, [number of rows]].

								For example:
									[
										["t1", [10, 20, 23, 102, 403, ...] ],  
												^--- the brush for t1 is at [2009-2010] (lets imagine 
															that these were the row_numbers with 2009 or 2010 
															in Year_of_Release

										["t5", [20]],
												^--- We clicked in "Grand Theft Auto V" in T5
									]
		 */

	var columna_captions = {
		"Global_Sales": "Sales",
		"Mean_UserCritic_Score": "Score"
	}

	var appdispatch = {
		gamehover: d3.dispatch("gamehover"),
		gameout: d3.dispatch("gameout"),
		dataslice: d3.dispatch("dataslice")
	};

	appdispatch.gamehover.on("gamehover", function(d, from){

		if(from != "t2"){
			drawHighlightt2(from);
		}

		if(from != "t5"){
			drawHighlightt5(from);
		}

		if(from != "dtl"){
			drawdtl(from);
		}

		if(from != "clv"){
			drawHighlightclv(from);
		}
	});

	appdispatch.gameout.on("gameout", function(d, from){
		if(from != "t2"){
			drawHighlightt2(from);
		}

		if(from != "t5"){
			drawHighlightt5();
		}

		if(from != "clv"){
			drawHighlightclv();
		}

	});

	appdispatch.dataslice.on("dataslice", function(from){
		appstate.datasetRows = d3.range(datasources["data_v2"].length);
		appstate.datasetRows = slice_util.sliceRows(appstate.data_slices, appstate.datasetRows);

		
		// if(from!="t1"){
		// 	drawt1(appstate.datasetRows);
		// }

		if(from!="t5"){
			drawt5(appstate.datasetRows);
		}

		
		drawt2(appstate.datasetRows);
		

		if(from!="clv"){
			drawclv(appstate.datasetRows);
		}

	});

	function main(){
		console.log("HEY! Main here. Lets start!")
		
		setVizSizes();
		data_utils.fetch_alldata();
	};

	function setVizSizes(){
		d3.selectAll(".panel-viz .panel-body").each(function(){
			var _id = d3.select(this).attr("id");

			if(_id == "t1Viz"){
				setSizest1(this.getClientRects()[0])
			}
			else if(_id == "t5Viz"){
				setSizest5(this.getClientRects()[0]);
			}
			else if(_id == "t2Viz"){
				setSizest2(this.getClientRects()[0])
			}
			else if(_id == "clvViz"){
				setSizesclv(this.getClientRects()[0]);
			}
			else if(_id == "dtlViz"){
				setSizesdtl(this.getClientRects()[0]);
			}
			else if(_id == "t6Viz"){
				//setSizest6(this.getClientRects()[0])
			}
			else if(_id == "t4Viz"){
				setSizest4(this.getClientRects()[0]);
			}
		})
	}

	function data_ready(){
		console.log("All data fetched!!!");

		appstate.data_slices = slice_util.slicerules_factory()
		appstate.datasetRows = d3.range(datasources["data_v2"].length);
		appstate.datasetRows = slice_util.sliceRows(appstate.data_slices, appstate.datasetRows);


		drawt1(appstate.datasetRows);
		drawt5(appstate.datasetRows);
		drawt2(appstate.datasetRows);
        drawt4(appstate.datasetRows);
		drawclv(appstate.datasetRows);
	};

	window.main = main;
	window.data_ready = data_ready;
	window.appstate = appstate;
	window.appdispatch = appdispatch;
	window.setVizSizes = setVizSizes;
})();