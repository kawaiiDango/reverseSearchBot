var urlbase = require("../settings/settings.js").url;
var MESSAGE = require("../settings/settings.js").msg;
var idButtonName = require("../settings/settings.js").id_buttonName;
var idbaseArray = Object.keys(idButtonName);
var tools = require("../tools/tools.js");
const analytics = require('./analytics.js');
var reportToOwner = require("./reportToOwner.js");

var parseSauceNao = function(results, totalLength, bot, editMsg) {
  results = results || [];
  var from_id = editMsg.from.id;
  var shareId = editMsg.fileId || editMsg.url;

  for (i=0; i< results.length; i++){
    console.log(results[i].header.similarity);
    if(results[i].header.similarity < urlbase.sauceNaoParams.minSimilarity){
      results.splice(i, 1);
      i--;
    }
  }

  if (!results.length){
      analytics.track(editMsg.origFrom, "sauce_not_found", {url: editMsg.url});
    return [MESSAGE.zeroResult.replace(
      "google", "</i><a href=\"https://www.google.com/searchbyimage?&image_url=" + editMsg.url + "\">Google</a><i>")];
  }
  analytics.track(editMsg.origFrom, "sauce_found_saucenao");
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
  var preview = false;
  var number = totalLength - results.length + 1;
  var buttonName, urlPrefix, id;
  var restOfIds = tools.arraysInCommon(idbaseArray, Object.keys(data));

  var text = createDetailedText(header, data);

  if (restOfIds.length) {
  // pixiv_id를 제외한 XXX_id 유형이 있는 경우,
  // settings/settings.js의 url property를 참조하여 지정된 id 항목을 추출

  if (restOfIds.length > 5)
      restOfIds.splice(5); //keep only 5 items

    // displayText = "<b>" + (data.title || "...") + "</b>" + " by _" + 
    //   (data.member_name || data.creator || "..." ) + "_";
    displayText = text;

    for (var j = 0; j < restOfIds.length; j++) {
      buttonName = idButtonName[restOfIds[j]];
      urlPrefix = urlbase[restOfIds[j]];
      id = data[restOfIds[j]];

      if (restOfIds[j] == "pawoo_id")
        id = data['pawoo_user_acct'] + '/' + id;

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
    preview = true;
    reportToOwner.unsupportedData(element, bot);
    displayText = createDetailedText(header, data, true);
    buttons = [
      [
        bot.inlineButton(idButtonName.share, {
          inline: shareId
        })
      ]
    ];
  }

  markup = bot.inlineKeyboard(buttons);
  return [displayText, markup, preview];

};

var createDetailedText = (header, data, showThumbnail) => {
      textarray = [
      //"<b>Similarity:</b>", header.similarity + "%", "|",
      (showThumbnail)? "\n<a href=\"" + header.thumbnail + "\">\u2063</a>" : null,
      (data.title ? "\n<b>" + data.title + "</b>" : "") + " " + 
      ((data.member_name || data.creator) ? "<b>by:</b> " + (data.member_name || data.creator) : ""),
      //(data.eng_name) ? "<b>Eng_title:</b> " + data.eng_name : null,
      //(data.jp_name) ? "<b>Jp_title:</b> " + data.jp_name : null,
      (data.source) ? "\n<b>Source:</b> " + data.source : null,
      (data.part) ? "\n<b>Episode:</b> " + data.part : null,
      (data.year) ? "\n<b>Year:</b> " + data.year : null,
      (data.est_time) ? "\n<b>Time: </b> " + data.est_time : null
    ];
    txt = textarray.join("");
    if (txt.length<2)
      txt = ' (no metadata)';
    return txt;
}

module.exports = parseSauceNao;
