var urlbase = require("../settings/settings.js").url;
var MESSAGE = require("../settings/settings.js").msg;
var idButtonName = require("../settings/settings.js").id_buttonName;
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
  var preview = false;
  var bList = [];

  var results = [];
  var links = {};
  var content = {_title:'', _text:''};
  var displayText = "";

  $(".resulttablecontent").each(
    (i, elem) => {
      percent = parseFloat($(elem).find(".resultsimilarityinfo").text());
      if (results.length && Math.abs(results[0].percent - percent) > urlbase.sauceNaoParams.tolerance)
        return;
      if(percent < urlbase.sauceNaoParams.minSimilarity)
        return;

      found = true;
      
      $(elem).find(".resultcontentcolumn a").each(
        (i,elem) => {
          if ($(elem).prev())
            text = $(elem).prev().text()
            .replace("Member", "Artist");
          if(!text)
            return;
          links[text] = $(elem).attr("href");
          $(elem).prev().remove();
          $(elem).remove();
      });

      $(elem).find(".resulttitle, .resultcontentcolumn").each(
        (i,elem) => {
          var isCharactersDiv = false;

          var lines = $(elem).html().replace(/<br \/>|<br>/g, "\n").trim();
          lines = $(lines).text();

          if(lines){
            lines = lines.split("\n");
            for(i in lines){
              if (!lines[i].trim())
                continue;
              splits = lines[i].split(": ");
              key = splits[0].trim();
              if (splits.length==2 && splits[1]){
                key = key.replace("Est Time", "Time")
                    .replace("Creator", "By");
                if (content[key])
                  console.log("key " + key + " was occupied");
                else
                  content[key] = splits[1].trim()
              } else if (key) {
                //a character block has multiple characters 
                //seperated by \n and nothing else (i think)
                if (key == "Characters"){
                  isCharactersDiv = true;
                  content.Characters = '';
                } else if (isCharactersDiv){
                  content.Characters += key;
                  if (i != lines.length - 1)
                    content.Characters += ", ";
                }
                else if ($(elem).is(".resulttitle") && !content._title)
                  content._title += lines[i].trim()+"\n";
                else
                  content._text += "    "+lines[i].trim() +"\n";
              }
            }
          }
        });

      $(elem).find(".resultmiscinfo > a").each(
        (i,elem) => {
          text = $(elem).children().attr("src")
          text = text.substring(text.lastIndexOf("/")+1, text.lastIndexOf("."));
          if (links[text]){
            console.log("key " + key + " was occupied");
            return;
          }
          links[text] = $(elem).attr("href");
          if (text == "anidb"){
            // extract episode number
            matches = content._title.match(/(.+) - ([\d]+)\n$/);
            if (matches && matches.length == 3){
              title = matches[1];
              content._title = title + " (Ep. " + matches[2] + ")\n";
            } else
              title = content._title;

            links["MAL"] = urlbase.mal + title;
          }
      });

      results.push({percent:percent});
    });

  if (!found){
    analytics.track(editMsg.origFrom, "sauce_not_found", {url: editMsg.url});
    return [tools.getGoogleSearch(MESSAGE.zeroResult, editMsg.url)];
  }

  displayText = "<b>" + content._title + "</b>"+ '\n' ;
  delete content._title;

  if (content.Characters){
    displayText += "<b>Character: </b>"+ content.Characters + "\n";
    delete content.Characters;
  }
  if (content.Material){
    displayText += "<b>Material: </b>"+ content.Material + "\n";
    delete content.Material;
  }

  for (var key in content) {
    if (!( key == "_text" || key == "JPTitle"))
        displayText += "<b>" + key + ": </b>"+content[key]+ '\n';
  }
  // put blank line if > 1 line
  if ((content._text.match(/\n/g) || []).length > 1)
    content._text = "\n" + content._text;

  displayText += content._text;

  var ctr = 0;
  for (var key in links) {
    if (ctr>=6) //max 6 buttons or 3 lines 
      break;
    console.log("link:", key, links[key]);
    text = key.replace(/:/g,"").replace(/ ID/g,"");
    url = links[key];
    if (url.startsWith("//"))
      url = "http:" + url;
    if (ctr == 0)
      text = "View on " + text;
    bList.push( bot.inlineButton(text, { url: url }) );
    ctr++;
  }
  bList.push(
    bot.inlineButton(idButtonName.share, {
      inline: "sn|" + shareId
    })
  );
  
  markup = bot.inlineKeyboard(tools.buttonsGridify(bList));

  analytics.track(editMsg.origFrom, "sauce_found_saucenao");

  report = "<a href=\"" + urlbase.sauceNao + "url=" + 
    editMsg.url + "\">link</a>\n\n" + displayText;
  reportToOwner.sauceNaoResult(report, bot);
  reportToOwner.reportFile(editMsg.fileId, bot, 1);
  return [displayText, markup, preview];
};

module.exports = parseSauceNao;
