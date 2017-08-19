const fetch = require('node-fetch');
var socksProxyAgent = require('socks-proxy-agent');
var LRU = require("lru-cache");
var cache = LRU({ max: 50, maxAge: 1000 * 60 * 60 * 24 });
const cheerio = require('cheerio');

var SETTINGS = require("../settings/settings.js");
var urlbase = SETTINGS.url;
var MESSAGE = SETTINGS.msg;
var parseSauceNao = require("./parseSauceNao.js");
var reportToOwner = require("./reportToOwner.js");
var tools = require("../tools/tools.js");
const analytics = require('./analytics.js');
var idButtonName = SETTINGS.id_buttonName;
var proxy = {idx:0, agent:null};

var changeProxy = () => {
  var idx = (proxy.idx + 1) % SETTINGS.private.socksProxyUrls.length;
  proxy.idx = idx;
  var url = SETTINGS.private.socksProxyUrls[idx];

  var params = {anonymityLevel: 1, protocol: "socks5",
     maxCheckPeriod:300, cookies:true, get:true, }

  fetch(urlbase.gimmeproxy + tools.json2query(params))
    .then((res) => res.json()
      .then(
        (res) => {
          url = (res.protocol || "socks5") + "://" + res.ipPort;
          proxy.agent = url ? new socksProxyAgent(url) : null;
          console.log("proxy set to " + url);
        }
      ));
};

var myFetch = (url, editMsg, options) => {//changeProxy();
  var hit = cache.get(url);

  if (hit){
    analytics.track(editMsg.origFrom, "cache_hit");
    return Promise.resolve(hit);
  }

  if (options == null)
    options = {};
  options.agent = proxy.agent;
  if (options.credentials == null) options.credentials = 'same-origin'
  return fetch(url, options).then((res) => {
    if (res.status >= 200 && res.status < 300) {
      var txt = res.text();
          cache.set(url, txt);
          return txt;
      // return Promise.resolve(txt)
    } else {
      var error = new Error(res.statusText || res.status);
      error.response = res;
      if (options.params && options.params.url)
        error.url = options.params.url;
      return Promise.reject(error);
    }
  })
};

var getTineyeButtons = (bot, pic, page, shareId) => 
  [
    bot.inlineButton(idButtonName.picLink, {
      url: pic
    }),
    bot.inlineButton(idButtonName.pageLink, {
      url: page
    }),
    bot.inlineButton(idButtonName.share, {
      inline: "te|" + shareId
    })
  ];
module.exports = {
  fetchTineye: (url, editMsg) => {
    var params = {url: url, sort: 'size', order: 'desc'};
    uurl = urlbase.tinEye + tools.json2query(params);
    
    return myFetch(uurl, editMsg,
      {headers:
        {
          "User-Agent": SETTINGS.userAgents[
            parseInt(Math.random()*SETTINGS.userAgents.length)
          ],
        },
        params: params
      }
    );
  },
  getTineyeButtons: getTineyeButtons,
  parseSauceNao: parseSauceNao,
  parseTineye: (res, bot, editMsg) => {
    console.log("get tineye completed");

    var tmp = res;
    var start = tmp.indexOf('match-row"');
    start = tmp.indexOf('<div class="match"', start);
    if (start == -1){
      
      if (tmp.indexOf("/faq#search_limit")>-1){
        reportToOwner.reportLimitReached("tineye", bot);
        changeProxy();
      } else 
        console.log("not found");
      return Promise.reject(new Error("not found"));
    }
    //TODO: if URL, load/head it, check if mime=pic types, say invalid url if not.
    tmp = tmp.substring( start, tmp.indexOf('</div>', start)+6);
    //console.dir(tmp);
    return new Promise ( (resolve, reject) => {
      const $ =cheerio.load(tmp);

      var siteName = $("h4").text(), 
        imgName = $("p > a").first().text(),
        highResUrl = $("p > a").attr('href'), 
        page = $("p > span").next().attr('href');
      console.log("tineyeUrls", imgName , highResUrl , page);
      //"collections"
      if (!page)
        page = highResUrl;
      var displayText = "Image source was found at: <a href=\"" + highResUrl + "\">" + imgName 
		    + "</a> from <a href=\"" + page + "\">" + siteName + "</a>\n";
      var shareId = editMsg.fileId || editMsg.url;
      var bList = getTineyeButtons(bot, highResUrl, page, shareId);
      if (!editMsg.inline_message_id)
        bList.splice(2, 0, bot.inlineButton(idButtonName.searchSauceNao, {
            callback: "sn|"+ editMsg.origFrom.id //+"|" + shareId
          }));
      var markup = bot.inlineKeyboard(tools.buttonsGridify(bList));

      analytics.track(editMsg.origFrom, "sauce_found_tineye");
      resolve([displayText, markup]);
    });
  },
  fetchSauceNao: (url, editMsg) => {
    var params = urlbase.sauceNaoParams;
    params.url = url;
    // params.api_key = SETTINGS.private.SNKey;
    uurl = urlbase.sauceNao + tools.json2query(params);
    
    return myFetch(uurl, editMsg, { params: params });
  },
  errInFetch: err => {
    console.log("errInFetch");

    if (err.name == "FetchError" || err.status != 200)
      changeProxy();
    reportToOwner.reportError(err, bot);
    if (err.response) {
      // The request was made, but the server responded with a status code
      // that falls out of the range of 2xx
      console.log("-----error.status is", err.response.status);
      console.log("-----error.headers is", err.response.headers);
      // console.log("-----error.text is", err.response.text);
      if (err.response.status && err.response.status == 429) {
        reportToOwner.reportLimitReached("sauceNao", bot);
        return [tools.getGoogleSearch(MESSAGE.reachLimitation, err.url)];
      } else
        return [MESSAGE.unknownError];
    } else {
      console.dir(err);

      console.log('-----error', err.message);
      return ["<b>Error:</b> " + err.name ];
    }
    
  }
};
