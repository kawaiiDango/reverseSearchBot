"use strict";

import fetch from "node-fetch";
import SETTINGS from "../settings/settings.js";

let ctr = 887;
let bot;

const init = (botp) => {
  bot = botp;
  bot.telegram.getMe().then((botInfo) => {
    SETTINGS.botName = botInfo.username;
  });
};

const track = (msgFrom, eventType, eventProps) => {
  if (!msgFrom) return;
  const uniq = SETTINGS.botName + new Date().getTime() + "" + ctr++;
  const lang = msgFrom.language_code || "undefined";

  //user_properties
  const tdata = {
    platform: SETTINGS.botName,
    ip: "$remote",
    event_type: eventType,
    event_properties: eventProps,
    user_id: msgFrom.id,
    user_properties: msgFrom,
    insert_id: uniq,
    language: lang,
  };
  fetch(SETTINGS.url.analUrl, {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
    body: "event=[" + JSON.stringify(tdata) + "]",
  }).catch((err) => {
    console.log("anal failed");
  });
};

export { init, track };
