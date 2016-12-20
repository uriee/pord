var sql = require('mssql'); 
var express = require('express');        
var app = express(); 
var path = require('path'); 
app.use(express.static('build'))       

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');app.engine('html', require('ejs').renderFile);


var bodyParser = require('body-parser');
 
var config = {
    user: '',
    password: '',
    server: '', 
    database: ''
}

server = 'http://192.168.7.223:4000/upadateordi';
clients={};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var port = process.env.PORT || 4000;
var router = express.Router(); 


router.route('/')
    .get(function(req, res) {
    res.json({ message: 'welcome to Silora R&d Orders Feedback. you need to follow the link from your Email to get to your Orders' });   
});

router.route('/alerts/:sup')
    .get(function(req, res) {
    /*res.sendFile(path.join(__dirname + '/build/index.html'));*/
    res.render("index.html",{sup : req.params.sup});
});

router.route('/updateordi/:ordi/:action')
    .get(function(req, res) {
        console.log("in",req.params.ordi,req.params.action);

        sql.connect(config, function(err) {
            if(err){
                console.log("Connection Error: "+err);
                return;
            }
            if(!req.params.ordi) return res.send(err);
            var status = '';
            if (req.params.action == 'R') status = 'R';
            if (req.params.action == 'A') status = 'A';    
            var request = new sql.Request();        
            Q = "UPDATE SIL_PORDERITEMS SET SUPSTATUS = '"+status+"' WHERE ORDI = "+req.params.ordi+';'
            /*Q = 'SELECT DISTINCT SUPSTATUS FROM SIL_PORDERITEMS;'*/
            console.log(status,Q);
            request.query(Q).then(function(recordset) {
                console.log(request.rowsAffected,Q);
                res.set('Access-Control-Allow-Origin', '*');
                res.json({UPDATE : 1,row : request,rs : recordset});
            },function(err) {console.log(err);}
            );
        });
    });


router.route('/feedback/:sup')
    .get(function(req, res) {
        sql.connect(config, function(err) {
            if(err){
                console.log("Connection Error: "+err);
                return;
            }

            var select = 'SELECT OI.ORDI AS ORDI ,ORDNAME,LINE,PARTNAME,TBALANCE/100 AS BAL,ARRDATE ',
                from = 'FROM PORDERITEMS OI,PORDERS O , PART P , PORDERITEMSA A ',
                join = 'WHERE P.PART = OI.PART AND O.ORD = OI.ORD AND A.ORDI = OI.ORDI ',
                where = 'AND O.SUP = \''+req.params.sup+'\' AND  DATEDIFF(minute,\'01-01-1988 00:00\',getdate()) + 1440 * 7 > ARRDATE ',
                where2= 'AND OI.CLOSED <> \'C\' AND A.PORDISTATUS = 2 '
                order = 'ORDER BY ARRDATE DESC;',
                Q = select + from + join + where + where2 + order;

            var request = new sql.Request();
            request.query(Q).then(function(recordset,err) {
                if(err){
                    console.log("Query Error: "+err);
                }

                for (x in recordset){
                    var a = new Date( (567993600 +recordset[x].ARRDATE * 60 ) *1000);
                    recordset[x].DATE = a.toString().slice(0,15);
                }
                return recordset;
            }).then(function(recordset) {
                    res.set('Access-Control-Allow-Origin', '*');
                    res.json(recordset);
                },
                function(err) {console.log(err);
            })            
        });
    });


app.use('/', router);

app.listen(port);
console.log('Magic happens on port ' + port);

