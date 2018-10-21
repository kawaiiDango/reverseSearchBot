"use strict";

const FLOOD_SETTINGS = require("../settings/settings.js").floodProtect;

const userList = [];
const listSize = 100;
const intervalSecs = FLOOD_SETTINGS.interval;
const msgLimit = FLOOD_SETTINGS.msgLimit;
const warnMsg = FLOOD_SETTINGS.message;

module.exports = (ctx) => {
  if (!ctx.message || !ctx.from || !ctx.message.date)
    return false;
  let userId = ctx.from.id;
  let user = userList[userId];
  let now = ctx.message.date;
  let diffSecs;
  if (!user){
    diffSecs = 0;
    user = {lastTime: now, numMsgs: 1};
    userList[userId] = user;
  } else {
    diffSecs = now - user.lastTime;

    user.lastTime = now;
    user.numMsgs++;
  }
  if (diffSecs < intervalSecs){
    if (user.numMsgs > msgLimit) {
      ctx.reply(warnMsg);
      return true; //flooding
    }
    else
      return false;
  }
  else {
    user.numMsgs = 0;
    //trim
    if (userList.length > listSize)
      userList.splice(0, userList.length - listSize);
    return false;
  }
}