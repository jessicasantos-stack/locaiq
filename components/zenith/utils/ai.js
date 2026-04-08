import { ANDERSON_MELO_SYSTEM } from "../constants/anderson-melo";

export async function callClaude(prompt, maxTokens = 500) {
  try {
    const response = await fetch("/api/claude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, maxTokens, system: ANDERSON_MELO_SYSTEM }),
    });
    if (!response.ok) {
      return "API error: " + response.status + ". Try again later.";
    }
    const data = await response.json();
    return data.text || "Error generating content.";
  } catch (err) {
    return "API connection error. Check your network and try again.";
  }
}
