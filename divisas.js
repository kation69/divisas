const express = require('express')
const app = express()
var bodyParser = require('body-parser')
const port =  process.env.PORT ||3003
var MongoClient = require("mongodb").MongoClient
var urlMongo = process.env.URLMONNGO || "mongodb://localhost"
var tabla_divisas="divisas"
var version="V1"
function logsMongo(servicio="",peticion="",user="",mensaje="",error=false){
  if(error){
	  console.error(mensaje)
  }
  else{
	  console.log(mensaje)
  }
  try{
    MongoClient.connect(urlMongo,function(err,clients){
      if (err){
        console.log("NO Connected Mongo!");
      }
      else{
        var db=clients.db("LogsBBDD")
        db.collection("logs").insertOne({
          "FECHA":new Date,
          "SERVICIO":servicio,
          "PETICION":peticion,
          "USER":user,
          "MENSAJE":mensaje,
          "ERROR":error
        }).then(function (response) {
          clients.close()
        })
      }       
    })
  }
  catch(err){
    console.error("MONGO NO CONECTADO")
  }
}
const mysql = require('mysql')
const con = mysql.createConnection({
  host: process.env.MYSQLHOST || "127.0.0.1",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASS || "a12345?",
  database: process.env.MYSQLDB || "cambio_divisas",
  insecureAuth : true
})
con.connect(function(err) {
  if (err){
    logsMongo("divisas.js","INIT","","NO Connected MySQL!",true)
    console.log("NO Connected MySQL!");
    logsMongo("divisas.js","INIT","","EN MYSQL: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'a12345?';EN MYSQL: ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'a12345?';flush privileges;",true)
    console.log("EN MYSQL: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'a12345?';EN MYSQL: ALTER USER 'root' IDENTIFIED WITH mysql_native_password BY 'a12345?';flush privileges;");
    throw err;
  }
  console.log("Connected MySQL!");
  logsMongo("divisas.js","INIT","","Connected MySQL!",false)
});
con.end



app.get('/lista', (req, res) => {
  try{
    res.set('Content-Type', 'plain/json');
    console.log("Listado solicitado");

    con.query("SELECT Id,Nombre FROM "+tabla_divisas, function (err, result) {
      if (err)  throw err;
      try{
        logsMongo("divisas.js","/lista","","Listado solicitado",false)
        res.send(JSON.stringify(result));
      }
      catch(errors){
        logsMongo("divisas.js","/lista","","Error Listado solicitado",true)
        res.status(500).send({"value":"ERROR"})
      }
    })
  }
  catch(ERR){
    logsMongo("divisas.js","/lista","","Error Listado solicitado",true)
    res.status(500).send({"value":"ERROR"})
  }
    
  

})
  

app.post('/cambio', (req, res) => {
  try{
    res.set('Content-Type', 'plain/json');
    moneda_in=req.query.moneda_in
    moneda_out=req.query.moneda_out
    cantidad=req.query.cantidad
    console.log("Cambio solicitado: "+moneda_in+" a "+moneda_out+" de la cantidad "+cantidad)
    con.query("SELECT id,cambio,nombre FROM "+tabla_divisas+" where id in ("+moneda_in+","+moneda_out+")", function (err, result) {
      if (err)  {
        logsMongo("divisas.js","/cambio","","Error realizar cambio",true)
        res.status(500).send({"version":version,"value":"ERROR"})
      }
      else{
        try{
          var respuesta={"version":version,"value":"ERROR"};
          if(moneda_in==moneda_out){
            respuesta={"version":version,"value":cantidad*result[0]["cambio"]/result[0]["cambio"],"monedaInText":result[0]["nombre"],"monedaOutText":result[0]["nombre"]}
            logsMongo("divisas.js","/cambio","","Cambio realizado",false)
          }
          else if(result[0]["id"]==moneda_in){
            respuesta={"version":version,"value":cantidad*result[1]["cambio"]/result[0]["cambio"],"monedaInText":result[0]["nombre"],"monedaOutText":result[1]["nombre"]}
            logsMongo("divisas.js","/cambio","","Cambio realizado",false)
          }
          else if(result[1]["id"]==moneda_in){
            respuesta={"version":version,"value":cantidad*result[0]["cambio"]/result[1]["cambio"],"monedaInText":result[1]["nombre"],"monedaOutText":result[0]["nombre"]}
            logsMongo("divisas.js","/cambio","","Cambio realizado",false)
          }
          else{
            logsMongo("divisas.js","/cambio","","Error realizar cambio",true)
          }
          console.log("Cambio realizado: "+moneda_in+" a "+moneda_out+" de la cantidad "+cantidad+" valiendo "+respuesta["value"])
          res.send(JSON.stringify(respuesta));
        }
        catch(errors){
          logsMongo("divisas.js","/cambio","","Error realizar cambio",true)
          res.status(500).send({"version":version,"value":"ERROR"})
        }
      }
      
    })
  }catch(ersss){
    logsMongo("divisas.js","/cambio","","Error realizar cambio",true)
    res.status(500).send({"version":version,"value":"ERROR"})
  }
})
app.get('/*', (req, res) => {
  logsMongo("divisas.js","/*","","Error peticion",true)
  res.set('Content-Type', 'plain/json');
  res.status(500).send({"version":version,"value":"ERROR"})
})
app.post('/*', (req, res) => {
  logsMongo("divisas.js","/*","","Error peticion",true)
  res.set('Content-Type', 'plain/text');
  res.status(500).send({"version":version,"value":"ERROR"})
})

app.listen(port, () => {
  logsMongo("divisas.js","INIT","","Inicio servicio",false)
  console.log(`Comprobar uso en http://localhost:${port}`)
})
