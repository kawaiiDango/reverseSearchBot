const fetch = require('node-fetch');
var LRU = require("lru-cache");
var cache = LRU({ max: 50, maxAge: 1000 * 60 * 60 * 24 });
var parseString = require('xml2js').parseString;

var SETTINGS = require("../settings/settings.js");
var urlbase = SETTINGS.url;
var MESSAGE = SETTINGS.msg;
var parseSauceNao = require("./parseSauceNao.js");
var reportToOwner = require("./reportToOwner.js");
var tools = require("../tools/tools.js");
const analytics = require('./analytics.js');
var idButtonName = SETTINGS.id_buttonName;

module.exports = {
  fetchTineye: (url) => {
    var params = {url: url, sort: 'size', order: 'desc'};
    url = "https://tineye.com/search?" + tools.json2query(params);
    var hit = cache.get(url);

    if (hit){
      analytics.track(0, "cache_hit");
      return Promise.resolve(hit);
    }
    else return fetch(url, 
      {headers:
        {
          "User-Agent": SETTINGS.userAgents[
            parseInt(Math.random()*SETTINGS.userAgents.length)
          ],
        }
      }
    ).then(res => {
        var txt = res.text();
        console.log(cache.set(url, txt));
        return txt;
      });
  },
  parseTineye: (res, bot, editMsg) => {
    console.log("get tineye completed");

    var tmp = res;
    var start = tmp.indexOf('<div class="row match-row"');
    start = tmp.indexOf('<div class="match"', start);
    if (start == -1){
      console.log("not found");
      return Promise.reject(new Error("not found"));
    }
    //TODO: if URL, load/head it, check if mime=pic types, say invalid url if not.
    tmp = tmp.substring( start, tmp.indexOf('</div>', start)+6);
    //console.dir(tmp);
    return new Promise ( (resolve, reject) => {
      parseString(tmp, (err, res) => {
        res=res.div;

        var siteName = res.h4[0].$.title, 
          imgName = res.p[0].a[0].$.title,
          highResUrl = res.p[0].a[0].$.href, 
          page = res.p[2].a[0].$.href;

        var displayText = "<a href=\"" + highResUrl + "\">" + imgName 
  		    + "</a> from <a href=\"" + page + "\">" + siteName + "</a>\n";
        var shareId = editMsg.fileId || editMsg.url;
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
        analytics.track(editMsg.origFrom, "sauce_found_tineye");
        resolve([displayText, markup]);
      })
    });
  },
  fetchSauceNao: (url) => {
    var params = urlbase.sauceNaoParams;

    params.url = url;
    params.api_key = SETTINGS.private.SNKey;
    url = urlbase.sauceNao + tools.json2query(params);

    var hit = cache.get(url);

    if (hit){
      analytics.track(0, "cache_hit");
      return new Promise.resolve(hit);
    }
    else
      return fetch(url, {
        params: params
    }).then(res => {
        var txt = res.text();
        cache.set(url, txt);
        return txt;
      });
  },
  cleanSauceNao: (res, bot, editMsg) => {
      console.log("get saucenao completed");
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
      
      reportToOwner.reportLimitsOfSaucenao(header, bot);

      return Promise.resolve(parseSauceNao(results, results.length, bot, editMsg));
  },
  errInFetch: err => {
    console.log("errInFetch");
    console.dir(err);
    if (err.response) {
      // The request was made, but the server responded with a status code
      // that falls out of the range of 2xx
      console.log("-----error.status is", err.response.status);
      console.log("-----error.headers is", err.response.headers);
      // console.log("-----error.text is", err.response.text);
      if (err.response.status && err.response.status == 429) {
        return [MESSAGE.reachLimitation];
      } else
        return [MESSAGE.unknownError];
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('-----error', err.message);
      return ["<b>Error:</b> " + err.message];
    }
    reportToOwner.reportRequestError(err, bot);
  }
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
