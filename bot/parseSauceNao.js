"use strict";

const Markup = require('telegraf/markup');
const urlbase = require("../settings/settings.js").url;
const MESSAGE = require("../settings/settings.js").msg;
const idButtonName = require("../settings/settings.js").id_buttonName;
const tools = require("../tools/tools.js");
const analytics = require('./analytics.js');
const reportToOwner = require("./reportToOwner.js");
const cheerio = require('cheerio');

const parseSauceNao = (response, bot, editMsg) => {
  console.log("get saucenao completed ");
  const $ = cheerio.load(response);
  let found = false;
  const shareId = editMsg.fileId || editMsg.url;
  const preview = false;
  const bList = [];

  const results = [];
  const links = {};
  const content = {_title:'', _text:''};
  let displayText = "";

  $(".resulttablecontent").each(
    (i, elem) => {
      const percent = parseFloat($(elem).find(".resultsimilarityinfo").text());
      if (results.length && Math.abs(results[0].percent - percent) > urlbase.sauceNaoParams.tolerance)
        return;
      if(percent < urlbase.sauceNaoParams.minSimilarity)
        return;

      found = true;
      
      $(elem).find(".resultcontentcolumn a").each(
        (i,elem) => {
          let text;
          if ($(elem).prev())
            text = $(elem).prev().text();
          if(!text)
            return;
          text = text.replace("Member", "Artist");
          
          links[text] = $(elem).attr("href");
          if (text =="Artist" && !content._byUsername)
            content._byUsername = $(elem).text();
          $(elem).prev().remove();
          $(elem).remove();
      });

      $(elem).find(".resulttitle, .resultcontentcolumn").each(
        (i,elem) => {
          let isCharactersDiv = false;

          let lines = $(elem).html().replace(/<br \/>|<br>/g, "\n").trim();
          lines = $(lines).text();

          if(lines){
            lines = lines.split("\n");
            for(i in lines){
              if (!lines[i].trim())
                continue;
              const splits = lines[i].split(": ");
              let key = splits[0].trim();
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
          let text = $(elem).children().attr("src")
          text = text.substring(text.lastIndexOf("/")+1, text.lastIndexOf("."));
          if (links[text]){
            return;
          }
          links[text] = $(elem).attr("href");
          if (text == "anidb"){
            // extract episode number
            let title;
            const matches = content._title.match(/(.+) - ([\d]+)\n$/);
            if (matches && matches.length == 3){
              title = matches[1];
              content._title = title + " (Ep. " + matches[2] + ")\n";
            } else
              title = content._title;

            links["MAL"] = urlbase.mal + tools.json2query({q: title});
          }
      });

      results.push({percent:percent});
    });

  if (!found){
    analytics.track(editMsg.origFrom, "sauce_not_found", {url: editMsg.url});
    return Promise.reject(new Error(MESSAGE.zeroResult));
  }
  if (content._title)
    displayText = "<b>" + content._title + "</b>"+ '\n' ;
  
  delete content._title;

  if (!content.By && content._byUsername)
    content._byUsername = content.By;

  if (content.Characters){
    displayText += "<b>Character: </b>"+ content.Characters + "\n";
    delete content.Characters;
  }
  if (content.Material){
    displayText += "<b>Material: </b>"+ content.Material + "\n";
    delete content.Material;
  }

  for (let key in content) {
    if (!( key == "_text" || key == "JPTitle"))
        displayText += "<b>" + key + ": </b>"+content[key]+ '\n';
  }
  // put blank line if > 1 line
  if ((content._text.match(/\n/g) || []).length > 1)
    content._text = "\n" + content._text;

  displayText += content._text;
  if (!displayText.trim())
    displayText = "-no title-";

  let ctr = 0;
  for (const key in links) {
    if (ctr>=6) //max 6 buttons or 3 lines 
      break;
    console.log("link:", key, links[key]);
    let text = key.replace(/:/g,"").replace(/ ID/g,"");
    let url = links[key];
    if (url.startsWith("//"))
      url = "http:" + url;
    if (ctr == 0)
      text = "View on " + text;
    bList.push( Markup.urlButton(text, url) );
    ctr++;
  }
  // bList.push(Markup.switchToChatButton(idButtonName.share, "sn|" + shareId));
  
  const markup = Markup.inlineKeyboard(tools.buttonsGridify(bList));

  analytics.track(editMsg.origFrom, "sauce_found_saucenao");

  let report = "<a href=\"" + urlbase.sauceNao + "url=" + 
    editMsg.url + "\">link</a>\n\n" + displayText;
  reportToOwner.sauceNaoResult(report, bot);
  reportToOwner.reportFile(editMsg.fileId, bot, 1);
  return [displayText, markup, preview];
};

module.exports = parseSauceNao;
