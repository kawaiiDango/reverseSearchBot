var urlbase = require("../settings/settings.js").url;
var MESSAGE = require("../settings/settings.js").msg;
var idButtonName = require("../settings/settings.js").id_buttonName;
var idbaseArray = Object.keys(idButtonName);
var tools = require("../tools/tools.js");

var sendResult = function(results, totalLength, bot, editMsg) {
  results = results || [];
  var from_id = editMsg.from.id;
  var shareId = editMsg.fileId || editMsg.url;

  if (!results.length) {
    // console.log("Processing: nokori 0");

    // count user request and if it satisfies condition, print msg asking rating
    if (global.userCount.on) {
      var count = global.userCount[from_id.toString()];
      if (count === undefined) global.userCount[from_id.toString()] = 0;
      global.userCount[from_id.toString()] += 1;

      count = global.userCount[from_id.toString()];

      if ((count / 2) - Math.floor(count / 2) === 0) {
        bot.sendMessage(from_id, MESSAGE.requestRating, {parse: "Markdown", preview: false});
      }
    }
    return;
  } else {
    // console.log("Processing: nokori ", results.length);
  }
  totalLength = totalLength || totalLength;
  var element = results[0];
  var header = element.header;
  var data = element.data;
  var textarray = [];
  var text = "", displayText = "";
  var buttons = [];
  var innerbuttons = [];
  var innerbuttonsContainer = [];
  var markup;
  var number = totalLength - results.length + 1;
  var buttonName, urlPrefix, id;
  var restOfIds = tools.arraysInCommon(idbaseArray, Object.keys(data));

  var text = createDetailedText(header, data);

  if (restOfIds.length) {
  // pixiv_id를 제외한 XXX_id 유형이 있는 경우,
  // settings/settings.js의 url property를 참조하여 지정된 id 항목을 추출

    // displayText = "*" + (data.title || "...") + "*" + " by _" + 
    //   (data.member_name || data.creator || "..." ) + "_";
    displayText = text;

    for (var j = 0; j < restOfIds.length; j++) {
      buttonName = idButtonName[restOfIds[j]];
      urlPrefix = urlbase[restOfIds[j]];
      id = data[restOfIds[j]];

      if (j == 0)
        buttonName = "View on " + buttonName;

      innerbuttonsContainer.push(
        bot.inlineButton(buttonName, {
          url: urlPrefix + id
        })
      );
    }
    innerbuttonsContainer.push(
        bot.inlineButton(idButtonName.share, {
          inline: shareId
        })
      );
      
    for (var i = 0; i < innerbuttonsContainer.length; i++) {
      if (innerbuttons.length < 2){
        innerbuttons.push(innerbuttonsContainer[i]);
      } else {
        var target = innerbuttons;
        innerbuttons = [];
        innerbuttons.push(innerbuttonsContainer[i]);
        buttons.push(target);
      }
      if (i === innerbuttonsContainer.length - 1) {
        buttons.push(innerbuttons);
      }
    }
  } else {
    displayText = createDetailedText(header, data, true);
    buttons = [
      [
        bot.inlineButton(idButtonName.share, {
          inline: shareId
        })
      ]
    ];

    //return sendResult(results.slice(1), totalLength, bot, editMsg);
  }

  markup = bot.inlineKeyboard(buttons);

  return bot.editText(tools.getId(editMsg), displayText, {markup: markup, parse: "Markdown"});
  /*
  .then(function() {
    if (global.debug) console.log('inner then');
    return sendResult(results.slice(1), totalLength, bot, msg);
  });
*/
};

var createDetailedText = (header, data, showThumbnail) => {
  console.dir(data);
      textarray = [
      //"*Similarity:*", header.similarity + "%", "|",
      (data.title ? "*" + data.title + "*" : "") + " " + 
      ((data.member_name || data.creator) ? "*by:* " + (data.member_name || data.creator) : ""),
      (data.eng_name) ? "*Eng_title:* " + data.eng_name : null,
      (data.jp_name) ? "*Jp_title:* " + data.jp_name : null,
      (data.source) ? "*Source:* " + data.source : null,
      (data.part) ? "*Episode:* " + data.part : null,
      (data.year) ? "*Year:* " + data.year : null,
      (data.est_time) ? "*Time: * " + data.est_time : null,
      (showThumbnail)? "[\u2063](" + header.thumbnail + ")" : null
    ];
    return textarray.join("\n");
}

module.exports = sendResult;
