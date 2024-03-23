import fetch from "node-fetch";
import SETTINGS from "../settings/settings.js";

let ctr = 887;

export default async (msgFrom, eventType, eventProps) => {
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

  try {
    await fetch(SETTINGS.url.analUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: "event=[" + JSON.stringify(tdata) + "]",
    });
  } catch (e) {
    console.log("anal failed " + e);
  }
};
