import { socksDispatcher } from "fetch-socks";
import { exec } from "child_process";
import { LRUCache } from "lru-cache";

import {
  privateSettings,
  urls,
  sauceNaoParams,
  msgs,
  userAgent,
} from "../settings/settings.js";
import { json2query } from "../tools/tools.js";
import { track } from "./analytics.js";

const dispatcher = socksDispatcher({
  type: 5,
  host: privateSettings.socksProxyHost,
  port: privateSettings.socksProxyPort,
});

const cache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 * 24 });
const myFetch = async (url, editMsg, options) => {
  const hit = cache.get(url);

  if (hit && editMsg && editMsg.origFrom) {
    track(editMsg.origFrom, "cache_hit");
    return hit;
  }
  options.dispatcher = dispatcher;
  options.headers = {
    "User-Agent": userAgent,
  };

  const res = await fetch(url, options);
  if (res.status >= 200 && res.status < 300) {
    const txt = res.text();
    cache.set(url, txt);

    return txt;
  } else {
    const error = new Error(res.statusText || res.status);
    error.response = res;
    if (options.params && options.params.url) error.url = options.params.url;
    throw error;
  }
};

export function fetchSauceNao(url, editMsg) {
  const params = sauceNaoParams;
  params.url = url;
  const uurl = urls.sauceNao + json2query(params);

  return myFetch(uurl, editMsg, { params: params });
}

export function errInFetch(err) {
  console.log("errInFetch");

  if (err.response) {
    // The request was made, but the server responded with a status code
    // that falls out of the range of 2xx
    console.log("-----error.status is", err.response.status);
    if (
      err.response.status &&
      (err.response.status == 429 || err.response.status == 403)
    ) {
      let now = Date.now();
      if (
        now - proxy.lastReqTime > 100 * 1000 &&
        privateSettings.changeProxyCommand
      ) {
        proxy.lastReqTime = now;
        exec(privateSettings.changeProxyCommand, (err, stdout, stderr) => {
          if (stdout) console.log(stdout);
          else if (stderr) console.log(stderr);
        });
      }
      return new Error(msgs.reachLimitation);
    }
  }
  return err;
}
