var receiver_id = require("../settings/settings.js").private.adminId;
var reportToOwnerSwitch = require("../settings/settings.js").reportToOwnerSwitch;

module.exports = {
  reportLimitsOfSaucenao: function(header, bot) {
    if (!reportToOwnerSwitch.reportLimitsOfSaucenao.on) {
      return;
    }

    var longLimit = header.long_limit.toString();
    var shortLimit = header.short_limit.toString();
    var longRemaining = header.long_remaining.toString();
    var shortRemaining = header.short_remaining.toString();

    var textArray = [
      "⏰ <b>Saucenao Req Limitation: (Remain/Limit)</b>\n",
      "<b>Short(30s):</b>", shortRemaining, "/", shortLimit + "\n",
      "<b>Long(24h):</b>", longRemaining, "/", longLimit
    ];

    var text = textArray.join(" ");
    bot.sendMessage(receiver_id[0], text, {parse: "html", notify: reportToOwnerSwitch.reportLimitsOfSaucenao.notify});
  },
  reportRequestError: function(errorObj, bot) {
    if (!reportToOwnerSwitch.reportRequestError.on) {
      return;
    }

    errorObj = errorObj || {};
    var response = errorObj.response || {};
    var params = errorObj.config.params;

    var textArray = [
      "⚠ *Error:*" + "\n",
      "*Type:*", "Request error" + "\n",
      "*Params:*", JSON.stringify(params) || "", "\n",
      "*Response.status:*", response.status, "|", response.statustext, "\n",
      "*Response.data:*", JSON.stringify(response.data) || ""
    ];

    var text = textArray.join(" ");
    for (var i = 0; i < receiver_id.length; i++) {

      bot.sendMessage(receiver_id[i], text, {parse: "Markdown", notify: reportToOwnerSwitch.reportRequestError.notify});
    }
  },
  reportFileUrl: function(file, tokenBot, bot) {
    if (!reportToOwnerSwitch.reportFileUrl.on) {
      return;
    }
    if (global.debug) console.log("Reporting fileurl");
    for (var i = 0; i < receiver_id.length; i++) {
      var text = "💾 *Fileurl: * \n" +
      "[<download>](" + "https://api.telegram.org/file/bot" + tokenBot + "/" + file.file_path + ")";
      bot.sendMessage(receiver_id[i], text, {parse: "Markdown", notify: reportToOwnerSwitch.reportFileUrl.notify});
    }
  }
};
