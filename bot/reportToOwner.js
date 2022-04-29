import settings from "../settings/settings.js";
import LRU from "lru-cache"
const { reportToOwnerSwitch, reportingInterval, privateSettings } = settings;
const receiver_id = privateSettings.adminId;
const errDataLRU = new LRU({ max: 15 });

export async function reportLimitReached(whichApi, bot) {
  if (!reportToOwnerSwitch.reportLimitsOfSaucenao.on) return;
  const text = whichApi + " rate limit reached.";
  for (let i = 0; i < receiver_id.length; i++)
    await bot.telegram.sendMessage(receiver_id[i], text);
}

export async function reportError(errorObj, bot) {
  if (!reportToOwnerSwitch.reportError.on) return;
  errorObj = errorObj || {};

  const mapKey = JSON.stringify({
    "name": errorObj.name,
    "fileName": errorObj.fileName,
    "lineNumber": errorObj.lineNumber,
    "responseCode": errorObj.response?.status,
  });

  let errData = errDataLRU.get(mapKey);
  if (errData !== undefined) {
    errData.count++;
  } else {
    errData = {
      count: 1,
      lastSendTime: -1,
    };
    errDataLRU.set(mapKey, errData);
  }

  const now = Date.now();
  if (now - errData.lastSendTime > reportingInterval) {
    let text =
      `⚠ *${errorObj.name}* x${errData.count}\n`

    const response = errorObj.response;
    if (response) {
      if (response.status)
        text += `*Response.status:* ${response.status}`;
    } else {
      text += `*Other:* ${JSON.stringify(errorObj)}`;
    }
    for (let i = 0; i < receiver_id.length; i++) {
      await bot.telegram.sendMessage(receiver_id[i], text, {
        parse_mode: "markdown",
        disable_notification: !reportToOwnerSwitch.reportError.notify,
      });
    }

    errData.lastSendTime = now;
    errData.count = 0;
  }
}

export function reportFile(file, caption, bot) {
  if (!reportToOwnerSwitch.reportFile.on) {
    return;
  }
  if (global.debug) console.log("Reporting file");

  const extras = {
    caption: caption,
    disable_notification: !reportToOwnerSwitch.reportFile.notify,
  }

  for (let i = 0; i < receiver_id.length; i++) {
    bot.telegram
      .sendPhoto(receiver_id[i], file, extras)
      .catch((err) => {
        if (err.error_code && err.error_code == 400) {
          bot.telegram.sendSticker(receiver_id[i], file, extras).catch((err) => {
            if (err.error_code && err.error_code == 400)
              bot.telegram
                .sendDocument(receiver_id[i], file, extras)
                .catch((err) => console.log(err.message));
          });
        }
      });
  }
}
