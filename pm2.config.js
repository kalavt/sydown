module.exports = {
    apps: [
      {
        name: "sydown",
        script: "app.js",
        node_args: "-r dotenv/config",
        log_file: "output.log",
        time: true,
      },
    ],
  };
  