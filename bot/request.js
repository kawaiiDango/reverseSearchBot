var axios = require("axios");
var urlbase = require("../settings/settings.js").url;
var MESSAGE = require("../settings/settings.js").msg;
var KEYWORDS = require("../settings/settings.js").keywords;
var sendResult = require("./sendResult.js");
var reportToOwner = require("./reportToOwner.js");
var reportLimitsOfSaucenao = reportToOwner.reportLimitsOfSaucenao;
var reportRequestError = reportToOwner.reportRequestError;

module.exports = function(url, bot, tokenSN, msg) {
  var chat_id = msg.chat.id;
  var reply = msg.message_id;
  var params = urlbase.sauceNaoParams;
  params.url = url;
  params.api_key = tokenSN;

  return axios.get(urlbase.sauceNao, {
    params: params
  })
  .then(function(res) {
    console.log("get request to saucenao completed");
    // console.log("response is ", res);
    if (global.debug) console.log("result is", res.data.results);

    // res.data가 string으로 반환되며, 앞에 <!-- 175.196.43 --> 가 붙어서
    // 오는 경우가 있어서 처리
    if (typeof res.data === "string" && res.data.includes("<!--") && res.data.includes("-->")) {
      res.data = JSON.parse(res.data.slice(res.data.indexOf("-->")+3).trim());
    }

    var header = res.data.header || {};
    var results = res.data.results || [];

    reportLimitsOfSaucenao(header, bot);

    if (results.length < 1) {
      if (msg.chat.type == "private" || (msg.text && KEYWORDS.indexOf(msg.text) > -1))
        return bot.sendMessage(chat_id, MESSAGE.zeroResult, {reply: reply, parse: "Markdown"});
      else return null;
    }

    ///console.log("res.data.results are ", results);

    return sendResult(results, results.length, bot, msg);
  })
  .catch(function(err) {
    console.log("Error: error in get request to saucenao");
    if (err.response) {
      // The request was made, but the server responded with a status code
      // that falls out of the range of 2xx
      console.log("-----error.status is", err.response.status);
      console.log("-----error.headers is", err.response.headers);
      console.log("-----error.data is", err.response.data);
      if (err.response.status && err.response.status == 429) {
        bot.sendMessage(chat_id, MESSAGE.reachLimitation, {parse: "Markdown"});
      }

    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('-----error', err.message);
      bot.sendMessage(chat_id, MESSAGE.unknownError, {parse: "Markdown"});
    }
    console.log(err.config);
    reportRequestError(err, bot);
  });
};


/* When the request limitation occurs at the SauceNao, the error occurs as below */
// Error: error in get request to saucenao { Error: Request failed with status code 429
//     at createError (D:\Users\OneDrive\Work\saucenaobot\node_modules\axios\lib\core\createError.js:15:15)
//     at settle (D:\Users\OneDrive\Work\saucenaobot\node_modules\axios\lib\core\settle.js:18:12)
//     at IncomingMessage.handleStreamEnd (D:\Users\OneDrive\Work\saucenaobot\node_modules\axios\lib\adapters\http.js:186:11)
//     at emitNone (events.js:91:20)
//     at IncomingMessage.emit (events.js:185:7)
//     at endReadableNT (_stream_readable.js:926:12)
//     at _combinedTickCallback (internal/process/next_tick.js:74:11)
//     at process._tickCallback (internal/process/next_tick.js:98:9)
//   config:
//    { adapter: [Function: httpAdapter],
//      transformRequest: { '0': [Function: transformRequest] },
//      transformResponse: { '0': [Function: transformResponse] },
//      timeout: 0,
//      xsrfCookieName: 'XSRF-TOKEN',
//      xsrfHeaderName: 'X-XSRF-TOKEN',
//      maxContentLength: -1,
//      validateStatus: [Function: validateStatus],
//      headers:
//       { Accept: 'application/json, text/plain, */*',
//         'User-Agent': 'axios/0.15.3' },
//      method: 'get',
//      params:
//       { db: 999,
//         output_type: 2,
//         testmode: 1,
//         numres: 7,
//         url: 'https://api.telegram.org/file/bot346528795:AAF_G5E08nntbvrDGVU9BrEZ218gxleSlnw/photo/file_88.jpg',
//         api_key: '346528795:AAF_G5E08nntbvrDGVU9BrEZ218gxleSlnw' },
//      url: 'https://saucenao.com/search.php',
//      data: undefined },
//   response:
//    { status: 429,
//      statusText: 'Too Many Requests',
//      headers:
//       { server: 'nginx',
//         date: 'Thu, 16 Feb 2017 18:18:18 GMT',
//         'content-type': 'text/html; charset=UTF-8',
//         'transfer-encoding': 'chunked',
//         connection: 'close',
//         'cache-control': 'private, max-age=1800' },
//      config:
//       { adapter: [Function: httpAdapter],
//         transformRequest: [Object],
//         transformResponse: [Object],
//         timeout: 0,
//         xsrfCookieName: 'XSRF-TOKEN',
//         xsrfHeaderName: 'X-XSRF-TOKEN',
//         maxContentLength: -1,
//         validateStatus: [Function: validateStatus],
//         headers: [Object],
//         method: 'get',
//         params: [Object],
//         url: 'https://saucenao.com/search.php',
//         data: undefined },
//      request:
//       Writable {
//         _writableState: [Object],
//         writable: true,
//         domain: null,
//         _events: [Object],
//         _eventsCount: 2,
//         _maxListeners: undefined,
//         _options: [Object],
//         _redirectCount: 0,
//         _onNativeResponse: [Function],
//         _currentRequest: [Object],
//         _currentUrl: 'https://saucenao.com' },
//      data: '<!-- 175.196.43 -->\n<strong>Daily Search Limit Exceeded.</strong><br /><br />175.196.43.176, your IP has exceeded the unregistered user\'s daily limit of 150 searches.<br /><br />Please <a href=\'user.php\'>register or log in</a> to increase this limit.' } }
