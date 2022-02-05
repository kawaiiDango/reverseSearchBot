#!/usr/bin/env node

process.on("unhandledRejection", (e) => {
  console.log("unhandledRejection:");
  console.dir(e);
});

import botInit from "./bot/init.js";

botInit();
