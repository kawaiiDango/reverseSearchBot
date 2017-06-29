# TeleSaucenao_bot
Search the origin of image through Telegram bot using SauceNao api(by Xamayon, https://saucenao.com). Telegram bot is connected through telebot by kosmodrey(https://github.com/kosmodrey/telebot).

# Preparation
- 1. Install node modules in package.json.
- 2. Get your own tokens from telegram bot and SauceNao(by Xamayon).
- 3. Update settings/private.js for the api keys and tokens required.

# How to start
## Settings
- settings/settings.js
  - You can set below
  - 1. Messages for each stage of process which will be printed at the chat room.
  - 2. SauceNao api parameters. Please refer documents at SauceNao webpage.
  - 3. Prefix for each homepages. This will added to the id-s obtained from response of SauceNao Api.

## Run server.js
- This will connect to the telegram server and let your own telegram bot work along the code.

## /start && /help

- In the chat room, you can access help desk with "/start" and "/help" command.

## Search
- Send a photo and you will get 7(default setting) candidates of the origin.
- You can also do that with image url.

## Tools
- tools/tools.js
  - regex for detecting url among text.

## Structure
- CASE1. Send photo/sticker/image file.
  - The photo will be sent to the telegram server and your bot will get the url of the photo from telegram server. Then bot will send request to SauceNao with the url. Finally, the results gotten from Saucenao will be printed as the message to the chat room.
- CASE2. Send image url.
  - Same as CASE1 except sending photo to the telegram server to get the url of it.

## Modules in telebot
- flooder
  - Telebot module for preventing spam messages. The settings for this is in flooder property of settings.settings.js. Please refer to the documents at telebot(the url at the top). "modules/flooder.js" is modified version which converted all es6 expressions to the version below.
- report
  - Telebot module for report the status of the bot which triggered by the events
  - The settings for this is in report property of settings.settings.js. Please refer to the documents at telebot(the url at the top). "modules/report.js" is modified version which converted all es6 expressions to the version below..

## Aware
- SauceNao api has limitations on search frequency per day. Consider pay for upgrade your account at SauceNao.