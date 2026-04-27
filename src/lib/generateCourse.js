import { fetchYouTubeVideos } from "./fetchYoutube";
import { fetchPapers } from "./fetchPapers";

const STRUCTURE_PROMPT = `You are an expert curriculum designer. Given a topic, create a structured course. Respond with ONLY valid JSON, no explanation, no markdown.
{"title":"Course title","description":"2 sentence description","level":"Beginner/Intermediate/Advanced","estimatedHours":10,"modules":[{"id":"module_1","title":"Module title","summary":"2 sentence summary","youtubeQueries":["specific query"],"paperTopics":["topic 1"],"concepts":["c1","c2","c3","c4"],"quiz":[{"question":"Q","options":["A","B","C","D"],"correctIndex":0,"explanation":"Why"}]}]}
Generate 6-8 modules with 3 quiz questions each. 1 specific youtube query per module. 1 paperTopic per module. ONLY JSON.`;

const LESSONS_PROMPT = `You are an expert teacher. For EACH module listed by the user, write lesson content.
Respond with a JSON object ONLY (no markdown) in this exact shape:
{"items":[{"moduleId":"module_1","lessons":[{"heading":"...","text":"2 short paragraphs max per section."},{"heading":"...","text":"..."},{"heading":"...","text":"..."}]}]}
Each module needs exactly 3 lessons. Keep text concise so JSON stays valid. Escape quotes inside strings as \\".`;

Sconst wait = (ms) => new Promise((r) => setTimeout(r, ms));

function getRetryDelayMs(errorMessage = "", attempt = 0) {
  const explicitSeconds = errorMessage.match(/try again in\s+([\d.]+)s/i);
  if (explicitSeconds?.[1]) {
    return Math.ceil(Number(explicitSeconds[1]) * 1000) + 500;
  }
  const base = 1500;
  return base * Math.pow(2, attempt);
}

    async function callGroq(
  apiKey,
  systemPrompt,
  userMessage,
  maxTokens,
  model = "llama-3.3-70b-versatile",
  { jsonObject = false, temperature = 0.5 } = {}
) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
      ...(jsonObject ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    let message = "Groq request failed.";
    try {
      const err = await res.json();
      message = err.error?.message || message;
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {}
    }
    throw new Error(`${res.status}: ${message}`);
  }
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

async function callGroqWithRetry(
  apiKey,
  systemPrompt,
  userMessage,
  maxTokens,
  model,
  options = {}
) {
  const maxAttempts = 3;
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await callGroq(apiKey, systemPrompt, userMessage, maxTokens, model, options);
    } catch (error) {
      lastError = error;
      const message = String(error?.message || "");
      const isRateLimit = message.includes("Rate limit reached") || message.includes("429");
      if (!isRateLimit || attempt === maxAttempts - 1) break;
      const delay = getRetryDelayMs(message, attempt);
      await wait(delay);
    }
  }

  throw lastError;
}

function stripTrailingCommas(s) {
  let out = s;
  for (let i = 0; i < 5; i++) {
    const next = out.replace(/,(\s*[}\]])/g, "$1");
    if (next === out) break;
    out = next;
  }
  return out;
}

function extractBalancedJSON(text) {
  const s = text.trim();
  const idx = s.search(/[\[{]/);
  if (idx === -1) return null;
  let depth = 0;
  let inString = false;
  let esc = false;
  for (let i = idx; i < s.length; i++) {
    const c = s[i];
    if (esc) {
      esc = false;
      continue;
    }
    if (inString) {
      if (c === "\\") esc = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) return s.slice(idx, i + 1);
    }
  }
  return null;
}

function closeTruncatedJSON(s) {
  let fixed = stripTrailingCommas(s);
  fixed = fixed.replace(/,?\s*"[^"]*$/, "");
  fixed = fixed.replace(/,?\s*$/, "");
  const stack = [];
  let inString = false;
  let esc = false;
  for (const ch of fixed) {
    if (esc) {
      esc = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") esc = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }
  return fixed + stack.reverse().join("");
}

function parseJSON(raw) {
  let text = raw
    .replace(/^\uFEFF/, "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const attempts = [text, extractBalancedJSON(text), text && closeTruncatedJSON(text)].filter(
    Boolean
  );

  for (const chunk of attempts) {
    const candidates = [chunk, stripTrailingCommas(chunk)];
    for (const c of candidates) {
      try {
        return JSON.parse(c);
      } catch {
        const balanced = extractBalancedJSON(c);
        if (balanced && balanced !== c) {
          try {
            return JSON.parse(stripTrailingCommas(balanced));
          } catch {}
        }
      }
    }
  }

  throw new Error("Could not parse JSON response from the AI. Try generating again.");
}

export async function generateCourse(topic, onProgress = () => {}) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY in .env");

  onProgress("🤖 Generating course structure...");
  let course;
  try {
    const structureRaw = await callGroqWithRetry(
      apiKey,
      STRUCTURE_PROMPT,
      "Create a full course for: " + topic,
      3200,
      "llama-3.1-8b-instant",
      { jsonObject: true, temperature: 0.35 }
    );
    course = parseJSON(structureRaw);
    if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
      throw new Error("AI returned an invalid course (no modules).");
    }
  } catch (e) {
    console.warn("Structure generation failed, using fallback:", e.message);
    onProgress("⚠️ AI rate-limited. Building a fallback course outline...");
    const slug = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    const base = slug(topic) || "topic";
    course = {
      title: `Introduction to ${topic}`,
      description: `A practical beginner-friendly roadmap to learn ${topic}.`,
      level: "Beginner",
      estimatedHours: 8,
      modules: [
        "Foundations",
        "Core Concepts",
        "Practical Workflow",
        "Tools and Ecosystem",
        "Projects and Case Studies",
        "Review and Next Steps",
      ].map((name, i) => ({
        id: `module_${i + 1}`,
        title: `${name} in ${topic}`,
        summary: `Key ideas for ${name.toLowerCase()} with practical examples.`,
        youtubeQueries: [`${topic} ${name}`],
        paperTopics: [`${topic} ${name}`],
        concepts: [`${base}_${i + 1}_a`, `${base}_${i + 1}_b`, `${base}_${i + 1}_c`],
        quiz: [],
      })),
    };
  }

  onProgress("✍️ Writing lesson content...");
  let lessonsMap = {};
  try {
    const chunkSize = 3;
    for (let i = 0; i < course.modules.length; i += chunkSize) {
      const chunk = course.modules.slice(i, i + chunkSize);
      const moduleSummary = chunk.map((m) => `${m.id}: ${m.title}`).join("\n");
      onProgress(`✍️ Writing lesson content... (${Math.floor(i / chunkSize) + 1}/${Math.ceil(course.modules.length / chunkSize)})`);
      const lessonsRaw = await callGroqWithRetry(
        apiKey,
        LESSONS_PROMPT,
        "Write lessons for ONLY these modules (one entry per moduleId, all required):\n" +
          moduleSummary,
        1800,
        "llama-3.1-8b-instant",
        { jsonObject: true, temperature: 0.45 }
      );
      const parsed = parseJSON(lessonsRaw);
      const items = parsed.items ?? (Array.isArray(parsed) ? parsed : []);
      for (const entry of items) {
        if (entry?.moduleId && Array.isArray(entry.lessons)) {
          lessonsMap[entry.moduleId] = entry.lessons;
        }
      }
    }
  } catch (e) {
    console.warn("Lesson generation failed, continuing without:", e.message);
  }

  course.modules = course.modules.map((m) => ({
    ...m,
    lessons: lessonsMap[m.id] || [],
  }));

  onProgress("🎬 Finding videos and papers...");
  const enrichedModules = await Promise.all(
    course.modules.map(async (module) => {
      const [videos, papers] = await Promise.all([
        (async () => {
          try {
            const results = await Promise.all(
              (module.youtubeQueries || []).map((q) =>
                fetchYouTubeVideos(q, 2).catch(() => [])
              )
            );
            const all = results.flat();
            const seen = new Set();
            return all.filter((v) => {
              if (seen.has(v.videoId)) return false;
              seen.add(v.videoId);
              return true;
            }).slice(0, 4);
          } catch { return []; }
        })(),
        (async () => {
          try {
            const results = await Promise.all(
              (module.paperTopics || []).map((t) =>
                fetchPapers(t, 3).catch(() => [])
              )
            );
            return results.flat().slice(0, 4);
          } catch { return []; }
        })(),
      ]);

      return { ...module, videos, papers };
    })
  );

  return { ...course, modules: enrichedModules };
}