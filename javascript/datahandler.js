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
  datasources["util_irq_analisys_v2"] = undefined;

  // isto é só porque pode dar jeito ter as keys hardcoded...
  var data_keys = ["data_v2","index_Developer","index_Genre","index_Name","index_Outlier_Flag","index_Percentage_of_Releases","index_Platform","index_Publisher","index_Rating","index_TBD_Flag","util_irq_analisys_v2"];
  var file_extensions = ["csv", "json", "json", "json", "json", "json", "json", "json", "json", "json", "json"];

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

  function fetch_alldata(){
    /*
     Itera todos os ficheiros no data_keys.
     Faz fetch de cada ficheiro em modo async. 
     Quando todos os ficheiros retornam, chama o main.
     */
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

        // store data in datasources
        datasources[itr] = data;

        // Quando todos os ficheiros retornam, chama o main.
        if(load_status() == 1.0){
          
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

  function get_records(col_name, col_value){
    /*
      get_records(["Genre"], ["Action"])  /// devolve todas as linhas que têm Action
      get_records(["Genre", "Platform"], ["Action", "PS3"]) /// devolve todas as linhas que têm Action e têm PS3
      > [
      {Name: "bla1", ..... },
      {Name: "bla2", ..... }
      ]
     */
  };

  function get_index(col_name, col_value){
    /*
      get_indexes(["Genre"], ["Action"])  /// devolve os row_nums das linhas que têm Action
      get_indexes(["Genre", "Platform"], ["Action", "PS3"])  /// devolve os row_nums das linhas que têm Action e têm PS3
      > [0, 1, 200, 400]
     */
  };

  function column_hasvalue(col_name, col_value){
    /*
      column_hasvalue("Genre", "Action")   /// verifica se existe "Action"
      > true

      column_hasvalue("Genre", "LALALAL SPARTA!")  /// verifica se existe "LALALAL SPARTA"
      > false
     */
  };

  function read_column(rows, col_name){
    /*
      read_column([100, 102], "JP_Sales")     /// só devolve a coluna de JP_Sales
      read_column([100, 102], ["JP_Sales", "Genre"])     /// só devolve as colunas de JP_Sales e Genre
      > [
      {JP_Sales: "bla1", "Genre": "blah3" },
      {JP_Sales: "bla2", "Genre": "blah4" }
      ]
     */
  };

  // isto faz com que a datasources exista nos outros ficheiros.
  window.datasources = datasources;
  window.data_utils = {
    load_status: load_status,
    fetch_alldata: fetch_alldata
  }
})();
