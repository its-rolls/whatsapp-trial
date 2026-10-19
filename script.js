// ---------- Data ----------
const STORAGE_KEY = "chatapp-state-v1";

const defaultChats = [
  { id: 1, name: "Amina", unread: 2, messages: [
    { from: "in", text: "Hey! Are we still meeting tomorrow?", time: Date.now() - 3600e3 },
    { from: "in", text: "Let me know when you're free 🙂", time: Date.now() - 3500e3 },
  ]},
  { id: 2, name: "Kevin", unread: 0, messages: [
    { from: "out", text: "Sent you the files.", time: Date.now() - 86400e3, read: true },
    { from: "in", text: "Got them, thanks!", time: Date.now() - 86000e3 },
  ]},
  { id: 3, name: "Family Group", unread: 5, messages: [
    { from: "in", text: "Dinner at 7 on Sunday.", time: Date.now() - 7200e3 },
  ]},
  { id: 4, name: "Work Team", unread: 0, messages: [
    { from: "in", text: "Standup moved to 10am.", time: Date.now() - 172800e3 },
  ]},
];

const replies = [
  "Sounds good!", "Okay 👍", "Haha, nice.", "Let me check and get back to you.",
  "I'm on my way.", "Can we talk later?", "Perfect, see you then!", "😂😂",
];

let chats = load();
let activeId = null;

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch (e) {}
  return defaultChats;
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(chats)); } catch (e) {}
}

// ---------- Elements ----------
const $ = (id) => document.getElementById(id);
const app = $("app"), chatList = $("chatList"), search = $("search");
const empty = $("empty"), chatWindow = $("chatWindow");
const chatName = $("chatName"), chatAvatar = $("chatAvatar"), chatStatus = $("chatStatus");
const messagesEl = $("messages"), msgInput = $("msgInput");
const sendBtn = $("sendBtn"), backBtn = $("backBtn");
const emojiBtn = $("emojiBtn"), emojiPanel = $("emojiPanel");

// ---------- Helpers ----------
const initials = (name) => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function dayLabel(ts) {
  const d = new Date(ts), today = new Date();
  const diff = Math.floor((new Date(today.toDateString()) - new Date(d.toDateString())) / 86400e3);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}
function lastMsg(chat) { return chat.messages[chat.messages.length - 1]; }

// ---------- Render chat list ----------
function renderList() {
  const q = search.value.trim().toLowerCase();
  chatList.innerHTML = "";

  chats
    .filter(c => c.name.toLowerCase().includes(q))
    .sort((a, b) => (lastMsg(b)?.time || 0) - (lastMsg(a)?.time || 0))
    .forEach(chat => {
      const last = lastMsg(chat);
      const li = document.createElement("li");
      li.className = "chat-item" + (chat.id === activeId ? " active" : "");
      li.innerHTML = `
        <div class="avatar">${initials(chat.name)}</div>
        <div class="chat-info">
          <div class="chat-row">
            <strong>${escapeHtml(chat.name)}</strong>
            <small>${last ? fmtTime(last.time) : ""}</small>
          </div>
          <div class="chat-row">
            <span class="chat-preview">${last ? escapeHtml(last.text) : ""}</span>
            ${chat.unread ? `<span class="badge">${chat.unread}</span>` : ""}
          </div>
        </div>`;
      li.onclick = () => openChat(chat.id);
      chatList.appendChild(li);
    });
}

// ---------- Render messages ----------
function renderMessages() {
  const chat = chats.find(c => c.id === activeId);
  messagesEl.innerHTML = "";
  let lastDay = "";

  chat.messages.forEach(m => {
    const label = dayLabel(m.time);
    if (label !== lastDay) {
      const d = document.createElement("div");
      d.className = "day-label";
      d.textContent = label;
      messagesEl.appendChild(d);
      lastDay = label;
    }
    const el = document.createElement("div");
    el.className = "msg " + m.from;
    el.innerHTML = `
      <div>${escapeHtml(m.text)}</div>
      <div class="meta">
        <span>${fmtTime(m.time)}</span>
        ${m.from === "out" ? `<span class="tick ${m.read ? "read" : ""}">✓✓</span>` : ""}
      </div>`;
    messagesEl.appendChild(el);
  });
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// ---------- Actions ----------
function openChat(id) {
  activeId = id;
  const chat = chats.find(c => c.id === id);
  chat.unread = 0;
  empty.classList.add("hidden");
  chatWindow.classList.remove("hidden");
  app.classList.add("chat-open");
  chatName.textContent = chat.name;
  chatAvatar.textContent = initials(chat.name);
  chatStatus.textContent = "online";
  renderList();
  renderMessages();
  msgInput.focus();
  save();
}

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || activeId === null) return;
  const chat = chats.find(c => c.id === activeId);

  chat.messages.push({ from: "out", text, time: Date.now(), read: false });
  msgInput.value = "";
  renderMessages();
  renderList();
  save();
  simulateReply(chat.id);
}

function simulateReply(chatId) {
  const chat = chats.find(c => c.id === chatId);

  setTimeout(() => {
    chat.messages.forEach(m => { if (m.from === "out") m.read = true; });
    if (activeId === chatId) { renderMessages(); chatStatus.textContent = "typing..."; }
  }, 800);

  setTimeout(() => {
    chat.messages.push({
      from: "in",
      text: replies[Math.floor(Math.random() * replies.length)],
      time: Date.now(),
    });
    if (activeId === chatId) { renderMessages(); chatStatus.textContent = "online"; }
    else chat.unread++;
    renderList();
    save();
  }, 2000);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Emoji panel ----------
["😀","😂","😍","😎","🙏","👍","🎉","❤️","😢","😮","🔥","💯","🙌","🤝","😴","🤔"].forEach(e => {
  const s = document.createElement("span");
  s.textContent = e;
  s.onclick = () => { msgInput.value += e; msgInput.focus(); };
  emojiPanel.appendChild(s);
});
emojiBtn.onclick = () => emojiPanel.classList.toggle("hidden");

// ---------- Events ----------
sendBtn.onclick = sendMessage;
msgInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
search.addEventListener("input", renderList);
backBtn.onclick = () => {
  app.classList.remove("chat-open");
  activeId = null;
  chatWindow.classList.add("hidden");
  empty.classList.remove("hidden");
  renderList();
};

renderList();
