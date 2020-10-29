"use strict";

const FLOOD_SETTINGS = require("../settings/settings.js").floodProtect;
const LRU = require("lru-cache");
const userLRU = new LRU(100);
const intervalSecs = FLOOD_SETTINGS.interval;
const msgLimit = FLOOD_SETTINGS.msgLimit;
const warnMsg = FLOOD_SETTINGS.message;

module.exports = (ctx) => {
  if (!ctx.message || !ctx.from || !ctx.message.date)
    return false;
  let userId = ctx.from.id;
  let user = userLRU.get(userId);
  let now = ctx.message.date;
  let diffSecs;
  if (!user){
    diffSecs = 0;
    user = {lastTime: now, numMsgs: 1, warned: false};
    userLRU.set(userId, user);
  } else {
    diffSecs = now - user.lastTime;

    user.lastTime = now;
    user.numMsgs++;
  }
  if (diffSecs < intervalSecs){
    if (user.numMsgs > msgLimit) {
      if (!user.warned){
        ctx.reply(warnMsg);
        user.warned = true;
      }
      console.log(userId + " is flooding");
      return true; //flooding
    }
    else
      return false;
  } else {
    user.numMsgs = 2;
    // user.warned = false;
    return false;
  }
}