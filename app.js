const { Telegraf } = require("telegraf");
var SocksProxyAgent = require("socks-proxy-agent");

const bot = new Telegraf(process.env.BOT_TOKEN, {
  agent: new SocksProxyAgent(process.env.proxy),
});
bot.on("message", (ctx) => {
  console.log(ctx.message);
  if (ctx.message.document?.file_size < 20 * 1024 * 1024) {
    bot.telegram.getFileLink(ctx.message.document.file_id).then((url) => {
      console.log(url.href);
    });
  }
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
bot.launch();
