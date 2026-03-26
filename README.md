# Akıllı Tahta AI Dosyaları

Bu repo, **Akıllı Tahta** uygulamasının yapay zeka bileşenlerini içermektedir.

## İçerik

| Dosya | Açıklama |
|-------|----------|
| `ai/services/gemini.ts` | Google Gemini AI servisi (sohbet, açıklama, test üretimi) |
| `ai/routes/ai.ts` | AI API endpoint'leri (/chat, /explain, /quiz) |
| `ai/routes/github.ts` | GitHub aktarma endpoint'leri |
| `ai/openapi.yaml` | API sözleşmesi (OpenAPI 3.1) |
| `ai/frontend/Dashboard.tsx` | React arayüz bileşeni |
| `ai/frontend/hooks/use-ai.ts` | AI React hook'ları |
| `ai/frontend/hooks/use-github.ts` | GitHub React hook'u |

## Özellikler

- 🤖 **Gemini 1.5 Flash** ile Türkçe yapay zeka sohbeti
- 📚 **Konu açıklama** — herhangi bir konuyu AI ile açıklat
- 🧪 **Test üretimi** — konudan otomatik çoktan seçmeli sorular
- 🐙 **GitHub aktarma** — oturumları ve dosyaları GitHub'a gönder

_Aktarılma tarihi: 26.03.2026 18:46:27_
