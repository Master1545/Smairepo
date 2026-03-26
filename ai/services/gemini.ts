import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is required");
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

export async function chat(
  message: string,
  boardContent?: string,
  history?: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const systemContext = boardContent
    ? `Sen bir eğitim asistanısın. Aşağıda bir akıllı tahta içeriği var:\n\n${boardContent}\n\nBu içerikle ilgili sorulara Türkçe olarak cevap ver.`
    : "Sen yardımcı bir eğitim asistanısın. Türkçe olarak cevap ver.";

  const chatHistory: ChatMessage[] = [
    {
      role: "user",
      parts: [{ text: systemContext }],
    },
    {
      role: "model",
      parts: [{ text: "Anladım, size yardımcı olmaya hazırım." }],
    },
  ];

  if (history) {
    for (const msg of history) {
      chatHistory.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  const chatSession = model.startChat({ history: chatHistory });
  const result = await chatSession.sendMessage(message);
  return result.response.text();
}

export async function explainBoard(
  boardContent: string,
  language: string = "Turkish"
): Promise<string> {
  const prompt =
    language === "Turkish"
      ? `Aşağıdaki akıllı tahta içeriğini öğrencilere açıkla. Anlaşılır, eğitici ve öğretici bir dil kullan. İçerik:\n\n${boardContent}`
      : `Explain the following smart board content to students in ${language}. Use clear, educational language. Content:\n\n${boardContent}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateQuiz(
  boardContent: string,
  language: string = "Turkish"
): Promise<{
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}[]> {
  const prompt =
    language === "Turkish"
      ? `Aşağıdaki akıllı tahta içeriğinden 5 adet çoktan seçmeli quiz sorusu oluştur. Her soru için 4 şık hazırla. Sadece JSON formatında yanıt ver, başka metin ekleme.\n\nFormat:\n[\n  {\n    "question": "Soru metni",\n    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],\n    "correctAnswer": 0,\n    "explanation": "Açıklama"\n  }\n]\n\nİçerik:\n${boardContent}`
      : `Generate 5 multiple choice quiz questions from the following content. Each question should have 4 options. Respond only in JSON format.\n\nFormat:\n[\n  {\n    "question": "Question text",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswer": 0,\n    "explanation": "Explanation"\n  }\n]\n\nContent:\n${boardContent}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response as JSON");
  }

  return JSON.parse(jsonMatch[0]);
}
