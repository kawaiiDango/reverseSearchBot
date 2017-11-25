process.on('unhandledRejection', e => {
    console.log("unhandledRejection:");
    console.dir(e);
});

var botInit = require("./bot/init.js");

botInit();
