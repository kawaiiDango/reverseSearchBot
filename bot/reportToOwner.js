"use strict";

import privateSettings from "../settings/private.js";

const receiver_id = privateSettings.adminId;
import settings from "../settings/settings.js";
const reportToOwnerSwitch = settings.reportToOwnerSwitch;

export function reportLimitsOfSaucenao(header, bot) {
  if (!reportToOwnerSwitch.reportLimitsOfSaucenao.on) {
    return;
  }
  const longLimit = header.long_limit.toString();
  const shortLimit = header.short_limit.toString();
  const longRemaining = header.long_remaining.toString();
  const shortRemaining = header.short_remaining.toString();
  if (longLimit > 10 || shortLimit > 10) return;
  const text =
    "⏰ <b>Saucenao Req Limit: (Remain/Limit)</b>\n" +
    "<b>Short(30s):</b> " +
    shortRemaining +
    "/" +
    shortLimit +
    "\n" +
    "<b>Long(24h):</b> " +
    longRemaining +
    "/" +
    longLimit;
  bot.telegram.sendMessage(receiver_id[0], text, {
    parse_mode: "html",
    disable_notification: !reportToOwnerSwitch.reportLimitsOfSaucenao.notify,
  });
}
export function reportLimitReached(whichApi, bot) {
  if (!reportToOwnerSwitch.reportLimitsOfSaucenao.on) return;
  const text = whichApi + " rate limit reached.";
  for (let i = 0; i < receiver_id.length; i++)
    bot.telegram.sendMessage(receiver_id[i], text);
}
export function reportError(errorObj, bot) {
  if (!reportToOwnerSwitch.reportError.on) return;
  errorObj = errorObj || {};
  const response = errorObj.response || {};
  console.dir(response);
  const params = {}; //errorObj.config.params;
  let text =
    "⚠ *Error:*\n" +
    "*Params:* " +
    (JSON.stringify(params) || "") +
    "\n" +
    "*Response.status:* " +
    response.status +
    "|" +
    response.statustext +
    "\n" +
    "*Response.data:* " +
    (JSON.stringify(response.data) || "");

  if (!response.status && !response.data)
    text += "*Other:* " + JSON.stringify(errorObj);
  for (let i = 0; i < receiver_id.length; i++) {
    bot.telegram.sendMessage(receiver_id[i], text, {
      parse_mode: "markdown",
      disable_notification: !reportToOwnerSwitch.reportError.notify,
    });
  }
}
export function sauceNaoResult(report, bot) {
  for (let i = 0; i < receiver_id.length; i++)
    bot.telegram.sendMessage(receiver_id[i], "sauceNaoResult " + report, {
      parse_mode: "HTML",
    });
}
export function reportFile(file, bot, force) {
  if (!reportToOwnerSwitch.reportFile.on && !force) {
    return;
  }
  if (global.debug) console.log("Reporting file");
  for (let i = 0; i < receiver_id.length; i++) {
    bot.telegram
      .sendPhoto(receiver_id[i], file, {
        caption: null,
        disable_notification: !reportToOwnerSwitch.reportFile.notify,
      })
      .catch((err) => {
        if (err.error_code && err.error_code == 400) {
          bot.telegram.sendSticker(receiver_id[i], file).catch((err) => {
            if (err.error_code && err.error_code == 400)
              bot.telegram
                .sendDocument(receiver_id[i], file)
                .catch((err) => console.dir(err));
          });
        }
      });
  }
}
