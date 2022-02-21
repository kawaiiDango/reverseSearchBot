import privateSettings from "../settings/private.js";

const receiver_id = privateSettings.adminId;
import settings from "../settings/settings.js";
const reportToOwnerSwitch = settings.reportToOwnerSwitch;

export async function reportLimitReached(whichApi, bot) {
  if (!reportToOwnerSwitch.reportLimitsOfSaucenao.on) return;
  const text = whichApi + " rate limit reached.";
  for (let i = 0; i < receiver_id.length; i++)
    await bot.telegram.sendMessage(receiver_id[i], text);
}
export async function reportError(errorObj, bot) {
  if (!reportToOwnerSwitch.reportError.on) return;
  errorObj = errorObj || {};
  const response = errorObj.response || {};
  console.log("reportError", response.status, response.statustext);
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
    await bot.telegram.sendMessage(receiver_id[i], text, {
      parse_mode: "markdown",
      disable_notification: !reportToOwnerSwitch.reportError.notify,
    });
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
