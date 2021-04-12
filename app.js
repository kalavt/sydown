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

var reply = function (ctx, msg) {
  const max_size = 4096;
  var amount_sliced = msg.length / max_size;
  var start = 0;
  var end = max_size;
  var message;
  for (let i = 0; i < amount_sliced; i++) {
    message = msg.slice(start, end);
    console.log(message);
    ctx.reply(message);
    start = start + max_size;
    end = end + max_size;
  }
};

bot.on("message", (ctx) => {
  if (ctx.message.text) {
    handle_text(ctx);
    return;
  }
  if (ctx.message.document) {
    handle_document(ctx);
    return;
  }
  reply(ctx, "unsupported message:" + JSON.stringify(ctx.message));
});

var download = function (url, dest, cb) {
  var opts = URL.parse(url);
  opts.agent = agent;
  https.get(opts, (res) => {
    res.pipe(fs.createWriteStream(dest));
    cb();
  });
};

function handle_baidu(ctx) {
  var url_regex = /链接：(?<grp0>[^ ]+)/gi;
  var code_regex = /提取码：(?<grp1>[\w]{4})/gi;
  if (ctx.message.text) {
    var url_match = Array.from(
      ctx.message.text.matchAll(url_regex),
      (m) => m[1]
    );
    var code_match = Array.from(
      ctx.message.text.matchAll(code_regex),
      (m) => m[1]
    );
    if (url_match.length > 0) {
      url_match.forEach((item, index) => {
        var cmd = `transfer ${item} ${code_match[index]}`;
        execBaiduPcsGO(ctx,cmd);
      });
      return true;
    }
  }
}

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
  console.log(`receive message: ${ctx.message.text}`);

  if (handle_baidu(ctx)) {
    reply(ctx, "handled by baidu");
    return;
  }
  // disable run..
  var msg = ctx.message.text.replace("run", "");
  execBaiduPcsGO(ctx, msg);
}

function execBaiduPcsGO(ctx,cmd) {
  exec(process.env.cmd_path + " " + cmd, (error, stdout, stderr) => {
    if (stdout && stdout.trim("\n")) {
      reply(ctx, stdout);
    }
  });
}

bot.start((ctx) => reply(ctx, "Welcome use sydown bot"));
bot.help((ctx) =>
  reply(ctx, "forward me any type file link to enable download")
);

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
bot.launch();

exports.handle_baidu = handle_baidu;
