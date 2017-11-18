;(function(){
  function main(){
    console.log("HEY! Main here. Lets start!")
    data_utils.fetch_alldata();
    /*
      aqui chamamos os INIT de cada VIZ e da APP e de TUDOOOOO!
     */
  }

  function data_ready(){
    console.log("All data fetched!!!");
  };

  window.main = main;
  window.data_ready = data_ready;
})();