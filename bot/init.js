global.debug = false;
global.userCount = {
  on: true
};

var SETTINGS = require("../settings/settings.js");
var tokenBot = SETTINGS.private.botToken;

var tokenSN = SETTINGS.private.SNKey;
var KEYWORDS = SETTINGS.keywords;
var TeleBot = require("telebot");
var reqs = require("./request.js");
var tools = require("../tools/tools.js");
const fetch = require('node-fetch');
const analytics = require('./analytics.js');

var MESSAGE = SETTINGS.msg;
/* moduleSwitch's property indicates whether to turn on/off the module */
var moduleSwitch = SETTINGS.moduleSwitch;
var reportOpt = SETTINGS.reporter;
/* overwrite reportOpt.receiver_id with your telegram user id(numtype) in array form*/
var flooderOpt = SETTINGS.flooder;
var reportToOwner = require("./reportToOwner.js");

var bot = new TeleBot({
  token: tokenBot,
  usePlugins: ['reporter'],
  pluginConfig: {
    flooder: flooderOpt,
    reporter: reportOpt,
  }
});

module.exports = () => {
  /* Switch on/off the modules according to preset in moduleSwitch above */
  /* On/off settings of modules are at settings/settings.js */
  var modules = Object.keys(moduleSwitch);
  
  for (var i = 0; i < modules.length; i ++) {
    if (moduleSwitch[modules[i]]) {
      bot.plug(require("../plugins/" + modules[i] + ".js"));
    }
  }

  bot.on(["/help", "/start"], msg => {
    var chat_id = msg.chat.id;
    var reply = msg.message_id;
    if (global.debug) console.log("msg is ", msg);

    bot.sendMessage(chat_id, MESSAGE.help, {reply: reply, parse: "HTML"});
  });

  bot.on(["*"], msg => {
    var chat_id = msg.chat.id;
    var reply = msg.message_id;
    if (global.debug) console.log("msg is ", msg);

    if (msg.text === "/help" || msg.text === "/start") {
      return;
    } else if (msg.text) {
      if (KEYWORDS.indexOf(msg.text.toLowerCase().split(/[@ ]/)[0]) > -1){
        var rmsg = msg.reply_to_message;
        if (rmsg && (rmsg.photo || rmsg.document || rmsg.sticker)){
          getSauceInit(rmsg);
          analytics.track(msg.from, "sauce_keyword", {text:msg.text});
        }
        else if(msg.text.indexOf('/')==0){
          bot.sendMessage(chat_id, MESSAGE.keywordHelp, {reply: reply, parse: "HTML"});
          analytics.track(msg.from, "sauce_click_only");
        }
      }
      else if (msg.chat.type == "private"){
        if (tools.urlDetector(msg.text)) {
          msg.url = msg.text;
          getSauceInit(msg);
        } else if(!msg.entities){
          //bot.sendMessage(chat_id, MESSAGE.invalidUrl, {reply: reply, parse: "HTML"});
        }
      }
    } else if (msg.chat.type == "private" && (msg.photo || msg.document || msg.sticker)){
        getSauceInit(msg);
    } else if (SETTINGS.private.favouriteGroups.indexOf(chat_id)>-1  && (msg.photo)) {
        getSauceInit(msg);
      ///bot.sendMessage(chat_id, MESSAGE.invalidForm, {reply: reply, parse: "HTML"});
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
      pmText: "Search by an image instead", pmParameter: "noop"});

    if (tools.urlDetector(query)) { //url
        answers.addArticle({
          id: 'url',
          title: 'Tap for reverse search by URL',
          description: query,
          message_text: MESSAGE.loading,
          reply_markup: loadingKb,
          parse_mode: 'HTML'
        });

    } else if (query.length > 25 && query.indexOf('|') == 2 &&
       query.substr(3).match(/^[A-Za-z0-9_\-]+$/)) { //file id
      answers.addArticle({
        id: 'share',
        title: 'Tap to share',
        description: "your sauce",
        message_text: MESSAGE.loading,
        reply_markup: loadingKb,
        parse_mode: 'HTML'
      });
    } else { //invalid
      // answers = bot.answerList(msg.id, { cacheTime: 1000,
      //   pmText: "Invalid URL", pmParameter: "noop" });
    }

    // Send answers
    return bot.answerQuery(answers);

  });
  
// format for inline share: sn|fileID or te|fileID
  bot.on('chosenInlineResult', msg => {
    getSauceInit(msg);
  });

// format for callback query: sn|fromUserId
  bot.on('callbackQuery', msg => { 
    if (msg.data && msg.message){
      var splits = msg.data.split("|");
      // if(splits[1] != msg.from.id)
      //   bot.answerCallbackQuery(msg.id, {text: "Only the sender can click that."});

      if(splits[0] == "sn"){
        msg.origFrom = msg.from;
        var rm = msg.message.reply_to_message;
        if(rm.photo && rm.photo.length >0)
          msg.fileId = rm.photo[rm.photo.length-1].file_id;
        else if (rm.sticker)
          msg.fileId = rm.sticker.file_id;
        else if (rm.document && tools.isSupportedExt(rm.document.file_name))
          msg.fileId = rm.document.file_id;
        
        msg.site = splits[0];
        getSauce(msg, msg);
        analytics.track(msg.from, "saucenao_callback");
      }
    }
  });

  var getSauceInit = msg => {
    if(msg.inline_message_id){
      if (tools.urlDetector(msg.query)){
        msg.url = msg.query;
        analytics.track(msg.from, "query", {type: "url_inline"});
      }
      else{
        msg.fileId = msg.query.substr(3);
        msg.site = msg.query.substring(0,2);
        analytics.track(msg.from, "share");
      }
      getSauce(msg, msg);
    } else {
      if(msg.photo && msg.photo.length >0){
        msg.fileId = msg.photo[msg.photo.length-1].file_id;
        analytics.track(msg.from, "query", {type: "photo"});
      }
      else if (msg.sticker){
	      msg.fileId = msg.sticker.file_id;
        analytics.track(msg.from, "query", {type: "sticker"});
      }
      else if (msg.document && tools.isSupportedExt(msg.document.file_name)){
        msg.fileId = msg.document.file_id;
        analytics.track(msg.from, "query", {type: "file"});
      }
      else
	      return;

      var loadingKb = bot.inlineKeyboard([[
        bot.inlineButton(SETTINGS.id_buttonName.loading, {
          callback: "noop"
        })
      ]]);
      bot.sendMessage(msg.chat.id, MESSAGE.loading, {reply: msg.message_id, markup: loadingKb, parse: "HTML"})
      .then(res => {
        getSauce(msg, res.result);
      });
    }
  };

  var getSauce = (msg, editMsg) => {
    editMsg.fileId = msg.fileId;
    editMsg.url = msg.url;
    editMsg.origFrom = msg.from;
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
          console.dir(err);
          bot.editText(tools.getId(editMsg), MESSAGE.invalidFileId, {parse: "HTML"});
        });
    }
  };

  var request = (url, bot, editMsg) => {
    editMsg.url = url;
    if (editMsg.site == "sn")
      reqs.fetchSauceNao(url, editMsg)
        .catch(reqs.errInFetch)
        .then((res) => reqs.cleanSauceNao(res, bot, editMsg))
        .then(msg => {
        if (msg && msg[0]){
          if(!msg[1]){ // sauce not found
            if (editMsg.message){ // callback query
              var ent = editMsg.message.entities;
              bot.editMessageReplyMarkup(tools.getId(editMsg.message), 
                {markup: bot.inlineKeyboard([
                  reqs.getTineyeButtons(bot, ent[0].url, ent[1].url, editMsg.fileId)
                  ])}
                );
              bot.answerCallbackQuery(editMsg.id, 
                {text: "SauceNao returned no results.", showAlert: true})
              return;
            } else { // inline share
              bot.editText(tools.getId(editMsg), MESSAGE.zeroResult
                , {parse: "HTML", webPreview: false});
            }
          }
          msg[2] = msg[2] || false;
          bot.editText(tools.getId(editMsg.message || editMsg), msg[0] + getRateText(editMsg, msg[1])
            , {parse: "HTML", markup: msg[1], webPreview: msg[2]});
        }
      })
      .catch(reqs.errInFetch);
    else 
      reqs.fetchTineye(url, editMsg)
        .catch(reqs.errInFetch)
        .then(res => reqs.parseTineye(res, bot, editMsg))
        .catch((err) => {
          return reqs.fetchSauceNao(url, editMsg)
            .then((res) => reqs.cleanSauceNao(res, bot, editMsg))
        })
        .catch(reqs.errInFetch)
        .then(msg => {
          if (msg && msg[0]){
            msg[2] = msg[2] || false;
            bot.editText(tools.getId(editMsg), msg[0] + getRateText(editMsg, msg[1])
              , {parse: "HTML", markup: msg[1], webPreview: msg[2]});
          }
        })
      .catch(reqs.errInFetch)
  };

  var getRateText = (editMsg, markupPresent) => {                        
    var rateText = '';

      // count user request and if it satisfies condition, print msg asking rating
    if (markupPresent && global.userCount.on && editMsg.chat && editMsg.chat.type == "private") {
      var from_id = editMsg.from.id;
      var count = global.userCount[from_id.toString()];
      if (count === undefined) global.userCount[from_id.toString()] = 0;
      global.userCount[from_id.toString()] += 1;

      count = global.userCount[from_id.toString()];

      if ((count / 2) - Math.floor(count / 2) === 0) {
        rateText = "\n\n" + MESSAGE.requestRating;
      }
    }
    return rateText;
  };

  bot.connect();
  console.log("bot: connected");
  analytics.init(bot);
};
