var privateSettings = require("./private.js");

var settings = {
  botName : "reverseSearchBot",
  url: {
    sauceNao: "https://saucenao.com/search.php?",
    analUrl: "http://api.amplitude.com/httpapi?api_key=" + privateSettings.analKey,
    sauceNaoParams: {
      db: 999,
      output_type: 2,
      testmode: 1,
      numres: 5,
      minSimilarity : 56
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

    share: "↗️Share",
    loading: "🍝",
    pageLink: "📃Source",
    picLink: "🖼️High res",
    searchSauceNao: "🔍SauceNao",
  },
  msg: {
    invalidUrl: "That doesn't look like a photo or a URL.",
    invalidForm: "That type of message is not supported yet.",
    loading: "<i>Pouring some sauce on it...</i>",
    zeroResult: "No sauce found. <i>Maybe try google instead?</i>",
    help: "Send me an image, a sticker, an image file or an image URL to find its source Right Nao.",
    tooManyRequests: "Too many requests. Please send one by one and take time between requests.",
    reachLimitation: "The request limitation has been reached. Please wait for a few minutes.",
    unknownError: "<b>Unknown error occured.</b> Please contact @dangou if this happens repeatedly.",
    invalidFileId: "<i>Invalid file id</i>",
    requestRating: "<a href=\"https://telegram.me/storebot?start=" + this.botName + "\">★ Rate this bot</a>",
    keywordHelp: "Dont just click me like that. \n\nReply to a pic, a sticker, or an image file with /source or /sauce to find its source."
  },
  moduleSwitch: {
    // reporter: {on: false, notify: false},
    flooder: {on: true, notify: true}
  },
  reporter: {
    events: [
      "reconnect", "reconnected", "error"
    ],  
    to: privateSettings.adminId
  },
  flooder: {
    message_: "DO NOT EDIT IN THIS PROPERTY. GOTO settings.msg.tooManyRequests",
    interval: 5,
    numMsgs: 10
  },
  reportToOwnerSwitch: {
    reportLimitsOfSaucenao: {on: true, notify: false},
    reportRequestError: {on: true, notify: true},
    reportFileUrl: {on: true, notify: false}
  },
  keywords: ["sauce", "/sauce", "#sauce", "source", "/source", "#source"],
  private: privateSettings,
  userAgents: [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/600.7.12 (KHTML, like Gecko) Version/8.0.7 Safari/600.7.12",
  ]
};

settings.flooder.msg = settings.msg.tooManyRequests;
module.exports = settings;
