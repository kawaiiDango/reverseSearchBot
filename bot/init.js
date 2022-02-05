"use strict";

global.debug = false;
global.userCount = {
  on: true,
};

import "../settings/settings.js";
const {
  privateSettings,
  msg: _msg,
  id_buttonName,
  keywords,
  commands,
} = settings;

import { Telegraf, Markup } from "telegraf";
import { setBot, errInFetch, fetchSauceNao, parseSauceNao } from "./request.js";
import {
  urlDetector,
  isSupportedExt,
  editMessageText,
  getOtherSearches,
} from "../tools/tools.js";
import { track, init } from "./analytics.js";
import isFlooding from "./floodProtect.js";

const MESSAGE = _msg;
import { reportFile } from "./reportToOwner.js";
import settings from "../settings/settings.js";
const bot = new Telegraf(privateSettings.botToken);

setBot(bot);
export default () => {
  const loadingKb = Markup.inlineKeyboard([
    [Markup.button.callback(id_buttonName.loading, "noop")],
  ]);

  bot.start((ctx) => ctx.reply(MESSAGE.help, { parse_mode: "HTML" }));

  //added to group
  bot.on("new_chat_members", (ctx) => {
    const token = privateSettings.botToken;
    const myId = token.substring(0, token.indexOf(":"));
    if (ctx.message.new_chat_participant.id == myId)
      ctx.reply(MESSAGE.help, { parse_mode: "HTML" });
  });
  const keywordResponse = (ctx) => {
    if (isFlooding(ctx)) return;
    const rmsg = ctx.message.reply_to_message;

    if (rmsg && (rmsg.photo || rmsg.document || rmsg.sticker || rmsg.video)) {
      if (
        (rmsg.forward_from && rmsg.forward_from.id == 792028928) ||
        rmsg.from.id == 792028928
      ) {
        ctx.reply("LOL no cheating");
        return;
      }
      getSauceFromFile(rmsg);
      track(ctx.from, "sauce_keyword", { text: ctx.message.text });
    } else if (ctx.message.text.indexOf("/") == 0) {
      ctx.reply(MESSAGE.keywordHelp, {
        parse_mode: "HTML",
        reply_to_message_id: ctx.message.message_id,
      });
      track(ctx.from, "sauce_click_only");
    }
  };

  bot.hears(keywords, keywordResponse);
  bot.command(commands, keywordResponse);

  bot.on(["photo", "sticker", "document", "video"], (ctx) => {
    if (ctx.message.forward_from && ctx.message.forward_from.id == 792028928) {
      ctx.reply("LOL no cheating");
      return;
    }

    if (
      (ctx.message.chat.type == "private" && !isFlooding(ctx)) ||
      (privateSettings.favouriteGroups.indexOf(ctx.message.chat.id) > -1 &&
        ctx.message.photo)
    )
      getSauceFromFile(ctx.message);
  });

  bot.on("inline_query", ({ inlineQuery, answerInlineQuery }) => {
    const query = inlineQuery.query;
    const answers = [];

    if (urlDetector(query) && isSupportedExt(query)) {
      //url
      answers.push({
        type: "article",
        id: "url",
        title: "Tap for reverse search by URL",
        description: query,
        message_text: MESSAGE.loading,
        reply_markup: loadingKb,
        parse_mode: "HTML",
      });
    } else if (
      query.length > 25 &&
      query.indexOf("|") == 2 &&
      query.substr(3).match(/^[A-Za-z0-9_\-]+$/)
    ) {
      //file id
      answers.push({
        type: "article",
        id: "share",
        title: "Tap to share",
        description: "your sauce",
        message_text: MESSAGE.loading,
        reply_markup: loadingKb,
        parse_mode: "HTML",
      });
    }

    return answerInlineQuery(answers, {
      cache_time: 1000,
      switch_pm_text: "Search by an image instead",
      switch_pm_parameter: "noop",
    });
  });

  // format for inline share: sn|fileID or te|fileID
  bot.on("chosen_inline_result", ({ chosenInlineResult }) => {
    if (urlDetector(chosenInlineResult.query)) {
      chosenInlineResult.url = chosenInlineResult.query;
      track(chosenInlineResult.from, "query", { type: "url_inline" });
    } else {
      chosenInlineResult.fileId = chosenInlineResult.query.substr(3);
      chosenInlineResult.site = chosenInlineResult.query.substring(0, 2);
      track(chosenInlineResult.from, "share");
    }
    getSauce(chosenInlineResult, chosenInlineResult);
  });

  // format for callback query: sn|fromUserId

  bot.on("callback_query", ({ callbackQuery }) => {
    if (callbackQuery.data && callbackQuery.message) {
      const splits = callbackQuery.data.split("|");
      // if(splits[1] != msg.from.id)
      //   bot.answerCallbackQuery(msg.id, {text: "Only the sender can click that."});

      if (splits[0] == "sn") {
        callbackQuery.origFrom = callbackQuery.from;
        const rm = callbackQuery.message.reply_to_message;
        if (!rm) return;
        if (rm.photo && rm.photo.length > 0)
          callbackQuery.fileId = rm.photo[rm.photo.length - 1].file_id;
        else if (rm.sticker) callbackQuery.fileId = rm.sticker.file_id;
        else if (rm.document && isSupportedExt(rm.document.file_name))
          callbackQuery.fileId = rm.document.file_id;
        else if (rm.document.mime_type == "video/mp4")
          callbackQuery.fileId = rm.document.thumb.file_id;

        callbackQuery.site = splits[0];
        getSauce(callbackQuery, callbackQuery);
        track(callbackQuery.from, "saucenao_callback");
      }
    }
  });

  const getSauceFromFile = (msg) => {
    if (msg.photo && msg.photo.length > 0) {
      msg.fileId = msg.photo[msg.photo.length - 1].file_id;
      track(msg.from, "query", { type: "photo" });
    } else if (msg.sticker) {
      if (msg.sticker.is_animated) msg.fileId = msg.sticker.thumb.file_id;
      else msg.fileId = msg.sticker.file_id;
      track(msg.from, "query", { type: "sticker" });
    } else if (msg.document) {
      if (isSupportedExt(msg.document.file_name)) {
        msg.fileId = msg.document.file_id;
        track(msg.from, "query", { type: "file" });
      } else if (msg.document.mime_type == "video/mp4") {
        if (msg.document.thumb) {
          msg.fileId = msg.document.thumb.file_id;
          track(msg.from, "query", { type: "video" });
        } else return;
      }
    } else if (msg.video && msg.video.thumb) {
      msg.fileId = msg.video.thumb.file_id;
      track(msg.from, "query", { type: "video" });
    } else return;
    bot.telegram
      .sendMessage(msg.chat.id, MESSAGE.loading, {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id,
        reply_markup: loadingKb,
      })
      .then((res) => {
        getSauce(msg, res);
      });
  };

  const getSauce = (msg, editMsg) => {
    editMsg.fileId = msg.fileId;
    editMsg.url = msg.url;
    editMsg.origFrom = msg.from;
    if (msg.url) {
      request(msg.url, bot, editMsg);
    } else {
      bot.telegram
        .getFile(msg.fileId)
        .then((file) => {
          if (global.debug) console.log("file is", file);
          if (msg.document)
            //handles gifs
            reportFile(msg.document.file_id, bot);
          else reportFile(file.file_id, bot);
          const url =
            "https://api.telegram.org/file/bot" +
            privateSettings.botToken +
            "/" +
            file.file_path;
          request(url, bot, editMsg);
        })
        .catch((err) => {
          console.dir(err);
          editMessageText(bot, editMsg, MESSAGE.invalidFileId, {
            parse_mode: "HTML",
          }).catch(errInFetch);
        });
    }
  };

  const request = (url, bot, editMsg) => {
    editMsg.url = url;
    fetchSauceNao(url, editMsg) //SN first
      .catch(errInFetch)
      .then((res) => {
        if (res instanceof Error) return Promise.reject(res);
        return parseSauceNao(res, bot, editMsg);
      })
      // .catch(err => {
      // editMsg.searched = 'sn';
      // return reqs.fetchTineye(url, editMsg)
      // .then(res => reqs.parseTineye(res, editMsg))
      // })
      .catch((err) => {
        console.log("err:" + err);
        let directLink;
        if (
          privateSettings.trustedUserIds.includes(editMsg.origFrom.id) &&
          editMsg.chat &&
          editMsg.chat.type == "private"
        ) {
          directLink = err.directLink;
          if (
            !directLink &&
            privateSettings.adminId.includes(editMsg.origFrom.id)
          )
            directLink = editMsg.url;
        }
        if (err.message == MESSAGE.zeroResult)
          return [getOtherSearches(MESSAGE.zeroResult, directLink)];
        else if (err.message == MESSAGE.reachLimitation)
          return [getOtherSearches(MESSAGE.reachLimitation, directLink)];
        else return [err.message];
      })
      .then((msg) => {
        if (msg && msg[0]) {
          msg[2] = msg[2] || true;
          editMessageText(bot, editMsg, msg[0] + getRateText(editMsg, msg[1]), {
            parse_mode: "HTML",
            reply_markup: msg[1],
            disable_web_page_preview: msg[2],
          }).catch(errInFetch);
        }
      })
      .catch(errInFetch);
  };

  const getRateText = (editMsg, markupPresent) => {
    let rateText = "";

    // count user request and if it satisfies condition, print msg asking rating
    if (
      markupPresent &&
      global.userCount.on &&
      editMsg.chat &&
      editMsg.chat.type == "private"
    ) {
      const from_id = editMsg.from.id;
      let count = global.userCount[from_id.toString()];
      if (count === undefined) global.userCount[from_id.toString()] = 0;
      global.userCount[from_id.toString()] += 1;

      count = global.userCount[from_id.toString()];

      if (count / 2 - Math.floor(count / 2) === 0) {
        //rateText = "\n\n" + MESSAGE.requestRating; //TODO: enable when storebot.me is up
      }
    }
    return rateText;
  };

  init(bot); //uc

  //bot.launch();
  bot.telegram.deleteWebhook().then((res) => {
    bot.launch({
      webhook: {
        domain: privateSettings.webhookEndpoint,
        hookPath: privateSettings.webhookEndpoint.substring(
          privateSettings.webhookEndpoint.lastIndexOf("/")
        ),
        port: privateSettings.webhookPort,
        host: privateSettings.webhookHost,
      },
    });
  });

  console.log(privateSettings.webhookEndpoint);
};
