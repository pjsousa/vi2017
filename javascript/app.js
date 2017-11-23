;(function(){
  var appstate = {
      datasetRows: [],
      selectedRows: [],
      highlightedRows: [],
      data_slices: []
    };

  var columna_captions = {
    "Global_Sales": "Sales",
    "Mean_UserCritic_Score": "Score"
  }

  var appdispatch = {
    gamehover: d3.dispatch("gamehover")
  };

  appdispatch.gamehover.on("gamehover", function(d, from){

    if(from != "t5"){
      drawt5();
    }

    if(from != "dtl"){
      drawdtl();
    }

  });

  function main(){
    console.log("HEY! Main here. Lets start!")
    
    data_utils.fetch_alldata();
  }

  function data_ready(){
    console.log("All data fetched!!!");

    appstate.datasetRows = d3.range(datasources["data_v2"].length);

    //drawt1();
    drawt5();
  };

  window.main = main;
  window.data_ready = data_ready;
  window.appstate = appstate;
  window.appdispatch = appdispatch;
})();