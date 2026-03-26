const chatContainer = document.getElementById("chat");

async function askAI() {
  const questionInput = document.getElementById("question");
  const question = questionInput.value.trim();
  if(!question) return;

  // Kullanıcının mesajını ekle
  const userMsg = document.createElement("div");
  userMsg.className = "message user";
  userMsg.innerText = question;
  chatContainer.appendChild(userMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  questionInput.value = "";

  // Gemini API çağrısı
  const res = await fetch("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  const data = await res.json();

  // AI mesajını ekle
  const aiMsg = document.createElement("div");
  aiMsg.className = "message ai";
  aiMsg.innerText = data.answer;
  chatContainer.appendChild(aiMsg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}
