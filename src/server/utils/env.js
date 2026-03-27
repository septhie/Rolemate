const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(process.cwd(), ".env") });

const env = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "development-jwt-secret",
  cookieSecret: process.env.COOKIE_SECRET || "development-cookie-secret",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  appUrl: process.env.APP_URL || "http://localhost:3000",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000",
  nodeEnv: process.env.NODE_ENV || "development"
};

module.exports = env;
