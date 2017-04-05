var moduleSwitch = require("../settings/settings.js").moduleSwitch;

// source: https://github.com/kosmodrey/telebot/
// modified by Frank Kim for compatibility under es6

/*
  Name: Report
  Description: Reports events (and their data) to user list.
  Module options: {
    report: {
      events: [<event list>]
      to: [<id list>]
    }
  },
  Method options: {
    skipReport: true // Skips report
  }
*/

'use strict';

module.exports = (bot, cfg) => {

  // Read bot config data
  var opt = cfg.report;

  // If no module options
  if (typeof opt != 'object')
    return console.error('[report] no config data');

  // Get lists
  var toList = Array.isArray(opt.to) ? opt.to : [];
  var eventList = Array.isArray(opt.events) ? opt.events : [];

  // Check lists
  if (!toList.length)
    return console.error('[report] no user list');
  if (!eventList.length)
    return console.error('[report] no event list');

  // Create events handler
  bot.on(eventList, function(event, props, info) {
    event = event || {};

    // Skip event with "skipReport: true" option key
    if (
      Object.prototype.toString.call(event) == '[object Arguments]' &&
      (Array.prototype.slice.call(event).slice(-1)[0]).skipReport === true
    ) return;

    var type = info.type;
    var prefix = type.split('.')[0];

    // Stringify object data
    var jsonData = s(JSON.stringify(event, (k, v) => {
      return v.value instanceof Buffer ? '[Buffer]' : v;
    }));


    // Send to every user in list
    for (var i = 0; i < toList.length; i++) {
      var id = toList[i];

      if (prefix == 'error') {

        // Error event
        var data = event.data;
        var error = event.error;
        // { data, error } = event;

        bot.sendMessage(id,
          `👤 <b>User:</b> ${ data.chat.id } (${ data.chat.id })\n` +
          `⚠ <b>Error:</b> ${ error.message || error }\n` +
          `${ error.stack ? `🚧 <b>Stack:</b>\n${ s(error.stack) }\n` : '' }` +
          `⏰ <b>Event:</b> ${ type }\n` +
          `💾 <b>Data:</b> ${ jsonData }`,
          { parse: 'html', skipReport: true }
        );

      } else {

        // Another type of event
        bot.sendMessage(id,
          `⏰ <b>Event:</b> ${ type }\n` +
          (jsonData && jsonData != '{}' ? `💾 <b>Data:</b> ${ jsonData }` : ''),
          { parse: 'html', skipReport: true, notify: moduleSwitch.report.notify }
        );

      }

    }

  });

};

// Safe string function
function s(str) {
  return String(str).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
