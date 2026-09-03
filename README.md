# Site de serviços

## Estrutura
```
index.html          → Home
sobre.html           → Sobre
faq.html              → Perguntas frequentes
contato.html          → Contato
servicos/
  dados-ia.html
  desenvolvimento.html
  processos.html
  automacao.html
  suporte.html
css/style.css         → todo o estilo do site
js/main.js             → menu mobile, parallax e animações de entrada
```

## Como publicar no GitHub Pages
1. Crie um repositório novo no GitHub (ex: `meu-site`).
2. Suba todos esses arquivos e pastas pra raiz do repositório (mantendo a estrutura acima).
3. No repositório, vá em **Settings → Pages**.
4. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
5. Salve. Em alguns minutos o site fica no ar em `https://seu-usuario.github.io/meu-site/`.

## Como testar localmente antes de subir
Não dá pra abrir o `index.html` direto no navegador com duplo clique em alguns casos (o menu/parallax funcionam, mas é mais seguro rodar um servidor local):

```bash
# dentro da pasta do site
python3 -m http.server 8000
```
Depois abra `http://localhost:8000` no navegador.

## Formulário de contato — como ativar (recebe por e-mail)
O GitHub Pages **não tem backend** (não roda Python, PHP, etc.), então o formulário sozinho não consegue mandar e-mail. Ele já está pronto pra usar o [Formspree](https://formspree.io) (grátis até 50 mensagens/mês, chega direto no seu e-mail) — só falta o seu ID:

1. Crie uma conta grátis em [formspree.io](https://formspree.io) usando o e-mail `airosa32@gmail.com` (ou o que preferir receber).
2. Crie um novo formulário ("New Form") — o Formspree te dá um endpoint tipo `https://formspree.io/f/xxxxxxx`.
3. No arquivo `contato.html`, ache a linha:
```html
<form class="contact-form reveal" id="contactForm" action="https://formspree.io/f/SEU_ID_AQUI" method="POST">
```
e troque `SEU_ID_AQUI` pelo código que o Formspree te deu.
4. Pronto — o formulário já está programado pra: mostrar "Enviando...", confirmar com um ícone de sucesso (verde) se der certo, ou avisar com um ícone de aviso (laranja) se falhar, tudo automaticamente. Não precisa mexer em mais nada.

Enquanto o `SEU_ID_AQUI` não for trocado, o site mostra uma mensagem educada avisando que ainda não está conectado, em vez de fingir que enviou.

## O que falta preencher (marcado no código como texto entre colchetes)
- `sobre.html`: sua trajetória/formação real
- `faq.html`: as respostas de cada pergunta
- `contato.html`: número de WhatsApp, e-mail e LinkedIn reais
- Nome da marca: hoje está como "seunome" em todas as páginas (logo e rodapé) — trocar pelo nome definitivo

## Agente de IA (widget de chat)

O site já tem um widget de chat completo (botão flutuante no canto inferior direito, com painel, indicador de "digitando" e histórico de mensagens). A interface está 100% pronta — o que falta é conectar a um serviço de IA de verdade.

### Por que não vem já conectado
GitHub Pages não roda nenhum código no servidor. Se a chave de API de um serviço de IA (Claude, GPT, etc.) fosse colocada direto no `js/chat-widget.js`, qualquer pessoa que abrisse o "Ver código-fonte" da página conseguiria roubar essa chave. Por isso o widget está com o endpoint vazio (`AIROSA_CHAT_ENDPOINT = ''`) e mostra uma mensagem explicando isso, em vez de fingir que está funcionando.

### Como ativar de verdade (gratuito)
A forma mais simples e segura é criar um pequeno "proxy" que guarda a chave escondida e só repassa a pergunta pra IA. Um jeito rápido é usar **Cloudflare Workers** (tem plano gratuito generoso):

1. Crie uma conta em [workers.cloudflare.com](https://workers.cloudflare.com).
2. Crie um novo Worker com um código parecido com este (exemplo usando a API da Anthropic):

```js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const { message } = await request.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY, // guardada como "secret" no Worker, nunca exposta
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: 'Você é o assistente do site da Airosa, especialista em análise de dados, desenvolvimento, automação e suporte técnico. Responda de forma curta e direta, ajudando o visitante a entender qual serviço combina com o problema dele.',
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text || 'Não consegui responder agora.';

    return new Response(JSON.stringify({ reply }), {
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*', // troque pelo domínio do seu site em produção
      },
    });
  },
};
```

3. Nas configurações do Worker, adicione a variável secreta `ANTHROPIC_API_KEY` com sua chave da [console.anthropic.com](https://console.anthropic.com).
4. Publique o Worker — você vai receber uma URL tipo `https://airosa-chat.SEU-USUARIO.workers.dev`.
5. No arquivo `js/chat-widget.js`, troque a linha:
```js
const AIROSA_CHAT_ENDPOINT = '';
```
por:
```js
const AIROSA_CHAT_ENDPOINT = 'https://airosa-chat.SEU-USUARIO.workers.dev';
```
6. Pronto — o widget passa a responder de verdade.

Esse mesmo esquema funciona com qualquer outro provedor de IA (OpenAI, Gemini, etc.) — só muda a URL e o formato do corpo da requisição dentro do Worker.
