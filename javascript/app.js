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
    
    setVizSizes();
    data_utils.fetch_alldata();
  };

  function setVizSizes(){
    d3.selectAll(".panel-viz .panel-body").each(function(){
      var _id = d3.select(this).attr("id");

      if(_id == "t1Viz"){
        //setSizest1(this.getClientRects()[0])
      }
      else if(_id == "t5Viz"){
        setSizest5(this.getClientRects()[0]);
      }
      else if(_id == "t2Viz"){
        //setSizest2(this.getClientRects()[0])
      }
      else if(_id == "clvViz"){
        //setSizest4(this.getClientRects()[0])
      }
      else if(_id == "dtlViz"){
        //setSizesdtl(this.getClientRects()[0])
      }
      else if(_id == "t6Viz"){
        //setSizest6(this.getClientRects()[0])
      }
      else if(_id == "t4Panel"){
        //setSizest4(this.getClientRects()[0])
      }
      

    })
  }

  function data_ready(){
    console.log("All data fetched!!!");

    appstate.datasetRows = d3.range(datasources["data_v2"].length);

    drawt1();
    drawt5();
  };

  window.main = main;
  window.data_ready = data_ready;
  window.appstate = appstate;
  window.appdispatch = appdispatch;
})();