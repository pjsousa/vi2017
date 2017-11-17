## [Projecto VI 2017](https://fenix.tecnico.ulisboa.pt/disciplinas/VI255/2017-2018/1-semestre)
#### G10-T



### Project structure
``` bash
├── data                (folder with Raw data files)
│   └── [...]           
├── index.html          (main html file)
├── javascript          (folder with javascript sources)
│   ├── app.js          (main app)
│   ├── cleveland.js    
│   ├── datahandler.js  (file with utils to fetch/load/search (and generally handle) data)
│   ├── detail.js       
│   ├── t1.js           
│   ├── t2.js           
│   ├── t3.js           
│   ├── t4.js           
│   ├── t5.js           
│   └── t6.js           
├── libs                (sources for 3rd party libs)
│   └── [...]           
└── style.css           (main css file)
```

### Start working
1. Clone repo
2. Install python/conda/virtualenv
3. Spin Server
4. Visit page in your browser

``` bash
# (1) Clone repo
git clone git@github.com:pjsousa/vi2017.git
```

``` bash
# (3) Start the server...

# ..for a python 2.7 environment
python -m python -m SimpleHTTPServer 8888

# ..for a python 3.x environment
python -m python -m http.server 8888

```

``` bash
# (4). Visit page in your browser

# if you used one of the commands above, you can go to:
http://localhost:8888/index.html

```


#### Visiting the web page
The general flow of the page is:
###### (1) We wait for all the page content to load
- [This](https://github.com/pjsousa/vi2017/blob/30365b0665c74abbe9816c9e63ef3f2cf12c8231/index.html#L53) is waiting for the page load event.

###### (2) We fetch all data files and store them in a global structure
- [Here](https://github.com/pjsousa/vi2017/blob/30365b0665c74abbe9816c9e63ef3f2cf12c8231/javascript/datahandler.js#L2) you can read a bit about the datahandler and (some) of its use, for now. Also, [here](https://github.com/pjsousa/vi2017/blob/30365b0665c74abbe9816c9e63ef3f2cf12c8231/javascript/datahandler.js#L135) is a small explanation of why this is the same thing as we did in the lab.

###### (3) When all files were received, we start the page's app.
- Which just means, when some "all loaded" condition is true, we'll call [this](https://github.com/pjsousa/vi2017/blob/30365b0665c74abbe9816c9e63ef3f2cf12c8231/javascript/app.js#L1) guy.


