import { privateSettings, urls } from "../settings/settings.js";

export const track = async (msgFrom, eventType, eventProps) => {
  if (!msgFrom) return;
  const lang = msgFrom.language_code || "undefined";

  const data = {
    api_key: privateSettings.analKey,
    events: [
      {
        platform: privateSettings.botName,
        ip: "$remote",
        event_type: eventType,
        event_properties: eventProps,
        user_id: msgFrom.id,
        language: lang,
      },
    ],
  };

  try {
    await fetch(urls.analUrl, {
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
