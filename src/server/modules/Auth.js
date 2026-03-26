const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../utils/env");

const AUTH_COOKIE_NAME = "rolemate_auth";

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function signAuthToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: "7d"
  });
}

function setAuthCookie(res, user) {
  const token = signAuthToken(user);
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.nodeEnv === "production"
  });
}

function readAuthToken(req) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    return null;
  }
}

module.exports = {
  AUTH_COOKIE_NAME,
  hashPassword,
  comparePassword,
  setAuthCookie,
  clearAuthCookie,
  readAuthToken
};

