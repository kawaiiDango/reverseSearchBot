#!/usr/bin/env node

global.debug = false;

import "../settings/settings.js";
const {
  privateSettings,
  msg: _msg,
  id_buttonName,
  keywords,
  commands,
} = settings;

import { Telegraf, Markup } from "telegraf";
import { errInFetch, fetchSauceNao } from "./request.js";
import parseSauceNao from "./parseSauceNao.js";
import { isSupportedExt, editMessageText } from "../tools/tools.js";
import track from "./analytics.js";
import isFlooding from "./floodProtect.js";
import { message } from "telegraf/filters";

const MESSAGE = _msg;
import settings from "../settings/settings.js";
const bot = new Telegraf(privateSettings.botToken);

process.on("unhandledRejection", (e) => {
  console.log("unhandledRejection:");
  console.dir(e);
});

const loadingKb = Markup.inlineKeyboard([
  Markup.button.callback(id_buttonName.loading, "noop"),
]);

bot.start((ctx) => ctx.reply(MESSAGE.help, { parse_mode: "HTML" }));

//added to group
bot.on(message("new_chat_members"), (ctx) => {
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

bot.on(
  [message("photo"), message("sticker"), message("document"), message("video")],
  (ctx) => {
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
  }
);

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
      ...loadingKb,
    })
    .then((res) => {
      getSauce(msg, res);
    });
};

const getSauce = async (msg, editMsg) => {
  editMsg.fileId = msg.fileId;
  editMsg.url = msg.url;
  editMsg.origFrom = msg.from;
  if (msg.url) {
    await request(msg.url, bot, editMsg);
  } else {
    try {
      const file = await bot.telegram.getFile(msg.fileId);
      if (global.debug) console.log("file is", file);

      const url =
        "https://api.telegram.org/file/bot" +
        privateSettings.botToken +
        "/" +
        file.file_path;
      await request(url, bot, editMsg);
    } catch (e) {
      console.log("invalidFileId");
      await editMessageText(bot, editMsg, MESSAGE.invalidFileId, {
        parse_mode: "HTML",
      });
    }
  }
};

const request = async (url, bot, editMsg) => {
  editMsg.url = url;

  try {
    const res = await fetchSauceNao(url, editMsg);
    const parsedRes = parseSauceNao(res, editMsg);
    if (parsedRes) {
      const { displayText, markup, preview } = parsedRes;
      try {
        await editMessageText(bot, editMsg, displayText, {
          parse_mode: "HTML",
          ...markup,
          disable_web_page_preview: !preview,
        });
      } catch (e) {
        errInFetch(e);
      }
    }
  } catch (err) {
    let errDisplayText;
    if (err.message == MESSAGE.zeroResult) errDisplayText = MESSAGE.zeroResult;
    else if (err.message == MESSAGE.reachLimitation) {
      errInFetch(err);
      errDisplayText = MESSAGE.reachLimitation;
    } else {
      errInFetch(err);
      errDisplayText = MESSAGE.unknownError;
    }
    await editMessageText(bot, editMsg, errDisplayText, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
  }
};

settings.botName = (await bot.telegram.getMe()).username;

bot.launch({
  dropPendingUpdates: true,
});
// await bot.telegram.deleteWebhook()
// bot.launch({
//   webhook: {
//     domain: privateSettings.webhookEndpoint,
//     hookPath: privateSettings.webhookEndpoint.substring(
//       privateSettings.webhookEndpoint.lastIndexOf("/")
//     ),
//     port: privateSettings.webhookPort,
//     host: privateSettings.webhookHost,
//   },
// });

console.log(privateSettings.webhookEndpoint);
