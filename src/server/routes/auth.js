const express = require("express");
const prisma = require("../utils/prisma");
const asyncHandler = require("../utils/asyncHandler");
const { hashPassword, comparePassword, setAuthCookie, clearAuthCookie } = require("../modules/Auth");

const router = express.Router();

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password || password.length < 8) {
      const error = new Error("Use a valid email and a password with at least 8 characters.");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      const error = new Error("An account with that email already exists.");
      error.statusCode = 409;
      throw error;
    }

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password)
      },
      select: { id: true, email: true }
    });

    setAuthCookie(res, user);
    res.status(201).json({ user });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      const error = new Error("Incorrect email or password.");
      error.statusCode = 401;
      throw error;
    }

    setAuthCookie(res, user);
    res.json({ user: { id: user.id, email: user.email } });
  })
);

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.get("/me", (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

