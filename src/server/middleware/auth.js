const prisma = require("../utils/prisma");
const { readAuthToken } = require("../modules/Auth");

async function attachCurrentUser(req, _res, next) {
  const payload = readAuthToken(req);
  if (!payload?.sub) {
    req.user = null;
    return next();
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true }
  });

  req.user = user || null;
  return next();
}

function requireAuth(req, _res, next) {
  if (!req.user) {
    const error = new Error("Please sign in to access that page.");
    error.statusCode = 401;
    return next(error);
  }

  return next();
}

module.exports = {
  attachCurrentUser,
  requireAuth
};

