var axios = require("axios");
var URLSearchParams = require('urlsearchparams');
var parseString = require('xml2js').parseString;

var urlbase = require("../settings/settings.js").url;
var MESSAGE = require("../settings/settings.js").msg;
var KEYWORDS = require("../settings/settings.js").keywords;
var userAgents = require("../settings/settings.js").userAgents;
var sendResult = require("./sendResult.js");
var reportToOwner = require("./reportToOwner.js");
var reportLimitsOfSaucenao = reportToOwner.reportLimitsOfSaucenao;
var reportRequestError = reportToOwner.reportRequestError;
var tools = require("../tools/tools.js");
var tokenSN = require("../settings/settings.js").private.SNKey;
var idButtonName = require("../settings/settings.js").id_buttonName;

module.exports = function(url, bot, editMsg) {
  var params = new URLSearchParams.URLSearchParams();
      params.append('url', url);
      params.append('sort', 'size');
      params.append('order', 'desc');
  var shareId = editMsg.fileId || editMsg.url;

  return axios.get("https://tineye.com/search?"+params, 
    {headers:
      {
        "User-Agent": userAgents[
          parseInt(Math.random()*userAgents.length)
        ],
      }}
  )
  .then(res => {
    console.log("get tineye completed");

    var tmp = res.data;
    var start = tmp.indexOf('<div class="row match-row"');
    start = tmp.indexOf('<div class="match"', start);
    if (start == -1){
      console.log("not found");
      return Promise.reject();
    }
    tmp = tmp.substring( start, tmp.indexOf('</div>', start)+6);
    //console.log(tmp);
    parseString(tmp, function (err, res) {
      res=res.div;

      var siteName = res.h4[0].$.title, 
        highResUrl = res.p[0].a[0].$.href, 
        page = res.p[2].a[0].$.href;

      
      var displayText = highResUrl.substr(highResUrl.lastIndexOf('/')+1)
        + " from " + siteName;
      var markup = bot.inlineKeyboard([[
          bot.inlineButton(idButtonName.picLink, {
            url: highResUrl
          }),
          bot.inlineButton(idButtonName.pageLink, {
            url: page
          }),
          bot.inlineButton(idButtonName.share, {
            inline: shareId
          })
        ]]);
      return bot.editText(tools.getId(editMsg), displayText, {markup: markup, 
        disable_web_page_preview: true}).catch( err => console.dir(err));

    });
  })
  .catch( err => {
    console.dir(err);
    var params = urlbase.sauceNaoParams;
    params.url = url;
    params.api_key = tokenSN;

    return axios.get(urlbase.sauceNao, {
      params: params
    })
    .then(res => {
      console.log("get saucenao completed");
      // console.log("response is ", res);
      if (global.debug) console.log("result is", res.data.results);

      // res.data가 string으로 반환되며, 앞에 <!-- 175.196.43 --> 가 붙어서
      // 오는 경우가 있어서 처리
      if (typeof res.data === "string" && res.data.includes("<!--") && res.data.includes("-->")) {
        res.data = JSON.parse(res.data.slice(res.data.indexOf("-->")+3).trim());
      }

      var header = res.data.header || {};
      var results = res.data.results || [];

      for (i=0; i< results.length; i++){
        console.log(results[i].header.similarity);
        if(results[i].header.similarity < params.minSimilarity){
          results.splice(i, 1);
          i--;
        }

      }

      reportLimitsOfSaucenao(header, bot);

      if (results.length < 1) {
        //if (msg.chat.type == "private" || (msg.text && KEYWORDS.indexOf(msg.text.toLowerCase()) > -1))
          return bot.editText(tools.getId(editMsg), MESSAGE.zeroResult, {parse: "Markdown"});
        //else return null;
      }

      ///console.log("res.data.results are ", results);

      return sendResult(results, results.length, bot, editMsg);
    })
    .catch(err => {
      console.log("Error: error in get request to saucenao");
      //console.dir(err);
      if (err.response) {
        // The request was made, but the server responded with a status code
        // that falls out of the range of 2xx
        console.log("-----error.status is", err.response.status);
        console.log("-----error.headers is", err.response.headers);
        console.log("-----error.data is", err.response.data);
        if (err.response.status && err.response.status == 429) {
          bot.editText(tools.getId(editMsg), MESSAGE.reachLimitation, {parse: "Markdown"});
        } else
          bot.editText(tools.getId(editMsg), MESSAGE.unknownError, {parse: "Markdown"});
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('-----error', err.message);
        bot.editText(tools.getId(editMsg), MESSAGE.unknownError, {parse: "Markdown"});
      }
      console.log(err.config);
      reportRequestError(err, bot);
    });
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
