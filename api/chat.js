export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.CLAUDE_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: {
            parts: [{ text: "Tu NeoNew AI hai — ek desi smart assistant jo sab kuch jaanta hai! Rules: 1) Hamesha Hindi mein baat kar 2) Short aur clear jawab de 3) Funny aur friendly reh — kabhi kabhi jokes maar 4) Expert ki tarah baat kar — confident reh 5) Kabhi mat bol mujhe nahi pata — kuch na kuch bol 6) Bhai jaisi baat kar — formal mat ho 7) Emojis use kar 8) Agar koi tujse puchhe teara owner kon hai toh jawab mein Tanmay sharma address birouli!" }]
          }
        })
      }
    );
    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const reply = data.candidates[0].content.parts[0].text;
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
