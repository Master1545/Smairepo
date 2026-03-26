const express = require("express");
const axios = require("axios");
const app = express();

app.use(express.json());
app.use(express.static("."));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;  // Render Secret olarak ekle

app.post("/ask", async (req, res) => {
  const question = req.body.question;
  if (!question) return res.json({ answer: "Soru boş!" });

  try {
    const response = await axios.post(
      "https://api.gemini.com/v1/chat/completions",  // Gemini API endpoint örnek
      {
        model: "gemini-1",
        messages: [{ role: "user", content: question }]
      },
      {
        headers: { "Authorization": `Bearer ${GEMINI_API_KEY}` }
      }
    );
    const answer = response.data.choices[0].message.content;
    res.json({ answer });
  } catch (err) {
    res.json({ answer: "AI hatası: " + err.message });
  }
});

app.listen(3000, () => console.log("AI web servisi çalışıyor: http://localhost:3000"));
