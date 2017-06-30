module.exports = {
  urlDetector: text => {
    var urlR = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    var regex = new RegExp(urlR);
    var url= text.match(regex);
    if (url) {
      return true;
    }
    return false;
  },
  getId: msg => {
    if (msg.inline_message_id)
      return {inlineMsgId: msg.inline_message_id};
    else
      return {chatId: msg.chat.id, messageId: msg.message_id};
  },
  json2query: params => {
    var esc = encodeURIComponent;
    var query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
    return query;
  },
  arraysInCommon: (array1, array2) => {
    // 두 어레이가 공통으로 가지는 원소를 추출하여 어레이로 출력
    array1 = array1 || [];
    array2 = array2 || [];
    var element1;
    var element2;
    var result = [];

    for (var i = 0; i < array1.length; i++) {
      element1 = array1[i];
      for (var j = 0; j < array2.length; j++) {
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
	var ext = filename.substr(filename.lastIndexOf('.')+1).toLowerCase();
	if( ext == "jpg" || ext =="png" || ext == "webp" || ext == "bmp")
		return true;
	return false;
	},
  buttonsGridify: (bList) => {
    var buttons = [[]];
    for (var i = 0, j=0; i < bList.length; i++) {
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
