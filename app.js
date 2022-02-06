var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images/', express.static('./public/images'));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'your_password'));
var session = driver.session(); 

app.get('/', function(req, res){
    session
        .run('MATCH (n:Information_System) RETURN n')
        .then(function(result){
            var systems = [];
            result.records.forEach(function(record){
                systems.push({
                    name: record._fields[0].properties.name,
                });
                //console.log(record._fields[0].properties.name);
            });
            session
                .run('MATCH (n:Procedure) RETURN n')
                .then(function(result){
                    var procedures = [];
                    result.records.forEach(function(record){
                        procedures.push({
                            name: record._fields[0].properties.name,
                        });
                        //console.log(record._fields[0].properties.name);
                    });

                    session
                        .run('MATCH (n:Synonym) RETURN n')
                        .then(function(result){
                            var synonyms = [];
                            result.records.forEach(function(record){
                                synonyms.push({
                                    name: record._fields[0].properties.name,
                                });
                                //console.log(record._fields[0].properties.name);
                            });
                            res.render('index', {
                                systems: systems,
                                procedures: procedures,
                                synonyms: synonyms,
                            });
                        })
                })
        })
});

app.post('/searchSynonyms', function(req, res){
    var synonym = req.body.synonym;

    session
        .run('match (n:Procedure)<-[r:is_synonymous_of]-(b:Synonym {name:"'+ synonym +'"}) return n')
        .then(function(result){
            var search = [];
            result.records.forEach(function(record){
                search.push({
                    name: record._fields[0].properties.name,
                });
                //console.log(record._fields[0].properties.name);
            });
            res.render('results', {
                search: search
            });
        });
});

app.post('/searchIF', function(req, res){
    var procedure = req.body.procedure;

    session
        .run('match (n:Procedure {name:"'+ procedure +'"})<-[r:does]-(b:Information_System) return b')
        .then(function(result){
            var search = [];
            result.records.forEach(function(record){
                search.push({
                    name: record._fields[0].properties.name,
                });
                //console.log(record._fields[0].properties.name);
            });
            res.render('results', {
                search: search
            });
        });
});

app.post('/searchProcedures', function(req, res){
    var system = req.body.system;

    session
        .run('match (n:Procedure)<-[r:does]-(b:Information_System {name:"'+ system +'"}) return n')
        .then(function(result){
            var search = [];
            result.records.forEach(function(record){
                search.push({
                    name: record._fields[0].properties.name,
                });
                //console.log(record._fields[0].properties.name);
            });
            res.render('results', {
                search: search
            });
        });
});

app.listen(3000);
console.log('it´s on');

module.exports = app;
