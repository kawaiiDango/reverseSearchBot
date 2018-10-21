"use strict";

const fetch = require('node-fetch');
const SETTINGS = require("../settings/settings.js");
const reportToOwner = require("./reportToOwner.js");

let ip = '0.0.0.0'
let ctr = 887
let bot;

const init = (botp) => {
    bot = botp;
    fetch('http://api.ipify.org/')
    .then(res => res.text())
    .then( res => { ip = res } )
    .then(bot.telegram.getMe()
        .then(botInfo => {
            SETTINGS.botName = botInfo.username;
            }
        )
    )
};

const track = (msgFrom, eventType, eventProps) => {
    if (!msgFrom)
        return;
    const uniq = SETTINGS.botName + (new Date().getTime()) + '' + ctr++;
    const lang = msgFrom.language_code || 'undefined';

    //user_properties
    const tdata = {platform: SETTINGS.botName, ip: ip, event_type: eventType,
        event_properties: eventProps, user_id: msgFrom.id,
        user_properties: msgFrom, insert_id: uniq, language: lang};
    fetch(SETTINGS.url.analUrl, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: "POST",
        body: "event=[" + JSON.stringify(tdata) + "]"
    })
    .catch(res => {
        reportToOwner.unsupportedData(
            {eventType:eventType, eventProps:eventProps, res:res}, bot);
        } );
};

module.exports = {init:init, track:track};