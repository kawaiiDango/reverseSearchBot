import settings from "../settings/settings.js";
import { LRUCache } from "lru-cache";
import { Mutex } from "async-mutex";
const { reportToOwnerSwitch, reportingInterval, privateSettings } = settings;
const receiver_id = privateSettings.adminId;
const errDataLRU = new LRUCache({ max: 15 });
const mutex = new Mutex();

export async function reportError(errorObj, bot) {
  if (!reportToOwnerSwitch.reportError.on) return;
  errorObj = errorObj || {};

  const mapKey = JSON.stringify({
    name: errorObj.name,
    fileName: errorObj.fileName,
    lineNumber: errorObj.lineNumber,
    responseCode: errorObj.response?.status,
  });

  let errData;
  await mutex.runExclusive(async () => {
    errData = errDataLRU.get(mapKey);
    if (errData !== undefined) {
      errData.count++;
    } else {
      errData = {
        count: 1,
        lastSendTime: -1,
      };
      errDataLRU.set(mapKey, errData);
    }
  });

  const now = Date.now();
  if (now - errData.lastSendTime > reportingInterval) {
    let text = `⚠ *${errorObj.name}* x${errData.count}\n`;

    const response = errorObj.response;
    if (response) {
      if (response.status) text += `*Response.status:* ${response.status}`;
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
