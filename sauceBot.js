process.on('unhandledRejection', e => {
    console.log("unhandledRejection:");
    console.dir(e);
});

const botInit = require("./bot/init.js");

botInit();