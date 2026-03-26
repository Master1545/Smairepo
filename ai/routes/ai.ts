import { Router, type IRouter } from "express";
import { chat, explainBoard, generateQuiz } from "../services/gemini.js";

const router: IRouter = Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, boardContent, history } = req.body as {
      message: string;
      boardContent?: string;
      history?: { role: "user" | "assistant"; content: string }[];
    };

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    const response = await chat(message, boardContent, history);
    res.json({ response });
  } catch (err) {
    req.log.error({ err }, "AI chat failed");
    res.status(500).json({ error: "AI chat failed" });
  }
});

router.post("/explain", async (req, res) => {
  try {
    const { boardContent, language = "Turkish" } = req.body as {
      boardContent: string;
      language?: string;
    };

    if (!boardContent) {
      res.status(400).json({ error: "boardContent is required" });
      return;
    }

    const response = await explainBoard(boardContent, language);
    res.json({ response });
  } catch (err) {
    req.log.error({ err }, "AI explain failed");
    res.status(500).json({ error: "AI explain failed" });
  }
});

router.post("/quiz", async (req, res) => {
  try {
    const { boardContent, language = "Turkish" } = req.body as {
      boardContent: string;
      language?: string;
    };

    if (!boardContent) {
      res.status(400).json({ error: "boardContent is required" });
      return;
    }

    const questions = await generateQuiz(boardContent, language);
    res.json({ questions });
  } catch (err) {
    req.log.error({ err }, "Quiz generation failed");
    res.status(500).json({ error: "Quiz generation failed" });
  }
});

export default router;
