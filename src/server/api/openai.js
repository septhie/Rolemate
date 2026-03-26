const OpenAI = require("openai");
const env = require("../utils/env");
const { devLog } = require("../utils/logger");

let client;

function getClient() {
  if (!env.openAiApiKey) {
    return null;
  }

  if (!client) {
    client = new OpenAI({
      apiKey: env.openAiApiKey,
      timeout: 30000
    });
  }

  return client;
}

function extractJsonPayload(content) {
  if (!content) {
    throw new Error("Empty model response");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw error;
  }
}

async function executeWithRetry(task, runContext) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === 0) {
        runContext.retriesTriggered += 1;
        devLog("api-retry", { message: error.message });
      }
    }
  }

  throw lastError;
}

async function callOpenAIJson({
  taskName,
  systemPrompt,
  userPrompt,
  temperature = 0.2,
  fallback,
  runContext
}) {
  const openai = getClient();

  if (!openai) {
    // Local fallback keeps the prototype usable in development even before an API key is configured.
    return fallback ? fallback() : {};
  }

  let result;

  try {
    result = await executeWithRetry(async () => {
      const completion = await openai.chat.completions.create({
        model: env.openAiModel,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      runContext.apiCallsMade += 1;
      runContext.usage.push({
        taskName,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      });

      return extractJsonPayload(completion.choices?.[0]?.message?.content || "");
    }, runContext);
  } catch (error) {
    if (fallback) {
      return fallback(error);
    }
    throw error;
  }

  devLog("openai-json", { taskName, result });
  return result;
}

async function callOpenAIText({
  taskName,
  systemPrompt,
  userPrompt,
  temperature = 0.3,
  fallback,
  runContext
}) {
  const openai = getClient();

  if (!openai) {
    return fallback ? fallback() : "";
  }

  let result;

  try {
    result = await executeWithRetry(async () => {
      const completion = await openai.chat.completions.create({
        model: env.openAiModel,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      runContext.apiCallsMade += 1;
      runContext.usage.push({
        taskName,
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      });

      return completion.choices?.[0]?.message?.content || "";
    }, runContext);
  } catch (error) {
    if (fallback) {
      return fallback(error);
    }
    throw error;
  }

  devLog("openai-text", { taskName, result });
  return result;
}

module.exports = {
  callOpenAIJson,
  callOpenAIText
};
