"use strict";

module.exports = {
  urlDetector: text => {
    const urlR = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    const url = text.match(urlR);
    return url != null;
  },
  editMessageText: (bot, msg, text, extras) => {
    if (msg.inline_message_id)
      return bot.telegram.editMessageText(undefined, undefined, msg.inline_message_id, text, extras);
    else
      return bot.telegram.editMessageText(msg.chat.id, msg.message_id, undefined, text, extras);
  },
  json2query: params => {
    const query = Object.keys(params)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
    return query;
  },
  arraysInCommon: (array1, array2) => {
    // 두 어레이가 공통으로 가지는 원소를 추출하여 어레이로 출력
    array1 = array1 || [];
    array2 = array2 || [];
    let element1;
    let element2;
    const result = [];

    for (let i = 0; i < array1.length; i++) {
      element1 = array1[i];
      for (let j = 0; j < array2.length; j++) {
        element2 = array2[j];
        if (element1 === element2) {
          result.push(element2);
          break;
        }
      }
    }
    // console.log("arrayInCommon result is ", result);
    return result;
  },
  isSupportedExt: (filename) => {
    if (!filename)
      return false;
  	const ext = filename.substr(filename.lastIndexOf('.')+1).toLowerCase();
  	if( ext == "jpg" || ext =="png" || ext == "webp" || ext == "bmp")
  		return true;
  	return false;
	},
  getGoogleSearch: (text, url) => {
    let idx = url.indexOf('bot');
    idx = url.indexOf('/', idx) +1;
    let tokenHiderUrl = require("../settings/private.js").tokenHiderUrl;
    tokenHiderUrl += url.substr(idx);
    return text.replace("google", 
      "</i><a href=\"https://www.google.com/searchbyimage?image_url=" + 
      tokenHiderUrl + "\">Google Reverse Search</a><i>");
  },
  buttonsGridify: (bList) => {
    const buttons = [[]];
    for (let i = 0, j=0; i < bList.length; i++) {
      if (buttons[j].length < 2 || (i == bList.length - 1 && buttons[j].length<3)){
        //the last line can have 3 buttons
      } else {
        buttons.push([]);
        j++;
      }
      buttons[j].push(bList[i]);
    }
  return buttons;
  }
};
