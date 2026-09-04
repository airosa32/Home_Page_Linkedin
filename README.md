# Airosa — Site de Serviços

Site pessoal de **Tiago Airosa**, reunindo as frentes de atuação em um só lugar: Análise de Dados & IA, Desenvolvimento de Software, Engenharia de Processos, Automação e Suporte Técnico.

Construído em **HTML, CSS e JavaScript puro** — sem framework, sem build, sem dependência de servidor. Hospedado gratuitamente no GitHub Pages.

---

## Estrutura de arquivos

```
index.html                 → Home
sobre.html                  → Sobre (trajetória, experiência, ferramentas)
faq.html                     → Perguntas frequentes
contato.html                 → Contato (formulário + canais + chat)
servicos/
  dados-ia.html
  desenvolvimento.html
  processos.html
  automacao.html
  suporte.html
css/
  style.css                  → todo o estilo do site (design system, animações)
js/
  main.js                     → menu lateral, parallax, reveal on scroll, botões, cards
  chat-widget.js               → widget de chat (assistente de IA)
```

---

## Como rodar localmente

Abrir o `index.html` direto com duplo clique pode não funcionar 100% (menu, parallax etc.). O mais seguro é subir um servidor local simples:

```bash
# dentro da pasta do site
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador.

---

## Como publicar (GitHub Pages)

Repositório: [`airosa32/Home_Page_Linkedin`](https://github.com/airosa32/Home_Page_Linkedin)

1. Envie todos os arquivos e pastas pra raiz do repositório (`git add . && git commit -m "..." && git push`).
2. No repositório, vá em **Settings → Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/ (root)`.
4. Salve. Em 1–2 minutos o site fica no ar em:
   **https://airosa32.github.io/Home_Page_Linkedin/**

---

## Formulário de contato (recebe por e-mail via Formspree)

O GitHub Pages não roda backend, então o formulário sozinho não manda e-mail. Ele já está programado pra usar o [Formspree](https://formspree.io) (grátis até 50 mensagens/mês) — falta só o ID:

1. Crie uma conta grátis em [formspree.io](https://formspree.io) com o e-mail `airosa32@gmail.com`.
2. Crie um novo formulário — você recebe um endpoint tipo `https://formspree.io/f/xxxxxxx`.
3. Em `contato.html`, troque `SEU_ID_AQUI` pelo código recebido, na linha:
   ```html
   <form ... action="https://formspree.io/f/SEU_ID_AQUI" method="POST">
   ```
4. Pronto — o formulário já mostra "Enviando...", confirma com ícone verde se der certo, ou avisa com ícone laranja se falhar. Nada mais precisa ser feito no código.

**Status atual:** endpoint ainda não configurado (`SEU_ID_AQUI` no lugar do ID real).

---

## Assistente de IA (widget de chat)

O site tem um widget de chat completo (botão flutuante, painel, indicador de "digitando", histórico de mensagens) em `js/chat-widget.js`. **Ele já funciona hoje**, sem precisar de nenhuma configuração: tem uma base de conhecimento local (dentro do próprio `chat-widget.js`, na constante `KNOWLEDGE_BASE`) com respostas sobre serviços, tecnologias, contato, orçamento e prazo — quando alguém pergunta algo, o widget procura por palavras-chave e responde com o conteúdo certo.

Isso **não é uma IA de verdade** (não entende contexto, só bate palavra-chave), mas cobre bem as perguntas mais comuns sem depender de nenhum serviço externo. Pra editar as respostas ou adicionar novas perguntas, mexa direto na lista `KNOWLEDGE_BASE` no arquivo.

### Upgrade pra uma IA de verdade (opcional)
Se quiser respostas mais inteligentes (que entendem qualquer pergunta, não só palavras-chave), dá pra conectar um serviço de IA de verdade. **Por quê não vem assim por padrão:** colocar uma chave de API de IA direto no JavaScript exporia essa chave pra qualquer visitante que abrisse "Ver código-fonte" da página. Por segurança, esse modo só ativa se você configurar um endpoint próprio.

### Como ativar (gratuito, via Cloudflare Workers)

1. Crie uma conta em [workers.cloudflare.com](https://workers.cloudflare.com).
2. Crie um novo Worker com este código (exemplo usando a API da Anthropic):

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

3. Adicione a variável secreta `ANTHROPIC_API_KEY` nas configurações do Worker, com a chave gerada em [console.anthropic.com](https://console.anthropic.com).
4. Publique — você recebe uma URL tipo `https://airosa-chat.SEU-USUARIO.workers.dev`.
5. Em `js/chat-widget.js`, troque:
   ```js
   const AIROSA_CHAT_ENDPOINT = '';
   ```
   por:
   ```js
   const AIROSA_CHAT_ENDPOINT = 'https://airosa-chat.SEU-USUARIO.workers.dev';
   ```

Esse mesmo esquema funciona com qualquer outro provedor de IA (OpenAI, Gemini, etc.) — só muda a URL e o corpo da requisição dentro do Worker.

**Status atual:** respondendo com a base de conhecimento local (funcional). Endpoint de IA de verdade ainda não configurado (opcional).

---

## Pendências

- [ ] Configurar o ID do Formspree em `contato.html`
- [ ] Conectar o endpoint de IA em `js/chat-widget.js` (opcional)
- [ ] Trocar as imagens/painéis decorativos por fotos ou cases reais, se desejado

---

## Créditos

Desenvolvido para **Tiago Airosa** — [LinkedIn](https://www.linkedin.com/in/tiago-airosa) · [GitHub](https://github.com/airosa32)
