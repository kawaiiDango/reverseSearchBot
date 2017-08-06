var urlbase = require("../settings/settings.js").url;
var MESSAGE = require("../settings/settings.js").msg;
var idButtonName = require("../settings/settings.js").id_buttonName;
var proxyUrl = require("../settings/settings.js").private.proxyUrl;
var idbaseArray = Object.keys(idButtonName);
var tools = require("../tools/tools.js");
const analytics = require('./analytics.js');
var reportToOwner = require("./reportToOwner.js");
const cheerio = require('cheerio');

var parseSauceNao = function(response, bot, editMsg) {
  console.log("get saucenao completed ");
  const $ = cheerio.load(response);
  var found = false;
  var from_id = editMsg.from.id;
  var shareId = editMsg.fileId || editMsg.url;

  var results = [];
  var displayLinks = {};
  var displayText = "";
  $(".resulttablecontent").each(
    (i, elem) => {
      percent = parseFloat($(elem).find(".resultsimilarityinfo").text());
      console.log(percent);
      if (results.length && Math.abs(results[0].percent - percent) > urlbase.sauceNaoParams.tolerance)
        return;
      if(percent < urlbase.sauceNaoParams.minSimilarity)
        return;

      found = true;
      links = {};

      title = $(elem).find(".resulttitle");

      $(title).html($(title).html().replace(/<br>/g, "\n"));
      title = $(title).text();
      console.log(title);
      title = "<b>" + title + "</b>"
      
      $(elem).find(".resultcontentcolumn a").each(
        (i,elem) => {
          if ($(elem).prev())
            text = $(elem).prev().text();
          if(!text)
            return;
          displayLinks[text] = $(elem).attr("href");
          $(elem).prev().remove();
          $(elem).remove();
      });

      var content = "";
      $(elem).find(".resultcontentcolumn").each(
        (i,elem) => {
          if($(elem).text()){
            $(elem).html($(elem).html().replace(/<br>/g, "\n"));
            content += $(elem).text().trim() + "\n";
            content = content.replace("Est Time:", "Time:")
            ;
          }
        });
      console.log(content);
      displayText += content;

      $(elem).find(".resultmiscinfo > a").each(
        (i,elem) => {
          text = $(elem).children().attr("src");
          text = text.substring(text.lastIndexOf("/")+1, text.lastIndexOf("."))
          displayLinks[text] = $(elem).attr("href");
      });
      // console.dir(links);

      results.push({percent:percent, title:title, content:content, links:links});
    });

  if (!found){
    analytics.track(editMsg.origFrom, "sauce_not_found", {url: editMsg.url});
    return [tools.getGoogleSearch(MESSAGE.zeroResult, editMsg.url)];
  }

  displayText = results[0].title + '\n\n' +displayText;
  // displayLinks = results[0].links;
  preview = false;
  var bList = [];
  var firstLink = true;
  for (var key in displayLinks) {
    console.log("link:", key, displayLinks[key]);
    text = key.replace(/:/g,"").replace(/ ID/g,"");
    url = displayLinks[key];
    if (url.startsWith("//"))
      url = "http:" + url;
    if (firstLink){
      text = "View on " + text;
      firstLink = false;
    }
    bList.push(
        bot.inlineButton(text, {
          url: url
        })
      );
  }
  bList.push(
      bot.inlineButton(idButtonName.share, {
        inline: "sn|" + shareId
      })
    );
  
  buttons = tools.buttonsGridify(bList);

  var markup = bot.inlineKeyboard(buttons);
  analytics.track(editMsg.origFrom, "sauce_found_saucenao");
  console.log("done sn");
  return [displayText, markup, preview];
  /*
    preview = true;
    reportToOwner.unsupportedData(element, bot);
*/
};
/*
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
*/
module.exports = parseSauceNao;
