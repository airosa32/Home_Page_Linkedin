// ============================================================
// Widget de chat — front-end pronto, precisa de um backend pra
// virar um agente de IA de verdade. Veja a seção "Agente de IA"
// no README pra saber como conectar (Cloudflare Workers, etc.).
// ============================================================

// Troque essa URL pelo endpoint do seu backend/proxy quando tiver um.
// Enquanto estiver vazia, o widget mostra uma mensagem explicando
// que ainda não está conectado, em vez de travar ou dar erro.
const AIROSA_CHAT_ENDPOINT = '';

const chatWidget = document.getElementById('chatWidget');
const chatToggle = document.getElementById('chatToggle');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');

function toggleChat() {
  chatWidget?.classList.toggle('open');
  if (chatWidget?.classList.contains('open')) {
    setTimeout(() => chatInput?.focus(), 260);
  }
}

chatToggle?.addEventListener('click', toggleChat);

function addChatMessage(text, sender) {
  if (!chatMessages) return;
  const el = document.createElement('div');
  el.className = 'chat-msg ' + sender;
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  if (!chatMessages) return;
  const el = document.createElement('div');
  el.className = 'chat-msg bot typing';
  el.id = 'chatTyping';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  document.getElementById('chatTyping')?.remove();
}

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addChatMessage(text, 'user');
  chatInput.value = '';
  showTyping();

  // Sem backend configurado: explica isso ao invés de simular uma resposta falsa
  if (!AIROSA_CHAT_ENDPOINT) {
    setTimeout(() => {
      hideTyping();
      addChatMessage(
        'Esse assistente ainda não está conectado a um serviço de IA. Veja a seção "Agente de IA" no README do projeto pra ativar de verdade.',
        'bot'
      );
    }, 650);
    return;
  }

  try {
    const res = await fetch(AIROSA_CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    if (!res.ok) throw new Error('resposta não OK');
    const data = await res.json();
    hideTyping();
    addChatMessage(data.reply || 'Não consegui gerar uma resposta agora.', 'bot');
  } catch (err) {
    hideTyping();
    addChatMessage('Não consegui me conectar ao assistente agora. Tenta de novo em instantes.', 'bot');
  }
});
