const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export async function askGroqAI(prompt: string, systemRole: string = "You are Doubt Hunter AI, an expert JEE tutor for Physics, Chemistry, and Mathematics.") {
  if (!GROQ_API_KEY) {
    return "Error: VITE_GROQ_API_KEY is missing in Vercel settings.";
  }

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemRole },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response generated from Groq AI.";
  } catch (err) {
    console.error("Groq API Error:", err);
    return "Failed to connect to Groq AI network.";
  }
}

