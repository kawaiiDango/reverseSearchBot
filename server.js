var express = require("express");
var bodyParser = require("body-parser");

var botInit = require("./bot/init.js");

var app = express();
var port = 3001;

/* Setup express application */
// app.use(logger("dev"));
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

/* initialize Telegram bot */

botInit();

/* Launch Server */
var server = app.listen(port, "localhost", function() {
  console.log("Express listening on port ", port);
});
