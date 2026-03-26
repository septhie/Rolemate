const crypto = require("crypto");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashIp(ip, secret = "rolemate-ip") {
  return sha256(`${secret}:${ip || "unknown"}`);
}

module.exports = {
  sha256,
  hashIp
};

