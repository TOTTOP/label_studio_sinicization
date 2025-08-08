const {
  spawn
} = require("child_process");

spawn(
  "npx",
  [
    "webpack",
    "serve",
    "--config",
    "webpack.standalone.config.js",
    "--progress",
    "--color"
  ], {
    stdio: "inherit",
    shell: true
  }
);
