global.debug = false;
global.userCount = {
  on: true
};

var SETTINGS = require("../settings/settings.js");
var tokenBot = SETTINGS.private.botToken;
// tokenBot should be the Telegram bot token
var tokenSN = SETTINGS.private.SNKey;
var KEYWORDS = require("../settings/settings.js").keywords;

var TeleBot = require("telebot");
var axios = require("axios");
var request = require("./request.js");

var tools = require("../tools/tools.js");


var MESSAGE = SETTINGS.msg;
/* moduleSwitch's property indicates whether to turn on/off the module */
var moduleSwitch = SETTINGS.moduleSwitch;
var reportOpt = SETTINGS.report;
/* overwrite reportOpt.receiver_id with your telegram user id(numtype) in array form*/
reportOpt.receiver_id = SETTINGS.private.adminId;
var flooderOpt = SETTINGS.flooder;
var reportToOwner = require("./reportToOwner.js");

var bot = new TeleBot({
  token: tokenBot,
  modules: {
    flooder: {
      interval: flooderOpt.interval,
      message: flooderOpt.msg,
      numMsgs: flooderOpt.numMsgs
    },
    report: {
      events: reportOpt.condition,
      to: reportOpt.receiver_id
    }
  }
});
// console.log("bot obj is ", bot);

module.exports = () => {
  /* Switch on/off the modules according to preset in moduleSwitch above */
  /* On/off settings of modules are at settings/settings.js */
  var modules = Object.keys(moduleSwitch);
  for (var i = 0; i < modules.length; i ++) {
    if (moduleSwitch[modules[i]]) {
      bot.use(require("../modules/" + modules[i] + ".js"));
    }
  }

  bot.on(["/help", "/start"], msg => {
    var chat_id = msg.chat.id;
    var reply = msg.message_id;
    if (global.debug) console.log("msg is ", msg);

    bot.sendMessage(chat_id, MESSAGE.help, {reply: reply, parse: "Markdown"});
  });

  bot.on(["*"], msg => {
    var chat_id = msg.chat.id;
    var reply = msg.message_id;
    if (global.debug) console.log("msg is ", msg);

    if (msg.text === "/help" || msg.text === "/start") {
      return;
    } else if (msg.text) {
      if (KEYWORDS.indexOf(msg.text.toLowerCase()) >-1){
        var rmsg = msg.reply_to_message;
        if (rmsg && rmsg.photo && rmsg.photo.length > 0)
          getSauceInit(rmsg);
        else
          bot.sendMessage(chat_id, MESSAGE.keywordHelp, {reply: reply, parse: "Markdown"});
      }
      else if (msg.chat.type == "private"){
        if (tools.urlDetector(msg.text)) {
          msg.url = msg.text;
          getSauceInit(msg);
        } else if(!msg.entities){
          //bot.sendMessage(chat_id, MESSAGE.invalidUrl, {reply: reply, parse: "Markdown"});
        }
      }
    } else if (msg.photo && msg.photo.length > 0 && 
      (SETTINGS.private.favouriteGroups.indexOf(chat_id)>-1 || 
        msg.chat.type == "private")) {
      getSauceInit(msg);
    } else {
      ///bot.sendMessage(chat_id, MESSAGE.invalidForm, {reply: reply, parse: "Markdown"});
    }
  });

  // On inline query
  bot.on('inlineQuery', msg => {

    let query = msg.query;
    var loadingKb = bot.inlineQueryKeyboard([[
        bot.inlineButton(SETTINGS.id_buttonName.loading, {
          callback: "noop"
        })
      ]]);
    var answers = bot.answerList(msg.id, { cacheTime: 1000,
      switch_pm_text: "Search by an image instead" });

    if (tools.urlDetector(query)) { //url
        answers.addArticle({
          id: 'url',
          title: 'Tap for reverse search by URL',
          description: query,
          message_text: MESSAGE.loading,
          reply_markup: loadingKb,
          parse_mode: 'Markdown'
        });

    } else if (query.length > 40 && query.match(/^[A-Za-z0-9_\-]+$/)) { //file id
      answers.addArticle({
        id: 'share',
        title: 'Tap to share',
        description: "your sauce",
        message_text: MESSAGE.loading,
        reply_markup: loadingKb,
        parse_mode: 'Markdown'
      });
    } else { //invalid
      answers = bot.answerList(msg.id, { cacheTime: 1000,
        switch_pm_text: "Invalid URL", switch_pm_parameter: "noop" });
    }

    // Send answers
    return bot.answerQuery(answers);

  });

  bot.on('inlineChoice', msg => {
    getSauceInit(msg);
  });

  var getSauceInit = msg => {
    if(msg.inline_message_id){
      if (tools.urlDetector(msg.query))
        msg.url = msg.query;
      else
        msg.fileId = msg.query;
      getSauce(msg, msg);
    } else {
      if(msg.photo)
        msg.fileId = msg.photo[msg.photo.length-1].file_id;
      bot.sendMessage(msg.chat.id, MESSAGE.loading, {reply: msg.message_id, parse: "Markdown"})
      .then(res => {
        getSauce(msg, res.result);
      });
    }
  };

  var getSauce = (msg, editMsg) => {
    editMsg.fileId = msg.fileId;
    editMsg.url = msg.url;
    if(msg.url){
      request(msg.url, bot, editMsg);
    } else {
      bot.getFile(msg.fileId)
        .then(file => {
          if (global.debug) console.log("file is", file);

          reportToOwner.reportFileUrl(file.file_id, bot);
          var url = "https://api.telegram.org/file/bot" + tokenBot + "/" + file.file_path;
          request(url, bot, editMsg);
        })
        .catch( err => {
          bot.editText(tools.getId(editMsg), MESSAGE.invalidFileId, {parse: "Markdown"});
        });
    }
  };

  bot.connect();
  console.log("bot: connected");

};
