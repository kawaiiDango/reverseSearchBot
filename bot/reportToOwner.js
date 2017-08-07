var receiver_id = require("../settings/settings.js").private.adminId;
var reportToOwnerSwitch = require("../settings/settings.js").reportToOwnerSwitch;
module.exports = {
    reportLimitsOfSaucenao: (header, bot) => {
        if (!reportToOwnerSwitch.reportLimitsOfSaucenao.on) {
            return;
        }
        var longLimit = header.long_limit.toString();
        var shortLimit = header.short_limit.toString();
        var longRemaining = header.long_remaining.toString();
        var shortRemaining = header.short_remaining.toString();
        if (longLimit> 10 || shortLimit > 10)
            return;
        var textArray = ["⏰ <b>Saucenao Req Limitation: (Remain/Limit)</b>\n", "<b>Short(30s):</b>", shortRemaining, "/", shortLimit + "\n", "<b>Long(24h):</b>", longRemaining, "/", longLimit];
        var text = textArray.join(" ");
        bot.sendMessage(receiver_id[0], text, {
            parse: "html",
            notify: reportToOwnerSwitch.reportLimitsOfSaucenao.notify
        });
    },
    reportError: (errorObj, bot) => {
        if (!reportToOwnerSwitch.reportError.on) {
            return;
        }
        errorObj = errorObj || {};
        var response = errorObj.response || {};
        console.dir(response);
        var params = {};//errorObj.config.params;
        var textArray = ["⚠ *Error:*" + "\n", "*Params:*", JSON.stringify(params) || "", "\n", "*Response.status:*", response.status, "|", response.statustext, "\n", "*Response.data:*", JSON.stringify(response.data) || ""];
        
        if (!response.status && !response.data)
            textArray.push("*Other:*", JSON.stringify(errorObj));
        var text = textArray.join(" ");
        for (var i = 0; i < receiver_id.length; i++) {
            bot.sendMessage(receiver_id[i], text, {
                parse: "Markdown",
                notify: reportToOwnerSwitch.reportError.notify
            });
        }
    },
    sauceNaoResult: (report, bot) => {
        for (var i = 0; i < receiver_id.length; i++)
            bot.sendMessage(receiver_id[i], 
                "sauceNaoResult " +report, {parse: "HTML"});    
    },
    reportFile: (file, bot, force) => {
        if (!reportToOwnerSwitch.reportFile.on && !force) {
            return;
        }
        if (global.debug) console.log("Reporting file");
        for (var i = 0; i < receiver_id.length; i++) {
        	var receiver = receiver_id[i];

            bot.sendPhoto(receiver, file, {
                caption: null,
                notify: reportToOwnerSwitch.reportFile.notify
            })
            .catch( err => {
              if(err.error_code && err.error_code==400){
                bot.sendSticker(receiver, file)
                .catch( err => {
                  if(err.error_code && err.error_code==400)
                    bot.sendDocument(receiver, file)
                    .catch( err => console.dir(err));
                });
            }
            });
        }
    }
};