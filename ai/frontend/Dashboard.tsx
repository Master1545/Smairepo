import { useState, useRef, useEffect } from "react";
import { useAiChat, useAiExplain, useAiGenerateQuiz } from "@/hooks/use-ai";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sparkles, Send, BrainCircuit, FileQuestion, Loader2, Bot,
  Github, Plus, Trash2, MessageSquare, ChevronLeft, Menu, X
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; messages: Message[]; createdAt: Date };

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Dashboard() {
  const { toast } = useToast();

  // Sessions
  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const saved = localStorage.getItem("ai_sessions");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [{ id: makeId(), title: "Yeni Oturum", messages: [], createdAt: new Date() }];
  });
  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id ?? makeId());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeSession = sessions.find((s) => s.id === activeId) ?? sessions[0];

  // Save sessions to localStorage on change
  useEffect(() => {
    localStorage.setItem("ai_sessions", JSON.stringify(sessions));
  }, [sessions]);

  function updateMessages(id: string, messages: Message[]) {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const title =
          messages.find((m) => m.role === "user")?.content.slice(0, 40) || s.title;
        return { ...s, messages, title };
      })
    );
  }

  function newSession() {
    const s: Session = { id: makeId(), title: "Yeni Oturum", messages: [], createdAt: new Date() };
    setSessions((prev) => [s, ...prev]);
    setActiveId(s.id);
    setSidebarOpen(false);
  }

  function deleteSession(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const fresh: Session = { id: makeId(), title: "Yeni Oturum", messages: [], createdAt: new Date() };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  // GitHub modal state
  const [ghOpen, setGhOpen] = useState(false);
  const [ghToken, setGhToken] = useState(() => localStorage.getItem("github_token") || "");
  const [ghOwner, setGhOwner] = useState(() => localStorage.getItem("github_owner") || "");
  const [ghRepo, setGhRepo] = useState(() => localStorage.getItem("github_repo") || "");
  const [ghPushing, setGhPushing] = useState(false);
  const [ghResults, setGhResults] = useState<{ file: string; url: string; success: boolean; error?: string }[] | null>(null);

  async function handleGithubPushFiles(e: React.FormEvent) {
    e.preventDefault();
    if (!ghToken || !ghOwner || !ghRepo) {
      toast({ title: "Hata", description: "Token, kullanıcı adı ve repo gerekli.", variant: "destructive" });
      return;
    }
    localStorage.setItem("github_token", ghToken);
    localStorage.setItem("github_owner", ghOwner);
    localStorage.setItem("github_repo", ghRepo);

    setGhPushing(true);
    setGhResults(null);
    try {
      const res = await fetch("/api/github/push-ai-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ghToken, owner: ghOwner, repo: ghRepo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hata");
      setGhResults(data.results);
      toast({ title: `✅ ${data.pushed}/${data.total} dosya aktarıldı!`, description: `${ghOwner}/${ghRepo} reposuna gönderildi.` });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "GitHub hatası", variant: "destructive" });
    } finally {
      setGhPushing(false);
    }
  }

  return (
    <div className="flex h-screen w-screen bg-background overflow-hidden">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static z-40 h-full flex flex-col
          w-72 bg-card border-r border-white/8 shrink-0
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Akıllı Tahta AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New session button */}
        <div className="p-3">
          <Button onClick={newSession} className="w-full gap-2 justify-start bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20">
            <Plus className="w-4 h-4" />
            Yeni Oturum
          </Button>
        </div>

        {/* Sessions list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => { setActiveId(s.id); setSidebarOpen(false); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setActiveId(s.id); setSidebarOpen(false); } }}
                className={`
                  group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer select-none
                  ${s.id === activeId
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}
                `}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-sm truncate">{s.title}</span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); deleteSession(s.id); } }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-0.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* GitHub push */}
        <div className="p-3 border-t border-white/8">
          <Button
            variant="outline"
            className="w-full gap-2 border-white/10 hover:bg-white/5"
            onClick={() => setGhOpen(true)}
          >
            <Github className="w-4 h-4" />
            GitHub'a Aktar
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-white/8 shrink-0">
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Bot className="w-5 h-5 text-primary shrink-0" />
            <span className="font-semibold text-foreground truncate">{activeSession.title}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:flex gap-2 border-white/10 hover:bg-white/5 shrink-0"
            onClick={() => setGhOpen(true)}
          >
            <Github className="w-4 h-4" />
            GitHub'a Aktar
          </Button>
        </header>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-3 shrink-0">
            <TabsList className="bg-white/5 p-1 rounded-xl">
              <TabsTrigger value="chat" className="rounded-lg gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <MessageSquare className="w-3.5 h-3.5" />
                Sohbet
              </TabsTrigger>
              <TabsTrigger value="explain" className="rounded-lg gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <BrainCircuit className="w-3.5 h-3.5" />
                Açıkla
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-lg gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                <FileQuestion className="w-3.5 h-3.5" />
                Test Üret
              </TabsTrigger>
            </TabsList>
          </div>

          {/* CHAT TAB */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 mt-3">
            <ChatTab
              session={activeSession}
              onUpdateMessages={(msgs) => updateMessages(activeSession.id, msgs)}
            />
          </TabsContent>

          {/* EXPLAIN TAB */}
          <TabsContent value="explain" className="flex-1 flex flex-col overflow-hidden m-0 mt-3">
            <ExplainTab
              onAddToChat={(text) => {
                const msgs: Message[] = [
                  ...activeSession.messages,
                  { role: "assistant", content: text },
                ];
                updateMessages(activeSession.id, msgs);
              }}
            />
          </TabsContent>

          {/* QUIZ TAB */}
          <TabsContent value="quiz" className="flex-1 flex flex-col overflow-hidden m-0 mt-3">
            <QuizTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* GitHub Modal */}
      <Dialog open={ghOpen} onOpenChange={(o) => { setGhOpen(o); if (!o) setGhResults(null); }}>
        <DialogContent className="sm:max-w-lg bg-card border-white/10 text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Github className="w-5 h-5" />
              Yapay Zeka Dosyalarını GitHub'a Aktar
            </DialogTitle>
          </DialogHeader>

          {!ghResults ? (
            <form onSubmit={handleGithubPushFiles} className="space-y-4 mt-2">
              {/* Info box */}
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Aktarılacak dosyalar:</p>
                <ul className="space-y-0.5 text-xs list-disc list-inside">
                  <li>ai/services/gemini.ts — Gemini AI servisi</li>
                  <li>ai/routes/ai.ts — AI endpoint'leri</li>
                  <li>ai/routes/github.ts — GitHub endpoint'leri</li>
                  <li>ai/openapi.yaml — API sözleşmesi</li>
                  <li>ai/frontend/Dashboard.tsx — Arayüz</li>
                  <li>ai/frontend/hooks/use-ai.ts — React hook'ları</li>
                  <li>README.md — Proje açıklaması</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label>Personal Access Token (repo yetkisi gerekli)</Label>
                <Input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="bg-background border-white/10 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-primary underline">
                    github.com/settings/tokens
                  </a>{" "}
                  → repo yetkisiyle oluştur
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>GitHub Kullanıcı Adın</Label>
                  <Input value={ghOwner} onChange={(e) => setGhOwner(e.target.value)} placeholder="kullanici-adi" className="bg-background border-white/10" />
                </div>
                <div className="space-y-1.5">
                  <Label>Repo Adı</Label>
                  <Input value={ghRepo} onChange={(e) => setGhRepo(e.target.value)} placeholder="akilliTahta" className="bg-background border-white/10" />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl gap-2 text-base font-semibold" disabled={ghPushing || !ghToken || !ghOwner || !ghRepo}>
                {ghPushing ? <><Loader2 className="w-5 h-5 animate-spin" /> Aktarılıyor...</> : <><Github className="w-5 h-5" /> Dosyaları Aktar</>}
              </Button>
            </form>
          ) : (
            <div className="space-y-3 mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="text-green-400 font-semibold">{ghResults.filter(r => r.success).length}</span> / {ghResults.length} dosya başarıyla aktarıldı.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {ghResults.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm border ${r.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                    <span className={r.success ? "text-green-400" : "text-red-400"}>{r.success ? "✓" : "✗"}</span>
                    <span className="flex-1 font-mono text-xs truncate">{r.file}</span>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-primary text-xs underline shrink-0">Görüntüle</a>
                    )}
                  </div>
                ))}
              </div>
              <Button className="w-full" variant="outline" onClick={() => { setGhResults(null); setGhOpen(false); }}>Kapat</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Chat Tab ─── */
function ChatTab({ session, onUpdateMessages }: { session: Session; onUpdateMessages: (m: Message[]) => void }) {
  const [input, setInput] = useState("");
  const chatMutation = useAiChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, chatMutation.isPending]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    const msgs: Message[] = [...session.messages, { role: "user", content: text }];
    onUpdateMessages(msgs);
    setInput("");

    chatMutation.mutate(
      { data: { message: text, history: session.messages } },
      {
        onSuccess: (res) => {
          onUpdateMessages([...msgs, { role: "assistant", content: res.response }]);
        },
      }
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-4">
        {session.messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-72 text-center gap-4 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Gemini AI ile sohbet et</p>
              <p className="text-sm mt-1">Herhangi bir konu hakkında soru sorabilirsin.</p>
            </div>
          </div>
        )}
        <div className="space-y-5 py-4">
          {session.messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.role === "user" ? "bg-primary text-white" : "bg-accent/20 text-accent"
              }`}>
                {msg.role === "user" ? "S" : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-tr-none"
                  : "bg-white/5 border border-white/8 rounded-tl-none"
              }`}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/8 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Düşünüyor...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSend} className="p-4 border-t border-white/8 bg-background/60 backdrop-blur">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Gemini'ye sor..."
            className="flex-1 h-12 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shrink-0" disabled={!input.trim() || chatMutation.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Explain Tab ─── */
function ExplainTab({ onAddToChat }: { onAddToChat: (text: string) => void }) {
  const [topic, setTopic] = useState("");
  const [result, setResult] = useState("");
  const explainMutation = useAiExplain();

  function handleExplain(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    explainMutation.mutate(
      { data: { boardContent: topic, language: "Turkish" } },
      { onSuccess: (res) => setResult(res.response) }
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 gap-4">
      <form onSubmit={handleExplain} className="flex flex-col gap-3">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Açıklanmasını istediğin konuyu veya metni buraya yaz... (örn: Fotosentez, İkinci Dünya Savaşı, Pythagoras teoremi)"
          className="bg-white/5 border-white/10 rounded-xl min-h-[120px] resize-none focus-visible:ring-primary"
        />
        <Button type="submit" className="h-12 rounded-xl gap-2" disabled={!topic.trim() || explainMutation.isPending}>
          {explainMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          Yapay Zeka ile Açıkla
        </Button>
      </form>

      {result && (
        <div className="flex-1 overflow-hidden flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Açıklama:</span>
            <Button size="sm" variant="ghost" className="text-xs text-primary" onClick={() => { onAddToChat(result); setResult(""); setTopic(""); }}>
              Sohbete Ekle
            </Button>
          </div>
          <ScrollArea className="flex-1 bg-white/5 border border-white/8 rounded-xl p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/* ─── Quiz Tab ─── */
function QuizTab() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState<any[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const quizMutation = useAiGenerateQuiz();

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;
    setQuiz(null);
    setAnswers({});
    setRevealed({});
    quizMutation.mutate(
      { data: { boardContent: topic, language: "Turkish" } },
      { onSuccess: (res) => setQuiz(res.questions) }
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 pb-4 gap-4">
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Test oluşturulacak konuyu gir... (örn: Osmanlı İmparatorluğu, Asit-Baz tepkimeleri)"
          className="bg-white/5 border-white/10 rounded-xl min-h-[100px] resize-none focus-visible:ring-primary"
        />
        <Button type="submit" className="h-12 rounded-xl gap-2" disabled={!topic.trim() || quizMutation.isPending}>
          {quizMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileQuestion className="w-4 h-4" />}
          Test Üret
        </Button>
      </form>

      {quiz && (
        <ScrollArea className="flex-1">
          <div className="space-y-5 pb-4">
            {quiz.map((q: any, i: number) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-5 space-y-3">
                <p className="font-semibold text-sm">{i + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt: string, j: number) => {
                    const selected = answers[i] === j;
                    const isCorrect = j === q.correctAnswer;
                    const show = revealed[i];
                    return (
                      <button
                        key={j}
                        onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left text-sm border transition-all
                          ${show && isCorrect ? "bg-green-500/20 border-green-500/40 text-green-300" : ""}
                          ${show && selected && !isCorrect ? "bg-red-500/20 border-red-500/40 text-red-300" : ""}
                          ${!show && selected ? "bg-primary/20 border-primary/40 text-primary" : ""}
                          ${!show && !selected ? "bg-black/20 border-white/5 hover:bg-white/5" : ""}
                        `}
                      >
                        <span className="w-6 h-6 rounded-lg border border-white/10 flex items-center justify-center text-xs font-bold shrink-0">
                          {String.fromCharCode(65 + j)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-accent"
                  onClick={() => setRevealed((r) => ({ ...r, [i]: true }))}
                >
                  Cevabı Göster
                </Button>
                {revealed[i] && (
                  <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-muted-foreground">
                    <span className="font-medium text-accent-foreground">Doğru: {q.options[q.correctAnswer]}</span>
                    <br />{q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
