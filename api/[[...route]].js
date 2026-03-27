const serverless = require("serverless-http");
const app = require("../server/app");

module.exports = serverless(app);
module.exports.config = {
  maxDuration: 60
};
