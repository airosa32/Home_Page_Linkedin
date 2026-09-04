// ============================================================
// Widget de chat com base de conhecimento local — responde
// perguntas sobre serviços, tecnologias e contato usando o
// próprio conteúdo do site, sem precisar de API externa nenhuma.
// Reconhece saudação, se apresenta, e ignora acento/maiúscula na
// hora de comparar (normaliza o texto antes de buscar).
//
// Se um AIROSA_CHAT_ENDPOINT for configurado (veja o README), esse
// vira o modo "IA de verdade" e tem prioridade sobre a base local.
// ============================================================

const AIROSA_CHAT_ENDPOINT = '';

// Tira acento, baixa caixa e aparece com espaço nas pontas — isso
// deixa a busca por palavra-chave imune a "não" vs "nao", "É" vs
// "e", etc. Sem isso, qualquer variação de digitação passava batido.
function normalize(str) {
  return ' ' + str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[?!.,;]/g, '') + ' ';
}

// ---- Base de conhecimento: cada entrada tem palavras-chave já
// normalizadas (sem acento) e a resposta que usa o conteúdo real do
// site. A ordem não importa — quem pontuar mais palavras batendo
// na mensagem vence.
const KNOWLEDGE_BASE = [
  {
    id: 'saudacao',
    keywords: [' oi ', ' ola', 'bom dia', 'boa tarde', 'boa noite', ' eae', ' e ai', ' hey ', ' hello ', 'tudo bem', 'quem e voce', 'quem e vc', 'o que voce faz', 'o que vc faz', 'o que voce e', 'o que e isso', 'oque voce faz'],
    reply: 'Oi! Sou o assistente virtual da Airosa. Posso te ajudar com informações sobre os serviços (Dados & IA, Desenvolvimento, Engenharia de processos, Automação e Suporte técnico), tecnologias usadas, orçamento, prazo, ou te colocar em contato direto. O que você gostaria de saber?',
  },
  {
    id: 'ajuda',
    keywords: [' ajuda', 'o que voce pode', 'o que vc pode', 'como funciona esse chat', 'me ajuda', 'opcoes', 'menu'],
    reply: 'Posso te ajudar com: Dados & IA, Desenvolvimento, Engenharia de processos, Automação, Suporte técnico, tecnologias usadas, orçamento, prazo de entrega, atendimento remoto/presencial e formas de contato. É só perguntar sobre qualquer um desses.',
  },
  {
    id: 'agradecimento',
    keywords: ['obrigad', ' valeu', ' vlw ', ' thanks'],
    reply: 'De nada! Qualquer outra dúvida sobre os serviços, é só perguntar. E se quiser conversar direto, chama no WhatsApp: +55 12 98808-2556.',
  },
  {
    id: 'despedida',
    keywords: [' tchau', 'ate mais', ' falou ', ' flw '],
    reply: 'Até mais! Se precisar de algo, o WhatsApp é +55 12 98808-2556 e o e-mail é airosa32@gmail.com. Atendimento todos os dias, das 7h às 22h.',
  },
  {
    id: 'contratar',
    keywords: ['quero contratar', 'como contrato', 'como faco pra contratar', 'quero fazer um projeto', 'quero um orcamento', 'preciso de um servico', 'preciso de ajuda com'],
    reply: 'Ótimo! O primeiro passo é contar o desafio pelo formulário de contato ou direto no WhatsApp (+55 12 98808-2556) — a partir disso, o retorno vem com um diagnóstico claro do que faz sentido pro seu caso.',
  },
  {
    id: 'dados-ia',
    keywords: [' dados', ' ia ', 'inteligencia artificial', 'machine learning', 'dashboard', ' kpi', 'chatbot', 'deep learning', 'analise', 'previsao'],
    reply: 'Dados & IA é a solução principal: análise de dados e KPIs, dashboards, machine learning, deep learning, implementação de IA e chatbots. Cada entrega vai até a decisão, não só até o número. Veja a página "Dados & IA" no menu pra mais detalhes.',
  },
  {
    id: 'desenvolvimento',
    keywords: ['desenvolvimento', ' site', ' sistema', ' app ', 'aplicativo', 'django', 'desktop', 'mobile', 'flutter', 'programa'],
    reply: 'Em Desenvolvimento entram: sites institucionais (HTML/CSS/JS), sistemas web em Django, aplicações desktop em Python, apps mobile em Flutter, e manutenção de sistemas já existentes. Veja a página "Desenvolvimento" no menu.',
  },
  {
    id: 'processos',
    keywords: [' processo', ' fluxo', 'padroniza', 'velocidade', 'performance', 'gargalo'],
    reply: 'Engenharia de Processos cobre mapeamento de fluxo, padronização e maximização de velocidade — aplicando fundamentos reais de ciência da computação, não só ferramenta pronta. Veja a página "Engenharia de processos".',
  },
  {
    id: 'automacao',
    keywords: ['automa', ' n8n', 'integracao'],
    reply: 'Automação inclui scripts em Python, fluxos visuais com n8n, e integrações entre sistemas que hoje não conversam entre si (planilha, e-mail, WhatsApp, CRM). Veja a página "Automação".',
  },
  {
    id: 'suporte',
    keywords: ['suporte', 'manutencao', ' pc ', 'computador', 'notebook', 'celular', 'impressora', 'backup', 'formatacao'],
    reply: 'Suporte técnico cobre manutenção de PCs/notebooks, celulares, impressoras, backup e recuperação de dados, e consultoria de compra de equipamento. Veja a página "Suporte técnico".',
  },
  {
    id: 'tecnologias',
    keywords: ['tecnologia', 'ferramenta', ' stack', 'linguagem', 'python', ' sql', 'docker', ' aws', ' gcp', 'linux', 'zabbix', 'grafana'],
    reply: 'As principais tecnologias usadas: Python, Django, SQL, Pandas, Scikit-learn, Power BI, Docker, AWS, GCP, Linux, Zabbix e Grafana — escolhidas conforme o que cada projeto realmente precisa, não por modismo. Mais na página "Sobre".',
  },
  {
    id: 'contato',
    keywords: ['contato', 'whatsapp', 'telefone', ' numero', 'email', 'e-mail', 'falar com', 'linkedin', 'github'],
    reply: 'Você pode chamar no WhatsApp (+55 12 98808-2556), mandar e-mail pra airosa32@gmail.com, ou chamar pelo LinkedIn (/tiago-airosa) e GitHub (/airosa32). Atendimento todos os dias, das 7h às 22h.',
  },
  {
    id: 'orcamento',
    keywords: ['preco', 'orcamento', ' valor', 'quanto custa', 'quanto cobra'],
    reply: 'O modelo de orçamento varia conforme o projeto: pode ser fechado (escopo definido) ou por hora, dependendo do que fizer mais sentido pra cada caso. Pra um valor exato, o ideal é mandar os detalhes pelo formulário de contato ou WhatsApp.',
  },
  {
    id: 'prazo',
    keywords: [' prazo', 'quanto tempo', ' demora', ' entrega'],
    reply: 'O prazo varia de acordo com a complexidade do projeto. Depois de um diagnóstico inicial, um prazo específico é definido antes de começar.',
  },
  {
    id: 'modalidade',
    keywords: [' remoto', 'presencial'],
    reply: 'Atende os dois cenários, remoto ou presencial, de acordo com a necessidade do projeto.',
  },
  {
    id: 'tipo-cliente',
    keywords: ['pessoa fisica', ' empresa', ' cnpj', ' pj '],
    reply: 'Atende tanto pessoa física quanto empresa, de acordo com a necessidade do projeto.',
  },
  {
    id: 'sobre',
    keywords: [' sobre', 'experiencia', 'formacao', 'curriculo', 'trajetoria', 'tiago', 'airosa'],
    reply: 'Tiago Airosa é bacharel em Ciências da Computação (UNIP) e técnico em Ciência de Dados (Escola DNC), atuando como Analista de Sistemas de IA. O raciocínio analítico desse trabalho é aplicado em todas as frentes do site. Mais na página "Sobre".',
  },
  {
    id: 'pos-entrega',
    keywords: ['suporte pos', 'depois da entrega', 'garantia'],
    reply: 'Sim, há uma janela de suporte após a entrega para ajustes e dúvidas.',
  },
  {
    id: 'escopo',
    keywords: [' escopo', 'nao sei o que quero', 'definir o projeto'],
    reply: 'Não é necessário chegar com tudo definido — parte do processo é justamente ajudar a transformar o problema em um escopo claro.',
  },

  // ---- Indecisão / não sabe o que precisa ----
  {
    id: 'indecisao',
    keywords: ['nao sei o que preciso', 'nao sei qual servico', 'qual servico e pra mim', 'nao sei por onde comecar', 'me ajuda a escolher', 'tenho um problema mas', 'qual desses e pra mim'],
    reply: 'Sem problema — me conta o que está acontecendo, mesmo sem saber o nome técnico. Alguns exemplos: "meus dados estão bagunçados" → Dados & IA. "preciso de um site ou sistema" → Desenvolvimento. "um processo do meu negócio trava" → Engenharia de processos. "faço a mesma tarefa manual toda semana" → Automação. "meu PC/celular tá com problema" → Suporte técnico. Qual dessas situações mais parece com a sua?',
  },
  {
    id: 'nao-sei-nome',
    keywords: ['nao sei o nome disso', 'nao sei como se chama', 'nao sei explicar', 'e dificil de explicar'],
    reply: 'Tranquilo, não precisa saber o termo técnico — só descreve o problema com suas palavras (ex: "minha planilha vive dando erro" ou "gasto muito tempo copiando dado de um lugar pro outro") que dá pra identificar qual solução encaixa.',
  },

  // ---- Serviços específicos de Dados & IA ----
  {
    id: 'analise-kpi',
    keywords: ['analise de dados', ' kpi', 'indicador', 'relatorio que ninguem entende'],
    reply: 'Análise de dados & KPIs não para em "o que aconteceu": vai até "por que aconteceu" e "o que fazer a respeito" — cada análise entrega uma recomendação de ação, não só um número. Ideal pra quem tem dados mas não sabe o que fazer com eles.',
  },
  {
    id: 'engenharia-dados',
    keywords: ['engenharia de dados', 'organizar dados', 'limpar dados', 'dados bagunca', 'dados espalhados'],
    reply: 'Engenharia de dados organiza, limpa e estrutura dados espalhados em planilhas ou sistemas diferentes, transformando isso numa base confiável de análise.',
  },
  {
    id: 'dashboards',
    keywords: [' painel ', 'visualizacao de dados', 'power bi'],
    reply: 'Os dashboards não só mostram número — respondem uma pergunta específica do negócio e apontam qual decisão tomar a partir dela. Ideal pra gestores que precisam de visão rápida.',
  },

  // ---- Serviços específicos de Desenvolvimento ----
  {
    id: 'sites',
    keywords: ['site institucional', 'landing page', 'portfolio', 'presenca online'],
    reply: 'Sites institucionais em HTML/CSS/JS: rápidos, leves, sem precisar de servidor complexo. Ideal pra portfólio, landing page ou presença online simples.',
  },
  {
    id: 'sistemas-web',
    keywords: ['sistema web', 'painel administrativo', 'sistema de cadastro', 'sistema proprio'],
    reply: 'Sistemas web em Django: plataformas robustas com banco de dados, painel administrativo e chatbot integrado. Ideal pra empresas que precisam de sistema próprio de cadastro/gestão.',
  },
  {
    id: 'apps-desktop',
    keywords: ['aplicacao desktop', 'programa para windows', 'ferramenta offline', 'programa instalavel'],
    reply: 'Aplicações desktop em Python: programas instaláveis pra Windows/Linux, rodando localmente. Ideal pra negócios que precisam de ferramenta interna offline.',
  },
  {
    id: 'apps-mobile',
    keywords: ['app mobile', 'aplicativo para celular', 'android', ' ios ', 'aplicativo proprio'],
    reply: 'Apps mobile em Flutter/Dart/Flet: aplicativo multiplataforma (Android/iOS) a partir de uma única base de código. Ideal pra quem quer levar o serviço pro celular do cliente.',
  },
  {
    id: 'manutencao-sistema',
    keywords: ['manutencao de sistema', 'corrigir bug', 'atualizar site', 'sistema parado no tempo', 'meu site quebrou'],
    reply: 'Manutenção e evolução de sistemas existentes: correção de bugs, novas funcionalidades e atualização de projetos já em produção. Ideal pra quem já tem um site/sistema que parou no tempo.',
  },

  // ---- Serviços específicos de Processos ----
  {
    id: 'mapeamento-fluxo',
    keywords: ['mapear processo', 'mapeamento de fluxo', 'fluxograma', 'como funciona meu processo'],
    reply: 'Mapeamento de fluxo: desenha o processo atual na prática (não achismo), identificando cada etapa e onde ela trava.',
  },
  {
    id: 'padronizacao',
    keywords: ['padronizacao', 'padrao de processo', 'cada um faz de um jeito'],
    reply: 'Padronização define um padrão único pro processo/código/fluxo, eliminando retrabalho e a bagunça de "cada um fazer de um jeito".',
  },
  {
    id: 'velocidade',
    keywords: ['otimizar performance', 'sistema lento', 'processo lento', 'demora muito pra rodar'],
    reply: 'Maximização de velocidade otimiza a performance de processos e sistemas já existentes, aplicando complexidade algorítmica, estrutura de dados e arquitetura — pra reduzir tempo de execução de verdade, não só automatizar mais uma etapa.',
  },

  // ---- Serviços específicos de Automação ----
  {
    id: 'automacao-python',
    keywords: ['script python', 'automatizar tarefa', 'tarefa manual repetitiva'],
    reply: 'Automação com Python: scripts sob medida pra tarefas específicas como extração de dados, envio de relatórios e integração entre sistemas.',
  },
  {
    id: 'automacao-n8n',
    keywords: [' n8n', 'fluxo visual', 'conectar ferramentas sem codar'],
    reply: 'Automação com n8n: fluxos visuais conectando ferramentas (planilhas, e-mail, WhatsApp, CRMs) sem precisar codar do zero.',
  },
  {
    id: 'integracoes',
    keywords: ['conectar sistemas', 'integrar ferramentas', 'sistemas nao conversam'],
    reply: 'Integrações entre sistemas conectam plataformas que hoje não conversam entre si — por exemplo, site + planilha + WhatsApp + CRM, tudo junto.',
  },

  // ---- Serviços específicos de Suporte ----
  {
    id: 'manutencao-pc',
    keywords: [' formatar', ' virus', 'lentidao no pc', 'pc lento', 'notebook lento'],
    reply: 'Manutenção de PCs/notebooks: formatação, limpeza, upgrade, remoção de vírus e otimização de performance.',
  },
  {
    id: 'manutencao-celular',
    keywords: ['problema no celular', 'celular lento', 'celular travando'],
    reply: 'Manutenção de celulares: diagnóstico e resolução de problemas de software.',
  },
  {
    id: 'impressora',
    keywords: ['impressora', 'configurar impressora'],
    reply: 'Manutenção de impressoras e outros equipamentos: configuração, resolução de erros e manutenção preventiva.',
  },
  {
    id: 'backup',
    keywords: ['recuperar arquivo', 'perdi meus arquivos', ' backup'],
    reply: 'Backup e recuperação de dados: configuração de backup automático e tentativa de recuperação de arquivos perdidos ou corrompidos.',
  },
  {
    id: 'consultoria-compra',
    keywords: ['qual notebook comprar', 'comprar computador', 'qual pc comprar', 'qual equipamento comprar'],
    reply: 'Consultoria de compra de equipamento: ajuda a escolher o equipamento certo pro uso e orçamento, evitando compra errada.',
  },

  // ---- Metodologia / diferencial ----
  {
    id: 'metodologia',
    keywords: ['descritivo', 'diagnostico', 'preditivo', 'prescritivo', 'metodologia', '4 niveis', 'quatro niveis'],
    reply: 'O método usado passa por 4 níveis: descritivo (o que aconteceu), diagnóstico (por que aconteceu), preditivo (o que vai acontecer) e prescritivo (o que fazer a respeito). A maioria das entregas de mercado para no descritivo — aqui vai até o prescritivo.',
  },
  {
    id: 'diferencial',
    keywords: ['por que escolher', ' diferencial', ' vantagem', 'por que voce', 'o que te diferencia'],
    reply: 'O diferencial: cada entrega não é só o artefato técnico (dashboard, script, app) — vem com o diagnóstico do problema real e a decisão que precisa ser tomada a partir dele, com raiz em ciência da computação, não só ferramenta pronta.',
  },

  // ---- Sobre o próprio chat ----
  {
    id: 'e-um-bot',
    keywords: ['voce e um robo', 'voce e real', 'isso e um bot', 'voce e humano', 'voce e uma ia mesmo'],
    reply: 'Sou um assistente automático que responde com base no conteúdo do site — não sou uma pessoa real digitando. Pra falar direto com o Tiago, chama no WhatsApp: +55 12 98808-2556.',
  },
];

// Procura a entrada da base com mais palavras-chave batendo na mensagem.
function searchKnowledgeBase(rawMessage) {
  const text = normalize(rawMessage);
  let best = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  return bestScore > 0 ? best.reply : null;
}

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

const FALLBACK_REPLY = 'Não achei uma resposta pronta pra isso. Posso ajudar com: Dados & IA, Desenvolvimento, Engenharia de processos, Automação, Suporte técnico, tecnologias usadas, orçamento, prazo ou contato. O que você gostaria de saber? Ou chama direto no WhatsApp: +55 12 98808-2556.';

chatForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;

  addChatMessage(text, 'user');
  chatInput.value = '';
  showTyping();

  // Com backend de IA de verdade configurado, ele tem prioridade.
  if (AIROSA_CHAT_ENDPOINT) {
    try {
      const res = await fetch(AIROSA_CHAT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error('resposta não OK');
      const data = await res.json();
      hideTyping();
      addChatMessage(data.reply || FALLBACK_REPLY, 'bot');
    } catch (err) {
      hideTyping();
      addChatMessage('Não consegui me conectar ao assistente agora. Tenta de novo em instantes.', 'bot');
    }
    return;
  }

  // Sem backend: responde com a base de conhecimento local do site.
  setTimeout(() => {
    hideTyping();
    const answer = searchKnowledgeBase(text);
    addChatMessage(answer || FALLBACK_REPLY, 'bot');
  }, 550);
});
