
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed. Please send a POST request."
    });
  }

  // Read secret key from Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY environment variable");

    return res.status(500).json({
      error: "GEMINI_API_KEY missing. Add it in Vercel Settings > Environment Variables, then redeploy."
    });
  }

  try {
    const message = req.body?.message;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (message.length > 30000) {
      return res.status(413).json({
        error: "Message too long. Please shorten it."
      });
    }

    const googleResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          model: "gemini-3.8-flash",
          input: message.trim()
        })
      }
    );

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      console.error(
        "Gemini API error:",
        googleResponse.status,
        data?.error?.message || "Unknown error"
      );

      return res.status(googleResponse.status >= 400 &&
        googleResponse.status < 500 ? 502 : 500).json({
        error:
          data?.error?.message ||
          `Gemini API request failed (${googleResponse.status}). Check your model and API access.`
      });
    }

    let reply = "";

    if (typeof data.output_text === "string") {
      reply = data.output_text;
    } else if (Array.isArray(data.outputs)) {
      reply = data.outputs
        .map(item => {
          if (typeof item.text === "string") return item.text;

          if (Array.isArray(item.content)) {
            return item.content
              .map(part => part.text || "")
              .join("");
          }

          return "";
        })
        .filter(Boolean)
        .join("\n");
    }

    if (!reply.trim()) {
      console.error("Gemini returned no text output.");

      return res.status(502).json({
        error: "Gemini returned an empty answer. Check the model response format."
      });
    }

    return res.status(200).json({
      reply: reply.trim()
    });

  } catch (error) {
    console.error("NeoNew AI backend error:", error);

    return res.status(500).json({
      error: "Server error while contacting Gemini. Please try again."
    });
  }
}
