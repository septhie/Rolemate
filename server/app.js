const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const env = require("../src/server/utils/env");
const { attachCurrentUser } = require("../src/server/middleware/auth");
const { notFoundHandler, errorHandler } = require("../src/server/middleware/errorHandler");
const reviewRoutes = require("../src/server/routes/reviews");
const feedbackRoutes = require("../src/server/routes/feedback");

const app = express();

app.use(
  cors({
    origin: env.appUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachCurrentUser);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/reviews", reviewRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
