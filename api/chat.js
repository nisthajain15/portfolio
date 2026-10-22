/**
 * Server-side chatbot proxy.
 *
 * Configure these environment variables (never put keys in frontend files):
 *   CHAT_API_KEY     required
 *   CHAT_PROVIDER    "openai" (default) or "gemini"
 *   CHAT_API_URL     OpenAI-compatible chat completions URL
 *                    examples:
 *                      https://api.groq.com/openai/v1/chat/completions
 *                      https://api.openai.com/v1/chat/completions
 *   CHAT_MODEL       model id from your class notes
 *
 * Ask your instructor which provider was taught, then set the matching values
 * in Vercel Project Settings → Environment Variables (and in a local .env).
 */

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise(function (resolve, reject) {
    let raw = "";
    req.on("data", function (chunk) {
      raw += chunk;
    });
    req.on("end", function () {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function systemPrompt(portfolioContext) {
  return [
    "You are a helpful assistant for a student portfolio website.",
    "Answer only from the portfolio JSON below. If a detail is missing, say it is not listed.",
    "Do not invent jobs, awards, repository URLs, or personal facts.",
    "Keep answers concise.",
    "",
    "Portfolio JSON:",
    portfolioContext || "{}",
  ].join("\n");
}

async function callOpenAICompatible(messages, portfolioContext) {
  const url = process.env.CHAT_API_URL;
  const model = process.env.CHAT_MODEL;
  const key = process.env.CHAT_API_KEY;
  if (!url || !model) {
    const err = new Error(
      "Set CHAT_API_URL and CHAT_MODEL to match the API taught in class."
    );
    err.status = 503;
    throw err;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + key,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: "system", content: systemPrompt(portfolioContext) }].concat(
        messages
      ),
      temperature: 0.4,
    }),
  });

  const data = await response.json().catch(function () {
    return {};
  });
  if (!response.ok) {
    const err = new Error(
      data.error && data.error.message
        ? data.error.message
        : "The chat provider returned an error."
    );
    err.status = 502;
    throw err;
  }
  const reply =
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content;
  return reply || "";
}

async function callGemini(messages, portfolioContext) {
  const model = process.env.CHAT_MODEL || "gemini-2.0-flash";
  const key = process.env.CHAT_API_KEY;
  const url =
    process.env.CHAT_API_URL ||
    "https://generativelanguage.googleapis.com/v1beta/models/" +
      model +
      ":generateContent?key=" +
      encodeURIComponent(key);

  const contents = messages.map(function (item) {
    return {
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content }],
    };
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt(portfolioContext) }] },
      contents: contents,
    }),
  });
  const data = await response.json().catch(function () {
    return {};
  });
  if (!response.ok) {
    const err = new Error(
      (data.error && data.error.message) || "The Gemini API returned an error."
    );
    err.status = 502;
    throw err;
  }
  const reply =
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;
  return reply || "";
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "Use POST." }));
    return;
  }

  if (!process.env.CHAT_API_KEY) {
    res.statusCode = 503;
    res.end(
      JSON.stringify({
        error:
          "Chatbot credentials are not configured. Add CHAT_API_KEY (and CHAT_API_URL / CHAT_MODEL) in Vercel environment variables. Do not put the key in frontend code.",
      })
    );
    return;
  }

  try {
    const body = await readBody(req);
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const safeMessages = messages
      .filter(function (item) {
        return item && (item.role === "user" || item.role === "assistant") && item.content;
      })
      .map(function (item) {
        return { role: item.role, content: String(item.content).slice(0, 4000) };
      })
      .slice(-12);

    if (!safeMessages.length) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "Send at least one user message." }));
      return;
    }

    const provider = (process.env.CHAT_PROVIDER || "openai").toLowerCase();
    const reply =
      provider === "gemini"
        ? await callGemini(safeMessages, body.portfolioContext)
        : await callOpenAICompatible(safeMessages, body.portfolioContext);

    res.statusCode = 200;
    res.end(JSON.stringify({ reply: reply }));
  } catch (error) {
    res.statusCode = error.status || 500;
    res.end(
      JSON.stringify({
        error: error.message || "Unexpected chatbot error.",
      })
    );
  }
};
