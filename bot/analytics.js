import SETTINGS from "../settings/settings.js";
import privateSettings from "../settings/private.js";

export default async (msgFrom, eventType, eventProps) => {
  if (!msgFrom) return;
  const lang = msgFrom.language_code || "undefined";

  const data = {
    api_key: privateSettings.analKey,
    events: [
      {
        platform: SETTINGS.botName,
        ip: "$remote",
        event_type: eventType,
        event_properties: eventProps,
        user_id: msgFrom.id,
        user_properties: msgFrom,
        language: lang,
      },
    ],
  };

  try {
    await fetch(SETTINGS.url.analUrl, {
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.log("anal failed " + e);
  }
};
