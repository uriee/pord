var sql = require('mssql'); 
var express = require('express');        
var app = express(); 
var path = require('path'); 
app.use(express.static('build'))       

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');app.engine('html', require('ejs').renderFile);


var bodyParser = require('body-parser');
 
var config = {
    user: 'tabula',
    password: 'Manager1',
    server: '192.168.7.199\\PRI', 
    database: 'silrd'
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

router.route('/approve/:ordi/')
    .get(function(req, res) {

        sql.connect(config, function(err) {
            if(err){
                console.log("Connection Error: "+err);
                return;
            }
            if(!req.params.ordi) return res.send(err);
            var request = new sql.Request();        
            Q = "UPDATE SIL_PORDERITEMS SET SUPSTATUS = 'A' WHERE ORDI = "+req.params.ordi+';'
            request.query(Q).then(function(recordset) {
                console.log(request.rowsAffected,Q);
                res.set('Access-Control-Allow-Origin', '*');
                res.json({UPDATE : 1,row : request,rs : recordset});
            },function(err) {console.log(err);}
            );
        });
    });

router.route('/reject/:ordi/:text')
    .get(function(req, res) {

        sql.connect(config, function(err) {
            if(err){
                console.log("Connection Error: "+err);
                return;
            }
            if(!req.params.ordi) return res.send(err);
  
            var request = new sql.Request();        
            Q = "UPDATE SIL_PORDERITEMS SET SUPSTATUS='R',TEXT2='"+req.params.text+"' WHERE ORDI = "+req.params.ordi+';'

            request.query(Q).then(function(recordset) {
                console.log(request.rowsAffected,Q);
                res.set('Access-Control-Allow-Origin', '*');
                res.json({UPDATE : 1,row : request,rs : recordset});
            },function(err) {console.log(err);}
            );
        });
    })    


router.route('/feedback/:sup')
    .get(function(req, res) {
        sql.connect(config, function(err) {
            if(err){
                console.log("Connection Error: "+err);
                return;
            }


            var Q1 = 'SELECT PORDERITEMS.ORDI AS ORDI ,ORDNAME,LINE,PARTNAME,TBALANCE/100 AS BAL,ARRDATE,MNFPARTNAME ',
                Q2 = 'FROM PORDERITEMS ',
                Q3 = 'INNER JOIN PORDERS ON PORDERS.SUP = \''+req.params.sup+'\' ',
                Q4 = 'INNER JOIN PART ON 1 = 1 ',
                Q5 = 'INNER JOIN SIL_PORDERITEMS ON SIL_PORDERITEMS.ORDI = PORDERITEMS.ORDI ',
                Q6 = 'INNER JOIN PORDERITEMSA ON PORDERITEMSA.ORDI = PORDERITEMS.ORDI ',                
                Q7 = 'LEFT OUTER JOIN PARTMNF ON PARTMNF.MNF = SIL_PORDERITEMS.INTDATA4 AND PARTMNF.PART = PART.PART ',
                Q8 = 'WHERE PORDERITEMS.PART = PART.PART AND PORDERITEMS.ORD = PORDERS.ORD AND PORDERITEMS.CLOSED <> \'C\' ',
                Q9 = 'AND DATEDIFF(minute,\'01-01-1988 00:00\',getdate()) + 1440 * 7 > ARRDATE AND PORDERITEMSA.PORDISTATUS = 2;',
                Q = Q1+Q2+Q3+Q4+Q5+Q6+Q7+Q8+Q9;

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

