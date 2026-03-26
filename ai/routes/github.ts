import { Router, type IRouter } from "express";
import { pushToGitHub } from "../services/github.js";
import fs from "fs";
import path from "path";

const router: IRouter = Router();

// Push any content to GitHub
router.post("/push", async (req, res) => {
  try {
    const { token, owner, repo, path: filePath, content, message } = req.body as {
      token: string;
      owner: string;
      repo: string;
      path: string;
      content: string;
      message: string;
    };

    if (!token || !owner || !repo || !filePath || !content || !message) {
      res.status(400).json({ error: "Eksik alanlar var" });
      return;
    }

    const result = await pushToGitHub({ token, owner, repo, path: filePath, content, message });
    res.json(result);
  } catch (err: unknown) {
    req.log.error({ err }, "GitHub push failed");
    const errorMessage = err instanceof Error ? err.message : "GitHub push hatası";
    res.status(500).json({ error: errorMessage });
  }
});

// Push the actual AI source files from the project to GitHub
// Workspace root is two levels up from artifacts/api-server
const WORKSPACE_ROOT = path.resolve(process.cwd(), "../..");

const AI_FILES: { filePath: string; repoPath: string }[] = [
  {
    filePath: path.join(WORKSPACE_ROOT, "artifacts/api-server/src/services/gemini.ts"),
    repoPath: "ai/services/gemini.ts",
  },
  {
    filePath: path.join(WORKSPACE_ROOT, "artifacts/api-server/src/routes/ai.ts"),
    repoPath: "ai/routes/ai.ts",
  },
  {
    filePath: path.join(WORKSPACE_ROOT, "artifacts/api-server/src/routes/github.ts"),
    repoPath: "ai/routes/github.ts",
  },
  {
    filePath: path.join(WORKSPACE_ROOT, "lib/api-spec/openapi.yaml"),
    repoPath: "ai/openapi.yaml",
  },
  {
    filePath: path.join(WORKSPACE_ROOT, "artifacts/smart-board/src/pages/Dashboard.tsx"),
    repoPath: "ai/frontend/Dashboard.tsx",
  },
  {
    filePath: path.join(WORKSPACE_ROOT, "artifacts/smart-board/src/hooks/use-ai.ts"),
    repoPath: "ai/frontend/hooks/use-ai.ts",
  },
  {
    filePath: path.join(WORKSPACE_ROOT, "artifacts/smart-board/src/hooks/use-github.ts"),
    repoPath: "ai/frontend/hooks/use-github.ts",
  },
];

router.post("/push-ai-files", async (req, res) => {
  try {
    const { token, owner, repo, message } = req.body as {
      token: string;
      owner: string;
      repo: string;
      message?: string;
    };

    if (!token || !owner || !repo) {
      res.status(400).json({ error: "token, owner ve repo gerekli" });
      return;
    }

    const commitMsg = message || `Akıllı Tahta AI dosyaları - ${new Date().toLocaleString("tr-TR")}`;
    const results: { file: string; url: string; success: boolean; error?: string }[] = [];

    // Also push a README summarizing the project
    const readme = `# Akıllı Tahta AI Dosyaları

Bu repo, **Akıllı Tahta** uygulamasının yapay zeka bileşenlerini içermektedir.

## İçerik

| Dosya | Açıklama |
|-------|----------|
| \`ai/services/gemini.ts\` | Google Gemini AI servisi (sohbet, açıklama, test üretimi) |
| \`ai/routes/ai.ts\` | AI API endpoint'leri (/chat, /explain, /quiz) |
| \`ai/routes/github.ts\` | GitHub aktarma endpoint'leri |
| \`ai/openapi.yaml\` | API sözleşmesi (OpenAPI 3.1) |
| \`ai/frontend/Dashboard.tsx\` | React arayüz bileşeni |
| \`ai/frontend/hooks/use-ai.ts\` | AI React hook'ları |
| \`ai/frontend/hooks/use-github.ts\` | GitHub React hook'u |

## Özellikler

- 🤖 **Gemini 1.5 Flash** ile Türkçe yapay zeka sohbeti
- 📚 **Konu açıklama** — herhangi bir konuyu AI ile açıklat
- 🧪 **Test üretimi** — konudan otomatik çoktan seçmeli sorular
- 🐙 **GitHub aktarma** — oturumları ve dosyaları GitHub'a gönder

_Aktarılma tarihi: ${new Date().toLocaleString("tr-TR")}_
`;

    const readmeResult = await pushToGitHub({
      token, owner, repo,
      path: "README.md",
      content: readme,
      message: commitMsg,
    }).catch((e) => ({ success: false, url: "", sha: "", error: e.message }));

    results.push({ file: "README.md", url: (readmeResult as any).url || "", success: (readmeResult as any).success });

    // Push each AI file
    for (const { filePath, repoPath } of AI_FILES) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const result = await pushToGitHub({ token, owner, repo, path: repoPath, content, message: commitMsg });
        results.push({ file: repoPath, url: result.url, success: true });
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        req.log.error({ err, repoPath }, "Failed to push file");
        results.push({ file: repoPath, url: "", success: false, error: errMsg });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    res.json({ success: true, pushed: successCount, total: results.length, results });
  } catch (err: unknown) {
    req.log.error({ err }, "push-ai-files failed");
    const errorMessage = err instanceof Error ? err.message : "Hata oluştu";
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
