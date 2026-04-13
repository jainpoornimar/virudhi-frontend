import React, { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("token");

const STOP_WORDS = new Set([
  "i",
  "have",
  "am",
  "is",
  "the",
  "a",
  "an",
  "my",
  "me",
  "to",
  "for",
  "and",
  "or",
  "with",
  "of",
  "in",
  "on",
  "at",
  "it",
  "this",
  "that",
  "about",
  "please",
  "help",
  "tell",
  "show",
  "do",
  "how",
  "what",
]);

const symptomMap = {
  cold: [
    "cold",
    "sneezing",
    "runny nose",
    "blocked nose",
    "congestion",
    "cough",
    "throat irritation",
    "sore throat",
    "phlegm",
    "mucus",
    "nose block",
  ],
  fever: [
    "fever",
    "temperature",
    "body heat",
    "chills",
    "high temperature",
    "hot body",
    "feverish",
  ],
  acne: [
    "pimple",
    "pimples",
    "acne",
    "breakout",
    "zits",
    "skin bumps",
    "face bumps",
  ],
  dandruff: [
    "dandruff",
    "scalp flakes",
    "flaky scalp",
    "itchy scalp",
    "scalp itching",
    "white flakes",
  ],
  stress: [
    "stress",
    "anxiety",
    "tension",
    "overthinking",
    "fatigue",
    "mental tiredness",
    "worried",
    "restless",
  ],
  cough: [
    "cough",
    "dry cough",
    "wet cough",
    "throat cough",
    "phlegm",
  ],
};

const followUpTriggers = {
  precautions: ["precaution", "precautions", "avoid", "what to avoid"],
  related: ["related", "related diseases", "similar disease", "similar diseases"],
  remedies: ["remedy", "remedies", "treatment", "treatments", "show remedies"],
  why: ["why", "why it works", "how it works"],
  plant: ["plant", "plants", "herb", "herbs"],
  usage: ["how to use", "usage", "how should i use", "how can i use"],
};

const AskNature = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi 🌿 I’m Ask Nature. Describe your symptoms or ask about a plant or disease.",
      suggestions: ["I have sneezing and cough", "Show remedies for cold", "Tell me about tulsi"],
    },
  ]);
  const [diseases, setDiseases] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const [context, setContext] = useState({
    lastDisease: null,
    lastPlant: null,
    lastMatches: [],
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const authHeaders = useMemo(() => {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const fetchAllData = async () => {
    try {
      setLoadingData(true);

      const [diseaseRes, plantRes] = await Promise.all([
        fetch(`${API_BASE_URL}/user/diseases`, {
          method: "GET",
          headers: authHeaders,
        }),
        fetch(`${API_BASE_URL}/plants`, {
          method: "GET",
          headers: authHeaders,
        }),
      ]);

      if (!diseaseRes.ok) {
        throw new Error("Failed to load diseases");
      }
      if (!plantRes.ok) {
        throw new Error("Failed to load plants");
      }

      const diseaseData = await diseaseRes.json();
      const plantData = await plantRes.json();

      setDiseases(Array.isArray(diseaseData) ? diseaseData : []);
      setPlants(Array.isArray(plantData) ? plantData : []);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I couldn’t load the health data right now. Please check the API or login and try again.",
          suggestions: [],
        },
      ]);
    } finally {
      setLoadingData(false);
    }
  };

  const normalize = (text) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const tokenize = (text) =>
    normalize(text)
      .split(" ")
      .filter((word) => word && !STOP_WORDS.has(word));

  const includesPhrase = (text, phrase) => normalize(text).includes(normalize(phrase));

  const detectIntent = (text) => {
    const normalized = normalize(text);

    for (const trigger of followUpTriggers.precautions) {
      if (normalized.includes(trigger)) return "precautions";
    }
    for (const trigger of followUpTriggers.related) {
      if (normalized.includes(trigger)) return "related";
    }
    for (const trigger of followUpTriggers.remedies) {
      if (normalized.includes(trigger)) return "remedies";
    }
    for (const trigger of followUpTriggers.why) {
      if (normalized.includes(trigger)) return "why";
    }
    for (const trigger of followUpTriggers.usage) {
      if (normalized.includes(trigger)) return "usage";
    }

    const mentionsPlant = plants.some((plant) =>
      includesPhrase(normalized, plant.name)
    );
    if (mentionsPlant) return "plant";

    return "symptom";
  };

  const getDiseaseKeywords = (diseaseName) => {
    const key = diseaseName?.toLowerCase() || "";
    const mapped = symptomMap[key] || [];
    return [...new Set([key, ...mapped])];
  };

  const scoreDisease = (disease, rawText) => {
    const text = normalize(rawText);
    const tokens = tokenize(rawText);
    let score = 0;
    const reasons = [];

    const diseaseName = disease.name?.toLowerCase() || "";
    const description = disease.description?.toLowerCase() || "";
    const relatedNames = (disease.related || []).map((r) => r.name?.toLowerCase() || "");
    const remedyTitles = (disease.remedies || []).map((r) => r.title?.toLowerCase() || "");
    const keywords = getDiseaseKeywords(disease.name);

    if (diseaseName && text.includes(diseaseName)) {
      score += 10;
      reasons.push(`matched disease name "${disease.name}"`);
    }

    keywords.forEach((keyword) => {
      if (keyword && text.includes(keyword)) {
        score += 4;
        reasons.push(`matched symptom "${keyword}"`);
      }
    });

    tokens.forEach((token) => {
      if (diseaseName.includes(token) && token.length > 2) {
        score += 1;
      }
      if (description.includes(token) && token.length > 3) {
        score += 1;
      }
      if (relatedNames.some((name) => name.includes(token) && token.length > 2)) {
        score += 1;
      }
      if (remedyTitles.some((title) => title.includes(token) && token.length > 2)) {
        score += 1;
      }
    });

    if (text.includes("throat") && diseaseName === "cold") {
      score += 2;
      reasons.push('matched supportive clue "throat"');
    }

    if (text.includes("scalp") && diseaseName === "dandruff") {
      score += 3;
      reasons.push('matched supportive clue "scalp"');
    }

    return { disease, score, reasons };
  };

  const scorePlant = (plant, rawText) => {
    const text = normalize(rawText);
    const tokens = tokenize(rawText);
    let score = 0;

    const name = plant.name?.toLowerCase() || "";
    const scientific = plant.scientific?.toLowerCase() || "";
    const description = plant.description?.toLowerCase() || "";

    if (name && text.includes(name)) score += 10;
    if (scientific && text.includes(scientific)) score += 8;

    tokens.forEach((token) => {
      if (name.includes(token) && token.length > 2) score += 2;
      if (scientific.includes(token) && token.length > 2) score += 2;
      if (description.includes(token) && token.length > 3) score += 1;
    });

    return { plant, score };
  };

  const matchDiseases = (text) => {
    return diseases
      .map((disease) => scoreDisease(disease, text))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const matchPlants = (text) => {
    return plants
      .map((plant) => scorePlant(plant, text))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  };

  const getConfidenceLabel = (score) => {
    if (score >= 14) return "strong match";
    if (score >= 8) return "likely match";
    return "possible match";
  };

  const buildDiseaseResponse = (matches, userText) => {
    if (!matches.length) {
      return {
        text: `I couldn’t clearly match that yet 🤔

Try describing symptoms like:
• sneezing and cough
• pimples on face
• fever and chills
• itchy scalp

Or ask about a plant like Tulsi.`,
        suggestions: ["I have sneezing and cough", "I have pimples", "Tell me about Tulsi"],
      };
    }

    const primary = matches[0];
    const secondary = matches[1];
    const disease = primary.disease;
    const topRemedy = disease.remedies?.[0];

    let text = `Based on your symptoms, this is a **${getConfidenceLabel(primary.score)}** for **${disease.name}**.\n\n`;

    if (disease.description) {
      text += `${disease.description}\n\n`;
    }

    if (topRemedy) {
      text += `🌿 **Suggested remedy**\n${topRemedy.title}\n${topRemedy.description}\n\n`;
    }

    if (disease.variants?.length) {
      const firstVariant = disease.variants[0];
      text += `⏳ **Possible recovery**\n${firstVariant.recovery}\n\n`;
    }

    if (disease.precautions?.length) {
      text += `⚠️ **Quick precaution**\n${disease.precautions[0]}\n\n`;
    }

    if (secondary?.disease) {
      text += `It may also be related to **${secondary.disease.name}**.\n`;
    }

    return {
      text,
      suggestions: [
        "Show precautions",
        "Why it works",
        "Show remedies",
        "Related diseases",
        "Show plants",
      ],
      primaryDisease: disease,
      matches,
    };
  };

  const buildPlantResponse = (plant) => {
    if (!plant) {
      return {
        text: "I couldn’t find that plant clearly. Try asking like: Tell me about Tulsi.",
        suggestions: [],
      };
    }

    const image =
      Array.isArray(plant.images) && plant.images.length > 0 ? plant.images[0] : null;

    return {
      text: `🌱 **${plant.name}**${plant.scientific ? ` (${plant.scientific})` : ""}

${plant.description || "No description available."}`,
      suggestions: ["What disease is it useful for?", "Show more plants"],
      image,
      primaryPlant: plant,
    };
  };

  const handleFollowUp = (intent) => {
    const disease = context.lastDisease;
    const plant = context.lastPlant;

    if (intent === "precautions" && disease) {
      return {
        text: `⚠️ **Precautions for ${disease.name}**\n${(disease.precautions || [])
          .map((p) => `• ${p}`)
          .join("\n") || "No precautions available."}`,
        suggestions: ["Show remedies", "Why it works", "Related diseases"],
      };
    }

    if (intent === "related" && disease) {
      return {
        text: `🔗 **Related diseases for ${disease.name}**\n${(disease.related || [])
          .map((r) => `• ${r.name}`)
          .join("\n") || "No related diseases available."}`,
        suggestions: ["Show precautions", "Show remedies"],
      };
    }

    if (intent === "remedies" && disease) {
      return {
        text: `🌿 **Remedies for ${disease.name}**\n${(disease.remedies || [])
          .map((r) => `• ${r.title}: ${r.description}`)
          .join("\n\n") || "No remedies available."}`,
        suggestions: ["Why it works", "Show precautions", "Related diseases"],
      };
    }

    if (intent === "why" && disease) {
      return {
        text: `🧠 **Why it works for ${disease.name}**\n${(disease.whyItWorks || [])
          .map((w) => `• ${w}`)
          .join("\n") || "No explanation available."}`,
        suggestions: ["Show remedies", "Show precautions"],
      };
    }

    if (intent === "usage" && disease) {
      return {
        text: `🌿 **How to use the remedies for ${disease.name}**\n${(disease.remedies || [])
          .map((r) => `• ${r.title}: ${r.description}`)
          .join("\n\n") || "No usage details available."}`,
        suggestions: ["Show precautions", "Why it works"],
      };
    }

    if (intent === "plant" && disease) {
      const plantNames = extractPlantNamesFromDisease(disease);
      return {
        text: `🌱 **Plants or ingredients often mentioned for ${disease.name}**\n${
          plantNames.length ? plantNames.map((p) => `• ${p}`).join("\n") : "No specific plants identified."
        }`,
        suggestions: plantNames.length ? [`Tell me about ${plantNames[0]}`] : ["Show remedies"],
      };
    }

    if (intent === "plant" && plant) {
      return {
        text: `🌱 **${plant.name}** is a medicinal plant in your data.\n\n${plant.description || ""}`,
        suggestions: ["Show more plants"],
      };
    }

    return null;
  };

  const extractPlantNamesFromDisease = (disease) => {
    if (!disease) return [];
    const textBlob = [
      disease.name,
      disease.description,
      ...(disease.remedies || []).flatMap((r) => [r.title, r.description]),
      ...(disease.whyItWorks || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return plants
      .filter((plant) => textBlob.includes(plant.name.toLowerCase()))
      .map((plant) => plant.name);
  };

  const addBotMessage = (payload) => {
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: payload.text,
        suggestions: payload.suggestions || [],
        image: payload.image || null,
      },
    ]);
  };

  const processMessage = (rawInput) => {
    const text = normalize(rawInput);
    const intent = detectIntent(text);

    const followUpResponse = handleFollowUp(intent);
    if (followUpResponse) {
      addBotMessage(followUpResponse);
      return;
    }

    const plantMatches = matchPlants(text);
    const diseaseMatches = matchDiseases(text);

    const directPlantMention =
      plantMatches.length > 0 &&
      includesPhrase(text, plantMatches[0].plant.name);

    if (intent === "plant" || directPlantMention) {
      const plantResponse = buildPlantResponse(plantMatches[0]?.plant || null);
      addBotMessage(plantResponse);
      setContext((prev) => ({
        ...prev,
        lastPlant: plantMatches[0]?.plant || null,
      }));
      return;
    }

    const diseaseResponse = buildDiseaseResponse(diseaseMatches, rawInput);
    addBotMessage(diseaseResponse);

    setContext((prev) => ({
      ...prev,
      lastDisease: diseaseResponse.primaryDisease || null,
      lastMatches: diseaseResponse.matches || [],
    }));
  };

  const handleSend = (forcedText = null) => {
    const textToSend = forcedText ?? input;

    if (!textToSend.trim()) return;
    if (loadingData) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: textToSend },
    ]);

    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      processMessage(textToSend);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col rounded-2xl bg-[rgba(0,20,10,0.45)] p-4 text-white shadow">
      <h2 className="mb-3 text-xl font-semibold">🌿 Ask Nature</h2>

      <div
        className="flex-1 overflow-y-auto space-y-3 p-2 hide-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.length === 1 && (
          <div className="text-sm text-gray-300">
            Try asking:
            <div className="mt-2 space-y-1">
              <p>• I have sneezing and cough</p>
              <p>• I have pimples on my face</p>
              <p>• Tell me about Tulsi</p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index}>
            <div
              className={`max-w-[78%] rounded-2xl p-3 whitespace-pre-line ${
                msg.role === "user"
                  ? "ml-auto bg-green-700 text-white"
                  : "bg-[#163d2e] text-green-100"
              }`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="plant"
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              )}
              {msg.text}
            </div>

            {msg.role === "bot" && Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(suggestion)}
                    className="rounded-full bg-green-800 px-3 py-1 text-sm text-green-100 hover:bg-green-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loadingData && (
          <div className="w-fit rounded-xl bg-[#163d2e] px-4 py-2 text-sm text-green-200">
            🌿 Loading health data...
          </div>
        )}

        {isTyping && !loadingData && (
          <div className="w-fit rounded-xl bg-[#163d2e] px-4 py-2 text-sm text-green-200 animate-pulse">
            🌿 Nature is thinking...
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your problem..."
          className="flex-1 rounded-full bg-[#163d2e] px-4 py-2 text-white outline-none placeholder:text-gray-400"
        />

        <button
          onClick={() => handleSend()}
          disabled={loadingData}
          className="rounded-full bg-green-700 px-4 py-2 text-white hover:bg-green-600 disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AskNature;