import { floodProtect } from "../settings/settings.js";
import { LRUCache } from "lru-cache";
const userLRU = new LRUCache({ max: 100 });

export const isFlooding = (ctx) => {
  if (!ctx.message || !ctx.from || !ctx.message.date) return false;
  let userId = ctx.from.id;
  let user = userLRU.get(userId);
  let now = ctx.message.date;
  let diffSecs;
  if (!user) {
    diffSecs = 0;
    user = { lastTime: now, numMsgs: 1, warned: false };
    userLRU.set(userId, user);
  } else {
    diffSecs = now - user.lastTime;

    user.lastTime = now;
    user.numMsgs++;
  }
  if (diffSecs < floodProtect.interval) {
    if (user.numMsgs > floodProtect.msgLimit) {
      if (!user.warned) {
        ctx.reply(floodProtect.message);
        user.warned = true;
      }
      console.log(userId + " is flooding");
      return true; //flooding
    } else return false;
  } else {
    user.numMsgs = 2;
    // user.warned = false;
    return false;
  }
};
