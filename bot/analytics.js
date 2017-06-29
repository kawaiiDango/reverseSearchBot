const fetch = require('node-fetch');
var SETTINGS = require("../settings/settings.js");
var reportToOwner = require("./reportToOwner.js");

var ip = '0.0.0.0'
var ctr = 887
var bot;

var init = (botp) => {
    bot = botp;
    fetch('http://api.ipify.org/')
    .then(res => res.text())
    .then( res => { ip = res } )
    .then(bot.getMe()
        .then(res => {
            SETTINGS.botName = res.username;
            }
        )
    )
};

var track = (msgFrom, eventType, eventProps) => {
    var uniq = SETTINGS.botName + (new Date().getTime()) + '' + ctr++;
    var lang = msgFrom.language_code || 'undefined';

    //user_properties
    var tdata = {platform: SETTINGS.botName, ip: ip, event_type: eventType,
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