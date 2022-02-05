"use strict";

export function urlDetector(text) {
  const urlR =
    /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
  const url = text.match(urlR);
  return url != null;
}
export function editMessageText(bot, msg, text, extras) {
  if (msg.inline_message_id)
    return bot.telegram.editMessageText(
      undefined,
      undefined,
      msg.inline_message_id,
      text,
      extras
    );
  else
    return bot.telegram.editMessageText(
      msg.chat.id,
      msg.message_id,
      undefined,
      text,
      extras
    );
}
export function json2query(params) {
  const query = Object.keys(params)
    .map((k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k]))
    .join("&");
  return query;
}
export function arraysInCommon(array1, array2) {
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
}
export function isSupportedExt(filename) {
  if (!filename) return false;
  const ext = filename.substr(filename.lastIndexOf(".") + 1).toLowerCase();
  if (
    ext == "jpg" ||
    ext == "jpeg" ||
    ext == "gif" ||
    ext == "png" ||
    ext == "webp" ||
    ext == "bmp"
  )
    return true;
  return false;
}
export function getOtherSearches(text, url) {
  if (url) {
    text = text.replace(
      "{google}",
      '</i><a href="https://www.google.com/searchbyimage?image_url=' +
        url +
        '">Google Reverse Search</a><i>'
    );
    text = text.replace(
      "{saucenao}",
      '</i><a href="https://saucenao.com/search.php?url=' +
        url +
        '">SauceNAO</a><i>'
    );
    text = text.replace(
      "{tineye}",
      '</i><a href="https://tineye.com/search?url=' +
        url +
        '&sort=size&order=des">TinEye</a><i>'
    );
    text = text.replace(
      "{ascii2d}",
      '</i><a href="https://ascii2d.net/search/url/' +
        encodeURIComponent(url) +
        '">Ascii2d</a><i>'
    );
    return text;
  } else {
    text = text.substring(0, text.indexOf("."));
    return text;
  }
}
export function buttonsGridify(bList) {
  const buttons = [[]];
  for (let i = 0, j = 0; i < bList.length; i++) {
    if (
      buttons[j].length < 2 ||
      (i == bList.length - 1 && buttons[j].length < 3)
    ) {
      //the last line can have 3 buttons
    } else {
      buttons.push([]);
      j++;
    }
    buttons[j].push(bList[i]);
  }
  return buttons;
}
