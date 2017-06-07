require('dotenv').config({path: __dirname + '/.env'}); // using require('dotenv').config();  can cause problems if not ran from current directory... specifying this path fixes those problems
var knex = require('knex')({
  client : 'mssql',
  connection: {
    host : process.env.AZURE_DB_HOST,
    user : process.env.AZURE_DB_USER,
    password : process.env.AZURE_DB_PASSWORD,
    options: {
        port: 1433,
        database : process.env.AZURE_DB_DBNAME,
        encrypt: true
    }
  }
});

knex.select("*").from("SalesLT.Customer").asCallback(function (err, values) {
    if (err) {
        console.log(err);
    } else {
        console.log(values);
    }
    knex.destroy();
});

console.log("Ahh");