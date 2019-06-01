"use strict";

const privateSettings = require("./private.js");

let settings = {
  botName : "reverseSearchBot",
  url: {
    sauceNao: "http://saucenao.com/search.php?",
    tinEye: "https://tineye.com/search?",
    proxyList: "https://gimmeproxy.com/api/getProxy?",
    proxyListParams: {
      anonymityLevel: 1,
      minSpeed: 10,
      protocol:"socks5",
      // type:"socks5",
      maxCheckPeriod:300,
      cookies:true,
      get:true,
      // level: "elite",
    },
    mal: "http://myanimelist.net/anime.php?",
    analUrl: "http://api.amplitude.com/httpapi?api_key=" + privateSettings.analKey,
    sauceNaoParams: {
      db: 999,
      // output_type: 2,
      testmode: 1,
      numres: 5,
      minSimilarity: 60,
      tolerance: 7
    },
    pixiv_id: "http://www.pixiv.net/member_illust.php?mode=medium&illust_id=",
    danbooru_id: "https://danbooru.donmai.us/post/show/",
    gelbooru_id: "https://gelbooru.com/index.php?page=post&s=view&id=",
    sankaku_id: "https://chan.sankakucomplex.com/post/show/",
    "anime-pictures_id": "https://anime-pictures.net/pictures/view_post/",
    imdb_id: "https://www.imdb.com/title/",
    anidb_aid: "https://anidb.net/perl-bin/animedb.pl?show=anime&aid=",
    e621_id : "https://e621.net/post/show/",
    yandere_id: "https://yande.re/post/show/",
    drawr_id: "http://drawr.net/show.php?id=",
    da_id: "https://deviantart.com/view/",
    pawoo_id: "https://pawoo.net/@",
    bcy_id: "https://bcy.net/",
    url: "",
    /* wont add:
    seiga_id
    */
  },
  id_buttonName: {
    pixiv_id: "Pixiv",
    danbooru_id: "Danbooru",
    gelbooru_id: "Gelbooru",
    sankaku_id: "Sankaku",
    "anime-pictures_id": "Anime-Pictures",
    imdb_id: "IMDb",
    anidb_aid: "AniDB",
    e621_id: "e621",
    yandere_id: "yandere",
    drawr_id: "Drawr",
    da_id: "deviantArt",
    pawoo_id: "Pawoo",
    bcy_id: "BCY",
    url: "",

    share: "↗️Forward",
    loading: "🍝",
    pageLink: "📃Source",
    picLink: "🖼️High res",
    searchSauceNao: "🎨🔍ArtSearch",
  },
  msg: {
    invalidUrl: "That doesn't look like a photo or a URL.",
    invalidForm: "That type of message is not supported yet.",
    loading: "<i>Pouring some sauce on it...</i>",
    zeroResult: "No sauce found. <i>Maybe try google instead?</i>",
    help: "Send me an image, a sticker, an image file or a GIF to find its source Right Nao.\n\n"+
          // "\n\n<i>Tip: Click the 🔍ArtSearch button if it is an artwork or cosplay, for character, show episode and artist identification.</i>"+
          "<i>If I'm in a group, reply to a media with /sauce or /source (note the slash)</i>",
    reachLimitation: "The request limit has been reached. <i>Please wait for a few minutes or use google instead</i>",
    unknownError: "<b>Unknown error occured.</b> Please report this to @dangou if it happens repeatedly.",
    invalidFileId: "<i>Invalid file id</i>",
    requestRating: "<a href=\"https://telegram.me/storebot?start=reverseSearchBot\">★ Rate this result</a>",
    keywordHelp: "Don't just click me like that. \n\n PM me a pic, GIF, a sticker, or an image file\n\n If I'm in a group, reply with /source or /sauce to find its source."
  },
  reporter: {
    events: [
      "reconnect", "reconnected", "error"
    ],  
    to: privateSettings.adminId
  },
  floodProtect: {
    message: "aaaaah, slow down...",
    interval: 10,
    msgLimit: 4
  },
  reportToOwnerSwitch: {
    reportLimitsOfSaucenao: {on: true, notify: true},
    reportError: {on: true, notify: true},
    reportFile: {on: false, notify: false}
  },
  keywords: /^(sauce|source|what\?)$/i,
  commands: ['sauce', 'source', 'sauce@reverseSearchBot', 'source@reverseSearchBot'],
  // keywords: ['sauce', 'source', 'what?'],
  private: privateSettings,
  userAgents: [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12",
  ]
};

module.exports = settings;
