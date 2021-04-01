const { Telegraf } = require("telegraf");
var fs = require("fs");
const Path = require("path");
var https = require("https");
var URL = require("url");
const { exec } = require("child_process");
var HttpsProxyAgent = require("https-proxy-agent");
var agent = new HttpsProxyAgent(process.env.proxy);

const bot = new Telegraf(process.env.BOT_TOKEN, {
  telegram: {
    agent: agent,
  },
});

bot.on("message", (ctx) => {
  if (ctx.message.text) {
    handle_text(ctx);
    return;
  }
  if (ctx.message.document) {
    handle_document(ctx);
    return;
  }
  ctx.reply("unsupported message:" + JSON.stringify(ctx.message));
});

var download = function (url, dest, cb) {
  var opts = URL.parse(url);
  opts.agent = agent;
  https.get(opts, (res) => {
    res.pipe(fs.createWriteStream(dest));
    cb();
  });
};

function handle_document(ctx) {
  if (ctx.message.document?.file_size < 20 * 1024 * 1024) {
    bot.telegram.getFileLink(ctx.message.document.file_id).then((url) => {
      console.log(`download ${url.href}`);
      var file = Path.resolve(
        process.env.download_folder ?? __dirname,
        ctx.message.document.file_name
      );
      download(url.href, file, () => {
        console.log("done");
      });
    });
  }
}

function handle_text(ctx) {
  var cmd = ctx.message.text;
  if (cmd.startsWith("/")) {
    cmd = cmd.replace("/", "./BaiduPCS-Go ");
  }
  exec(cmd, (error, stdout, stderr) => {
    if (stdout && stdout.trim("\n")) {
      ctx.reply(stdout);
    }
  });
}

bot.start((ctx) => ctx.reply("Welcome use sydown bot"));
bot.help((ctx) =>
  ctx.reply("forward me any type file link to enable download")
);

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
bot.launch();
