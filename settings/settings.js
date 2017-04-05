var settings = {
  url: {
    sauceNao: "https://saucenao.com/search.php",
    sauceNaoParams: {
      db: 999,
      output_type: 2,
      testmode: 1,
      numres: 7
    },
    pixiv_id: "http://www.pixiv.net/member_illust.php?mode=medium&illust_id=",
    danbooru_id: "https://danbooru.donmai.us/post/show/",
    gelbooru_id: "https://gelbooru.com/index.php?page=post&s=view&id=",
    sankaku_id: "https://chan.sankakucomplex.com/post/show/",
    "anime-pictures_id": "https://anime-pictures.net/pictures/view_post/",
    imdb_id: "https://www.imdb.com/title/"
  },
  id_buttonName: {
    pixiv_id: "View on Pixiv",
    danbooru_id: "View on Danbooru",
    gelbooru_id: "View on Gelbooru",
    sankaku_id: "View on Sankaku",
    "anime-pictures_id": "View on Anime-Pictures",
    imdb_id: "View on IMDb"
  },
  msg: {
    invalidUrl: "*<<Error>>*\nInvalid url. Please check your url.",
    invalidForm: "*<<Error>>*\nInvalid form. Please check if you sent a non-photo file or your photo is sent as file.\n혹시 사진을 파일로 보내지 않으셨나요? 사진보내기로 하셨는지 확인해주세요\nイメージ以外はしょりできませんから。",
    loading: "*<<Loading>>*\nImage is now in processing...\n이미지 처리중입니다.\nイメージ処理中…",
    zeroResult: "*<<Result>>*\nNo results.\n결과가 없습니다.\n検索結果がありませんわ。",
    startResult: "*<<Result>>*\nPrint start.\n결과출력을 시작합니다.\n結果を出歴するから。",
    endResult: "*<<Result>>*\nPrint End.\n출력이 종료되었습니다.\n出歴終了！",
    help: "Send me an image or an image URL to find your SauceRightNao.",
    tooManyRequests: "*<<Error>>*\nToo many requests. Please send one by one and take a time between requests.\n너무 많은 요청을 보내셨네요. 한번에 한 장씩 보내주세요.\n一回にあんなに多い処理はできないわ。一回に一枚づつ、ね？",
    reachLimitation: "*<<Error>>*\nThe request limitation has been reached. Please wait for a moment and if the same error occurs, contact us.\n일일 요청한도를 초과하였습니다. 잠시 기다려주시고, 동일한 오류가 발생하면 연락주세요.\n一日要請限度を超えました。しばらくお待ちください。",
    unknownError: "*<<Error>>*\nUnknown error occured. Please contact us if the same error appears repeatedly.\n알 수없는 오류가 발생하였습니다. 동일한 오류가 지속적으로 발생할 경우 연락주세요.\n何らかのエラーで処理できません。連絡お願いします。",
    requestRating: "[★ Rate](https://telegram.me/storebot?start=reverseSearchBot)"
  },
  moduleSwitch: {
    report: {on: false, notify: false},
    flooder: {on: true, notify: true}
  },
  report: {
    condition: [
      "*", "reconnect", "reconnected", "disconneced", "error"
    ],
    receiver_id: "YOU_SHOULD_OVERWRITE_WITH_YOUR_OWN_TELEGRAM_ID(NUM_TYPE)"
  },
  flooder: {
    msg: "DO NOT EDIT IN THIS PROPERTY. GOTO settings.msg.tooManyRequests",
    interval: 5,
    numMsgs: 10
  },
  reportToOwnerSwitch: {
    reportLimitsOfSaucenao: {on: true, notify: false},
    reportRequestError: {on: true, notify: true},
    reportFileUrl: {on: true, notify: false}
  }
};

settings.flooder.msg = settings.msg.tooManyRequests;
module.exports = settings;
