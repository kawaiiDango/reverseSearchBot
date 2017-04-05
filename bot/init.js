global.debug = false;
global.userCount = {
  on: true
};

var tokenBot = require("../account/bot.js");
// tokenBot should be the Telegram bot token
var tokenSN = require("../account/saucenao.js");

var TeleBot = require("telebot");
var axios = require("axios");
var request = require("./request.js");

var tools = require("../tools/tools.js");

var SETTINGS = require("../settings/settings.js");
var MESSAGE = SETTINGS.msg;
/* moduleSwitch's property indicates whether to turn on/off the module */
var moduleSwitch = SETTINGS.moduleSwitch;
var reportOpt = SETTINGS.report;
/* overwrite reportOpt.receiver_id with your telegram user id(numtype) in array form*/
reportOpt.receiver_id = require("../account/receiverId.js");
var flooderOpt = SETTINGS.flooder;
var reportToOwner = require("./reportToOwner.js");

var bot = new TeleBot({
  token: tokenBot,
  modules: {
    flooder: {
      interval: flooderOpt.interval,
      message: flooderOpt.msg
    },
    report: {
      events: reportOpt.condition,
      to: reportOpt.receiver_id
    }
  }
});
// console.log("bot obj is ", bot);

module.exports = function() {
  /* Switch on/off the modules according to preset in moduleSwitch above */
  /* On/off settings of modules are at settings/settings.js */
  var modules = Object.keys(moduleSwitch);
  for (var i = 0; i < modules.length; i ++) {
    if (moduleSwitch[modules[i]]) {
      bot.use(require("../modules/" + modules[i] + ".js"));
    }
  }

  bot.on(["/help", "/start"], function(msg) {
    var chat_id = msg.chat.id;
    var reply = msg.message_id;
    if (global.debug) console.log("msg is ", msg);

    bot.sendMessage(chat_id, MESSAGE.help, {reply: reply, parse: "Markdown"});
  });

  bot.on(["*"], function(msg) {
    var chat_id = msg.chat.id;
    var reply = msg.message_id;
    if (global.debug) console.log("msg is ", msg);

    if (msg.text === "/help") {
      return;
    } else if (msg.text === "/start") {
      return;
    } else if (msg.text) {
      if (msg.chat.type == "private"){
        if (tools.urlDetector(msg.text)) {
          var url = msg.text;
          request(url, bot, tokenSN, msg);
        } else {
          bot.sendMessage(chat_id, MESSAGE.invalidUrl, {reply: reply, parse: "Markdown"});
        }
      }
    } else if (msg.photo && msg.photo.length > 0) {
      bot.getFile(msg.photo[msg.photo.length-1].file_id)
      .then(function(file) {
        if (global.debug) console.log("file is", file);

        reportToOwner.reportFileUrl(file, tokenBot, bot);

        console.log("loading...");
        ///bot.sendMessage(chat_id, MESSAGE.loading, {reply: reply, parse: "Markdown"});

        var url = "https://api.telegram.org/file/bot" + tokenBot + "/" + file.file_path;
        request(url, bot, tokenSN, msg);
      });
    } else {
      ///bot.sendMessage(chat_id, MESSAGE.invalidForm, {reply: reply, parse: "Markdown"});
    }
  });

  bot.connect();
  console.log("bot: connected");

};
