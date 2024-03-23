import fetch from "node-fetch";
import { SocksProxyAgent } from "socks-proxy-agent";
import HttpsProxyAgent from "https-proxy-agent";
import { exec } from "child_process";
// const proxyLists = require('proxy-lists');
import { LRUCache } from "lru-cache";
const cache = new LRUCache({ max: 200, ttl: 1000 * 60 * 60 * 24 });

import settings from "../settings/settings.js";
import privateSettings from "../settings/private.js";
const urlbase = settings.url;
const MESSAGE = settings.msg;
import { reportError } from "./reportToOwner.js";
import { json2query } from "../tools/tools.js";
import track from "./analytics.js";
let proxy = { idx: 0, lastReqTime: 0, agent: null, perma: null };

if (privateSettings.socksProxyUrls && privateSettings.socksProxyUrls[0])
  proxy.perma = new SocksProxyAgent(privateSettings.socksProxyUrls[0]);

const changeProxy = async () => {
  const now = new Date().getTime();
  if (now - proxy.lastReqTime < 30 * 1000)
    //allow only one proxy req within x mins
    return;
  proxy.idx = (proxy.idx + 1) % privateSettings.socksProxyUrls.length;
  let url = privateSettings.socksProxyUrls[proxy.idx];
  if (url) {
    if (url.startsWith("http")) proxy.agent = new HttpsProxyAgent(url);
    else if (url.startsWith("socks")) proxy.agent = new SocksProxyAgent(url);
  } else proxy.agent = null;
  proxy.lastReqTime = now;
  /*
  const gettingProxies = proxyLists.getProxies(urlbase.proxyListParams);

  gettingProxies.on('data', function(proxies) {
    if (proxies && proxies.length && proxy.agent == null){
      
      const res = proxies[0];
      console.dir(res);
      const protocol = res.protocols[0];
      const url = protocol + "://" +res.ipAddress+ ":" + res.port;
      if (protocol == 'http'){
        proxy.agent = new HttpsProxyAgent(url);
      } else if (protocol.startsWith('socks')){
        proxy.agent = new SocksProxyAgent(url);
      } //else stay null
      console.log("proxy set to " + url);
    }
    
  });
*/
  const options = {};
  options.agent = proxy.perma;

  const rawResp = await fetch(
    urlbase.proxyList + json2query(urlbase.proxyListParams),
    options
  );
  const res = await rawResp.json();
  if (res.ip && res.port) {
    const protocol = res.protocol || res.type;
    url = protocol + "://" + res.ip + ":" + res.port;
    if (protocol == "http") {
      proxy.agent = new HttpsProxyAgent(url);
    } else if (protocol.startsWith("socks")) {
      proxy.agent = new SocksProxyAgent(url);
    } //else stay null
    console.log("proxy set to " + url);
  } else {
    console.log("proxy not set");
    console.dir(res);
  }
};

const myFetch = async (url, editMsg, options) => {
  const hit = cache.get(url);

  if (hit && editMsg && editMsg.origFrom) {
    track(editMsg.origFrom, "cache_hit");
    return hit;
  }

  if (options == null) options = {};
  if (url.indexOf("saucenao") > -1) options.agent = proxy.perma;
  else options.agent = proxy.agent;

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
  const params = urlbase.sauceNaoParams;
  params.url = url;
  const uurl = urlbase.sauceNao + json2query(params);

  return myFetch(uurl, editMsg, { params: params });
}

export function errInFetch(err, bot) {
  console.log("errInFetch");

  // if (err.name == "FetchError" || err.status != 200)
  // changeProxy();
  reportError(err, bot);
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
      return new Error(MESSAGE.reachLimitation);
    }
  }
  return err;
}
