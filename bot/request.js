const fetchNoCache = require('make-fetch-happen');
const fetch = fetchNoCache.defaults({
  cacheManager: './sCache',
  cache: 'force-cache'
});
var parseString = require('xml2js').parseString;

var SETTINGS = require("../settings/settings.js");
var urlbase = SETTINGS.url;
var MESSAGE = SETTINGS.msg;
var userAgents = SETTINGS.userAgents;
var sendResult = require("./sendResult.js");
var reportToOwner = require("./reportToOwner.js");
var reportLimitsOfSaucenao = reportToOwner.reportLimitsOfSaucenao;
var reportRequestError = reportToOwner.reportRequestError;
var tools = require("../tools/tools.js");
var tokenSN = SETTINGS.private.SNKey;
var idButtonName = SETTINGS.id_buttonName;

module.exports = function(url, bot, editMsg) {
  var params = {url: url, sort: 'size', order: 'desc'};
  var shareId = editMsg.fileId || editMsg.url;
  var rateText = '';

      // count user request and if it satisfies condition, print msg asking rating
    if (global.userCount.on && editMsg.chat && editMsg.chat.type == "private") {
      var from_id = editMsg.from.id;
      var count = global.userCount[from_id.toString()];
      if (count === undefined) global.userCount[from_id.toString()] = 0;
      global.userCount[from_id.toString()] += 1;

      count = global.userCount[from_id.toString()];

      if ((count / 2) - Math.floor(count / 2) === 0) {
        rateText = MESSAGE.requestRating;
      }
    }

  return fetch("https://tineye.com/search?" + tools.json2query(params), 
    {headers:
      {
        "User-Agent": userAgents[
          parseInt(Math.random()*userAgents.length)
        ],
      }}
  )
  .then(res => res.text().then( res => {
    console.log("get tineye completed");

    var tmp = res;
    var start = tmp.indexOf('<div class="row match-row"');
    start = tmp.indexOf('<div class="match"', start);
    if (start == -1){
      console.log("not found");
      return Promise.reject();
    }
    //TODO: if URL, load/head it, check if mime=pic types, say invalid url if not.
    tmp = tmp.substring( start, tmp.indexOf('</div>', start)+6);
    //console.dir(tmp);
    parseString(tmp, function (err, res) {
      res=res.div;

      var siteName = res.h4[0].$.title, 
        imgName = res.p[0].a[0].$.title,
        highResUrl = res.p[0].a[0].$.href, 
        page = res.p[2].a[0].$.href;

      var displayText = "<a href=\"" + highResUrl + "\">" + imgName 
		+ "</a> from <a href=\"" + page + "\">" + siteName + "</a>\n" + rateText;
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
      fetchNoCache(urlbase.analUrl + tools.json2query({ec: "sauce_found", ea: "tineye", uid: editMsg.from.id, ul: editMsg.from.language_code}));
      return bot.editText(tools.getId(editMsg), displayText, {markup: markup, parse: "HTML",
        preview: false}).catch( err => console.dir(err));

    });
  }))
  .catch( err => {
    console.dir(err);
    var params = urlbase.sauceNaoParams;
    params.url = url;
    params.api_key = tokenSN;
    sURL = urlbase.sauceNao + tools.json2query(params);
    //console.log(sURL);
    return fetch(sURL, {
      params: params
    })
    .then(res => res.text().then( res => {
      console.log("get saucenao completed");
      // console.log("response is ", res);
      if (global.debug) console.log("result is", res);

      // res가 string으로 반환되며, 앞에 <!-- 175.196.43 --> 가 붙어서
      // 오는 경우가 있어서 처리
      if (typeof res === "string" && res.includes("<!--") && res.includes("-->")) {
        try{
          res = JSON.parse(res.slice(res.indexOf("-->")+3).trim());
        } catch(e){
          return Promise.reject(new Error(
            res.substring(res.lastIndexOf('<br />') + 6, res.lastIndexOf('</b'))));
        }
      } else
      		res = JSON.parse(res);

      var header = res.header || {};
      var results = res.results || [];

      for (i=0; i< results.length; i++){
        console.log(results[i].header.similarity);
        if(results[i].header.similarity < params.minSimilarity){
          results.splice(i, 1);
          i--;
        }

      }

      reportLimitsOfSaucenao(header, bot);

      if (results.length < 1) {
        fetchNoCache(urlbase.analUrl + tools.json2query({ec: "sauce_found", ea: "not_found", uid: editMsg.from.id, ul: editMsg.from.language_code}));
        return bot.editText(tools.getId(editMsg), MESSAGE.zeroResult.replace(
		"some butter", "</i><a href=\"https://www.google.com/searchbyimage?&image_url=" + url + "\">Google</a><i>"), {parse: "HTML"});
      }

      ///console.log("res.results are ", results);
      fetchNoCache(urlbase.analUrl + tools.json2query({ec: "sauce_found", ea: "saucenao", uid: editMsg.from.id, ul: editMsg.from.language_code}));
      return sendResult(results, results.length, bot, editMsg);
    }))
    .catch(err => {
      console.log("error in get request to saucenao");
      console.dir(err);
      if (err.response) {
        // The request was made, but the server responded with a status code
        // that falls out of the range of 2xx
        console.log("-----error.status is", err.response.status);
        console.log("-----error.headers is", err.response.headers);
        console.log("-----error.text is", err.response.text);
        if (err.response.status && err.response.status == 429) {
          bot.editText(tools.getId(editMsg), MESSAGE.reachLimitation, {parse: "HTML"});
        } else
          bot.editText(tools.getId(editMsg), MESSAGE.unknownError, {parse: "HTML"});
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('-----error', err.message);
        bot.editText(tools.getId(editMsg), "<b>Error:</b> " + err.message, {parse: "HTML"});
      }
      console.dir(err);
      reportRequestError(err, bot);
    });
  });
};


/* When the request limitation occurs at the SauceNao, the error occurs as below */
// Error: error in get request to saucenao { Error: Request failed with status code 429
//     at createError (D:\Users\OneDrive\Work\saucenaobot\node_modules\fetch\lib\core\createError.js:15:15)
//     at settle (D:\Users\OneDrive\Work\saucenaobot\node_modules\fetch\lib\core\settle.js:18:12)
//     at IncomingMessage.handleStreamEnd (D:\Users\OneDrive\Work\saucenaobot\node_modules\fetch\lib\adapters\http.js:186:11)
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
//         'User-Agent': 'fetch/0.15.3' },
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
