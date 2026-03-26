import { 
  useAiChat as useGeneratedAiChat,
  useAiExplain as useGeneratedAiExplain,
  useAiGenerateQuiz as useGeneratedAiGenerateQuiz
} from "@workspace/api-client-react";

export function useAiChat() {
  return useGeneratedAiChat();
}

export function useAiExplain() {
  return useGeneratedAiExplain();
}

export function useAiGenerateQuiz() {
  return useGeneratedAiGenerateQuiz();
}
