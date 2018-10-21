"use strict";

global.debug = false;
global.userCount = {
  on: true
};

const SETTINGS = require("../settings/settings.js");
const tokenBot = SETTINGS.private.botToken;

const tokenSN = SETTINGS.private.SNKey;
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');
const express = require('express');
const reqs = require("./request.js");
const tools = require("../tools/tools.js");
const fetch = require('node-fetch');
const analytics = require('./analytics.js');
const isFlooding = require('./floodProtect.js');

const MESSAGE = SETTINGS.msg;
const reportOpt = SETTINGS.reporter;
const reportToOwner = require("./reportToOwner.js");

const bot = new Telegraf(tokenBot)

bot.telegram.setWebhook(SETTINGS.private.webhookEndpoint, undefined, 100);
const app = express()
app.get('/', (req, res) => res.send('Goodbye World'))
app.use(bot.webhookCallback(
    SETTINGS.private.webhookEndpoint.substring(SETTINGS.private.webhookEndpoint.lastIndexOf('/'))))
app.listen(SETTINGS.private.webhookPort, () => {
  console.log('sauce bot listening on port ' + SETTINGS.private.webhookPort)
})

reqs.setBot(bot);
module.exports = () => {
  const loadingKb = Markup.inlineKeyboard([[
    Markup.callbackButton(SETTINGS.id_buttonName.loading, 'noop')
  ]]);

  bot.start(ctx => ctx.reply(MESSAGE.help, {parse_mode: 'HTML'}));

//added to group
  bot.on('new_chat_members', ctx => {
    const token = SETTINGS.private.botToken;
    const myId = token.substring(0,token.indexOf(':'));
    console.dir(ctx.message.new_chat_participant);
    if (ctx.message.new_chat_participant.id == myId)
      ctx.reply(MESSAGE.help, {parse_mode: 'HTML'})
  });
  const keywordResponse = ctx => {
    const rmsg = ctx.message.reply_to_message;
      if (rmsg && (rmsg.photo || rmsg.document || rmsg.sticker || rmsg.video) &&
        !isFlooding(ctx)){
        getSauceFromFile(rmsg);
        analytics.track(ctx.from, "sauce_keyword", {text:ctx.message.text});
      }
      else if(ctx.message.text.indexOf('/')==0){
        ctx.reply(MESSAGE.keywordHelp, {parse_mode: 'HTML', reply_to_message_id: ctx.message.message_id});
        analytics.track(ctx.from, "sauce_click_only");
      }
  };

  bot.hears(SETTINGS.keywords, keywordResponse);
  bot.command(SETTINGS.commands, keywordResponse);

  bot.on(['photo', 'sticker', 'document', 'video'], ctx => {
    if (ctx.message.chat.type == "private" && !isFlooding(ctx)
    || (SETTINGS.private.favouriteGroups.indexOf(ctx.message.chat.id)>-1  && (ctx.message.photo)))
        getSauceFromFile(ctx.message);
  });

  bot.on('inline_query', ({ inlineQuery, answerInlineQuery }) => {

    const query = inlineQuery.query;
    const answers = [];

    if (tools.urlDetector(query)) { //url
        answers.push({
          type: 'article',
          id: 'url',
          title: 'Tap for reverse search by URL',
          description: query,
          message_text: MESSAGE.loading,
          reply_markup: loadingKb,
          parse_mode: 'HTML'
        });

    } else if (query.length > 25 && query.indexOf('|') == 2 &&
       query.substr(3).match(/^[A-Za-z0-9_\-]+$/)) { //file id
      answers.push({
        type: 'article',
        id: 'share',
        title: 'Tap to share',
        description: "your sauce",
        message_text: MESSAGE.loading,
        reply_markup: loadingKb,
        parse_mode: 'HTML'
      });
    }

    return answerInlineQuery(answers, { 
      cache_time: 1000,
      switch_pm_text: "Search by an image instead",
      switch_pm_parameter: "noop"
    });

  });
  
// format for inline share: sn|fileID or te|fileID
  bot.on('chosen_inline_result', ({chosenInlineResult}) => {
    console.dir(chosenInlineResult);
    
    if (tools.urlDetector(chosenInlineResult.query)){
        chosenInlineResult.url = chosenInlineResult.query;
        analytics.track(chosenInlineResult.from, "query", {type: "url_inline"});
      } else {
        chosenInlineResult.fileId = chosenInlineResult.query.substr(3);
        chosenInlineResult.site = chosenInlineResult.query.substring(0,2);
        analytics.track(chosenInlineResult.from, "share");
      }
      getSauce(chosenInlineResult, chosenInlineResult);
      
  });

// format for callback query: sn|fromUserId

  bot.on('callback_query', ({callbackQuery}) => { 
    if (callbackQuery.data && callbackQuery.message){
      const splits = callbackQuery.data.split("|");
      // if(splits[1] != msg.from.id)
      //   bot.answerCallbackQuery(msg.id, {text: "Only the sender can click that."});

      if(splits[0] == "sn"){
        callbackQuery.origFrom = callbackQuery.from;
        const rm = callbackQuery.message.reply_to_message;
        if (!rm)
          return;
        if(rm.photo && rm.photo.length >0)
          callbackQuery.fileId = rm.photo[rm.photo.length-1].file_id;
        else if (rm.sticker)
          callbackQuery.fileId = rm.sticker.file_id;
        else if (rm.document && tools.isSupportedExt(rm.document.file_name))
          callbackQuery.fileId = rm.document.file_id;
        else if (rm.document.mime_type == "video/mp4")
          callbackQuery.fileId = rm.document.thumb.file_id;
        
        callbackQuery.site = splits[0];
        getSauce(callbackQuery, callbackQuery);
        analytics.track(callbackQuery.from, "saucenao_callback");
      }
    }
  });

  const getSauceFromFile = msg => {
    if(msg.photo && msg.photo.length >0){
      msg.fileId = msg.photo[msg.photo.length-1].file_id;
      analytics.track(msg.from, "query", {type: "photo"});
    }
    else if (msg.sticker){
      msg.fileId = msg.sticker.file_id;
      analytics.track(msg.from, "query", {type: "sticker"});
    }
    else if (msg.document){
      if (tools.isSupportedExt(msg.document.file_name)){
        msg.fileId = msg.document.file_id;
        analytics.track(msg.from, "query", {type: "file"});
      } else if (msg.document.mime_type == "video/mp4") {
        if (msg.document.thumb){
          msg.fileId = msg.document.thumb.file_id;
          analytics.track(msg.from, "query", {type: "video"});
        } else
          return;        
      }
    } else if (msg.video){
      msg.fileId = msg.video.thumb.file_id;
      analytics.track(msg.from, "query", {type: "video"});
    } else
      return;
    bot.telegram.sendMessage(msg.chat.id, MESSAGE.loading, {parse_mode: "HTML", reply_to_message_id: msg.message_id, reply_markup: loadingKb})
    .then(res => {
      getSauce(msg, res);
    });
  };

  const getSauce = (msg, editMsg) => {
    editMsg.fileId = msg.fileId;
    editMsg.url = msg.url;
    editMsg.origFrom = msg.from;
    if(msg.url){
      request(msg.url, bot, editMsg);
    } else {
      bot.telegram.getFile(msg.fileId)
        .then(file => {
          if (global.debug) console.log("file is", file);
          if (msg.document) //handles gifs
            reportToOwner.reportFile(msg.document.file_id, bot);
          else
            reportToOwner.reportFile(file.file_id, bot);
          const url = "https://api.telegram.org/file/bot" + tokenBot + "/" + file.file_path;
          request(url, bot, editMsg);
        })
        .catch( err => {
          console.dir(err);
          tools.editMessageText(bot, editMsg, MESSAGE.invalidFileId, {parse_mode: "HTML"})
            .catch(reqs.errInFetch);
        });
    }
  };

  const request = (url, bot, editMsg) => {
    editMsg.url = url;
    if (editMsg.site == "sn")
      reqs.fetchSauceNao(url, editMsg)
        .catch(reqs.errInFetch)
        .then(res => reqs.parseSauceNao(res, editMsg))
        .catch(err => {
          if(err.message == MESSAGE.zeroResult)
            return [tools.getGoogleSearch(MESSAGE.zeroResult, editMsg.url)];
          else
            return reqs.errInFetch(err);
        })
        .then(msg => {
        if (msg && msg[0]){
          
          if(!msg[1]){ // sauce not found
            if (editMsg.message){ // callback query
              const ent = editMsg.message.entities;
              //will never be an inline msg
              bot.telegram.editMessageReplyMarkup(editMsg.message.chat.id, 
                editMsg.message.message_id, undefined,
                {reply_markup: Markup.inlineKeyboard([
                  reqs.getTineyeButtons(ent[0].url, ent[1].url, editMsg.fileId)
                  ])}
                );
              bot.telegram.answerCbQuery(editMsg.id, "SauceNao returned no results.", true)
              return;
            } else { // inline share
              tools.editMessageText(bot, editMsg, MESSAGE.zeroResult,
                {parse_mode: "HTML", disable_web_page_preview: true});
            }
          }
          msg[2] = msg[2] || true;
          tools.editMessageText(bot, editMsg.message || editMsg, msg[0] + getRateText(editMsg, msg[1])
            , {parse_mode: "HTML", reply_markup: msg[1], disable_web_page_preview: msg[2]})
            .catch(reqs.errInFetch);
        }
      })
      .catch(reqs.errInFetch);
    else
      reqs.fetchSauceNao(url, editMsg) //SN first
        .catch(reqs.errInFetch)
        .then(res => reqs.parseSauceNao(res, editMsg))
        .catch(err => {
          editMsg.searched = 'sn';
          return reqs.fetchTineye(url, editMsg)
            .then(res => reqs.parseTineye(res, editMsg))
        })
        .catch(err => {
          if(err.message == MESSAGE.zeroResult)
            return [tools.getGoogleSearch(MESSAGE.zeroResult, editMsg.url)];
          else
            return reqs.errInFetch(err);
        })
        .then(msg => {
          if (msg && msg[0]){
            msg[2] = msg[2] || true;
            tools.editMessageText(bot, editMsg, msg[0] + getRateText(editMsg, msg[1])
              , {parse_mode: "HTML", reply_markup: msg[1], disable_web_page_preview: msg[2]})
              .catch(reqs.errInFetch);
          }
        })
      .catch(reqs.errInFetch);
  };

  const getRateText = (editMsg, markupPresent) => {                   
    let rateText = '';

      // count user request and if it satisfies condition, print msg asking rating
    if (markupPresent && global.userCount.on && editMsg.chat && editMsg.chat.type == "private") {
      const from_id = editMsg.from.id;
      let count = global.userCount[from_id.toString()];
      if (count === undefined) global.userCount[from_id.toString()] = 0;
      global.userCount[from_id.toString()] += 1;

      count = global.userCount[from_id.toString()];

      if ((count / 2) - Math.floor(count / 2) === 0) {
        rateText = "\n\n" + MESSAGE.requestRating;
      }
    }
    return rateText;
  };

  analytics.init(bot); //uc

  // bot.startPolling()

};
