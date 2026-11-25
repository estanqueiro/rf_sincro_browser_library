/* ===== Treino SPA — app Vue 3 (build global via CDN) ===== */
const { createApp, ref, reactive, computed, onMounted, onUnmounted, nextTick } = Vue;

/* ---------- Router simples por hash ---------- */
function rotaAtual() {
  const h = location.hash.replace(/^#\/?/, '');
  const [sec, slug] = h.split('/');
  return { sec, slug };
}

/* ---------- Metadados dos desafios ---------- */
const DESAFIOS = [
  {
    slug: 'carregamento-atrasado', sec: 'sync', num: '01',
    titulo: 'Carregamento com atraso',
    nivel: 'facil', tags: ['Vue', 'Wait'],
    resumo: 'Conteúdo aparece vários segundos depois de clicar — o caso clássico de SPA.',
    objetivo: [
      'Clicar no botão "Carregar dados"',
      'Esperar que a lista de sensores apareça (sem usar Sleep)',
      'Validar o texto do primeiro item da lista',
    ],
    dicas: [
      {
        titulo: 'Esperas explícitas, nunca Sleep',
        corpo: 'A regra de ouro em SPAs: espere por uma condição, não por um tempo fixo. O Sleep 5s falha quando a rede está rápida e deixa o teste lento quando está lenta.',
        codigo: `Click Button    id:btn-carregar
Wait Until Element Is Visible    css:ul.resultado li    timeout=10s
Element Text Should Be    css:ul.resultado li:first-child    Sensor de temperatura`,
      },
      {
        titulo: 'XPath equivalente',
        corpo: 'O mesmo elemento localizado por XPath. Note o uso de normalize-space para ignorar espaços à volta do texto.',
        codigo: `Wait Until Element Is Visible    xpath://div[contains(@class,'resultado')]//li[1]    timeout=10s
Element Text Should Be    xpath://li[normalize-space()='Sensor de temperatura']    Sensor de temperatura`,
      },
    ],
  },
  {
    slug: 'barra-progresso', sec: 'sync', num: '02',
    titulo: 'Barra de progresso e botão desativado',
    nivel: 'facil', tags: ['Vue', 'Enabled'],
    resumo: 'Um botão só fica clicável quando o processo termina. Clicar cedo dá erro.',
    objetivo: [
      'Iniciar o processamento',
      'Esperar que o botão "Concluir pedido" fique ativado',
      'Clicar e validar a mensagem final',
    ],
    dicas: [
      {
        titulo: 'Esperar elemento estar ativado',
        corpo: 'Wait Until Element Is Enabled resolve o caso. Em cenários mais exóticos, Wait For Condition avalia uma expressão JavaScript no navegador até devolver true.',
        codigo: `Click Button    xpath://button[contains(.,'Iniciar')]
Wait Until Element Is Enabled    id:btn-concluir    timeout=15s
Click Button    id:btn-concluir
Element Text Should Be    css:p.mensagem-final    Pedido concluído`,
      },
      {
        titulo: 'Condição personalizada com JavaScript',
        corpo: 'Quando o estado não é visível no DOM (atributos, propriedades internas), avalie diretamente no navegador:',
        codigo: `Wait For Condition    document.querySelector('#btn-concluir').disabled === false    timeout=15s
Click Button    id:btn-concluir`,
      },
    ],
  },
  {
    slug: 'elemento-volatil', sec: 'sync', num: '03',
    titulo: 'Elemento que reaparece com outro id',
    nivel: 'medio', tags: ['Vue', 'Stale'],
    resumo: 'A framework re-renderiza o componente a cada 3 segundos e o id muda. XPath por id quebra.',
    objetivo: [
      'Localizar o botão "Confirmar reserva" sem depender do id',
      'Clicar nele apesar do re-render contínuo',
      'Validar a mensagem de confirmação',
    ],
    dicas: [
      {
        titulo: 'Localize por texto estável, não por id gerado',
        corpo: 'Ids gerados dinamicamente (btn-acao-4821, btn-acao-9930, …) mudam a cada render. O texto do botão é estável — use-o como âncora.',
        codigo: `Wait Until Element Is Visible    xpath://button[normalize-space()='Confirmar reserva']    timeout=10s
Click Element    xpath://button[normalize-space()='Confirmar reserva']
Element Text Should Contain    css:p.estado-reserva    Reserva #`,
      },
      {
        titulo: 'Quando o StaleElementReferenceException aparece',
        corpo: 'Se o elemento é recriado entre a localização e o clique, o Selenium lança StaleElementReferenceException. Espere pela condição e clique imediatamente; se persistir, rode o clique dentro de um pequeno loop de retry (keyword própria em Python).',
        codigo: `# Padrão de retry (keyword personalizada em Python):
# for i in range(5):
#     try:
#         Click Element    xpath://button[contains(.,'Confirmar reserva')]
#         break
#     except StaleElementReferenceException:
#         sleep(0.3)`,
      },
    ],
  },
  {
    slug: 'tabela-assincrona', sec: 'sync', num: '04',
    titulo: 'Tabela assíncrona com busca',
    nivel: 'medio', tags: ['Vue', 'Debounce', 'Tabela'],
    resumo: 'A busca tem debounce e os resultados chegam depois de um atraso, com skeletons no lugar das linhas.',
    objetivo: [
      'Pesquisar "monitor 2" no campo de busca',
      'Esperar que a tabela deixe de mostrar skeletons',
      'Validar que o contador de resultados mostra 2 resultados',
    ],
    dicas: [
      {
        titulo: 'Espere pela condição de negócio, não pelo spinner',
        corpo: 'O spinner pode aparecer e desaparecer várias vezes. A condição estável é o resultado: espere que a tabela contenha o texto esperado.',
        codigo: `Input Text    css:input.campo-busca    monitor 2
Wait Until Element Is Visible    xpath://td[normalize-space()='Monitor 27"']    timeout=10s
Element Text Should Be    css:p.contador-resultados    2 resultados`,
      },
      {
        titulo: 'Contar linhas com Get Element Count',
        corpo: 'Para validar quantas linhas a filtragem devolveu:',
        codigo: `Input Text    css:input.campo-busca    monitor 2
Wait Until Element Is Visible    xpath://td[contains(.,'Monitor')]    timeout=10s
\${linhas}=    Get Element Count    css:table.tabela-produtos tbody tr
Should Be Equal As Integers    \${linhas}    2`,
      },
    ],
  },
  {
    slug: 'scroll-infinito', sec: 'sync', num: '05',
    titulo: 'Scroll infinito',
    nivel: 'medio', tags: ['Vue', 'Scroll'],
    resumo: 'O feed carrega mais itens quando chega ao fundo. O Selenium precisa de rolar primeiro.',
    objetivo: [
      'Rolar o feed até ao fundo para acionar o carregamento',
      'Esperar que o item 20 apareça',
      'Confirmar que existem pelo menos 20 itens',
    ],
    dicas: [
      {
        titulo: 'Rolar com Execute Javascript',
        corpo: 'O scroll não acontece sozinho — o Selenium não move a página. Force-o com JavaScript e depois espere pelos novos itens.',
        codigo: `Execute Javascript    document.querySelector('.feed').scrollTop = 999999
Wait Until Element Is Visible    xpath://div[contains(@class,'feed-item')][20]    timeout=10s
\${itens}=    Get Element Count    css:div.feed-item
Should Be True    \${itens} >= 20`,
      },
      {
        titulo: 'Alternativa com scrollIntoView',
        corpo: 'Se preferir mirar num elemento específico (por exemplo, o último item visível):',
        codigo: `Execute Javascript    document.querySelector('.feed .feed-item:last-child').scrollIntoView({block:'end'})
Wait For Condition    document.querySelectorAll('.feed-item').length >= 20    timeout=10s`,
      },
    ],
  },
  {
    slug: 'autocomplete', sec: 'sync', num: '06',
    titulo: 'Autocomplete com sugestões atrasadas',
    nivel: 'medio', tags: ['Vue', 'Autocomplete'],
    resumo: 'As sugestões demoram mais de um segundo a aparecer depois de escrever. Clicar cedo falha.',
    objetivo: [
      'Escrever "por" no campo de cidade',
      'Esperar que a lista de sugestões apareça',
      'Escolher "Porto" e validar a cidade escolhida',
    ],
    dicas: [
      {
        titulo: 'Espere a lista antes de clicar',
        corpo: 'Escrever dispara o pedido, mas as sugestões chegam tarde. Espere pela lista e clique na sugestão pelo texto.',
        codigo: `Input Text    css:input.campo-cidade    por
Wait Until Element Is Visible    css:ul.sugestoes li    timeout=10s
Click Element    xpath://li[contains(@class,'item-sugestao')][normalize-space()='Porto']
Element Text Should Be    css:p.cidade-escolhida    Cidade escolhida: Porto`,
      },
      {
        titulo: 'Pressionar teclas em vez de clicar',
        corpo: 'Em autocompletes reais, a tecla ENTER também funciona e evita corridas com a animação da lista:',
        codigo: `Input Text    css:input.campo-cidade    por
Wait Until Element Is Visible    css:ul.sugestoes li    timeout=10s
Press Keys    css:input.campo-cidade    ENTER`,
      },
    ],
  },
  {
    slug: 'modal-toast', sec: 'sync', num: '07',
    titulo: 'Modal de confirmação e toast',
    nivel: 'medio', tags: ['Vue', 'Modal', 'Toast'],
    resumo: 'Guardar abre um modal; confirmar faz aparecer um toast que desaparece sozinho passados segundos.',
    objetivo: [
      'Preencher o formulário e guardar',
      'Confirmar no modal',
      'Esperar o toast de sucesso e validar que desaparece',
    ],
    dicas: [
      {
        titulo: 'Modais e toasts são elementos normais do DOM',
        corpo: 'Nesta app o modal é um overlay próprio (não um alert nativo), por isso trata-se como qualquer elemento: espere, clique, valide.',
        codigo: `Input Text    css:input.campo-nome    Ana
Input Text    css:input.campo-email    ana@exemplo.pt
Click Button    xpath://button[contains(.,'Guardar')]
Wait Until Element Is Visible    css:div.caixa-modal    timeout=5s
Click Button    xpath://button[contains(@class,'btn-confirmar')]
Wait Until Element Is Visible    css:div.toast    timeout=10s
Element Text Should Contain    css:div.toast    Alterações guardadas
Wait Until Element Is Not Visible    css:div.toast    timeout=10s`,
      },
      {
        titulo: 'Alertas nativos são diferentes',
        corpo: 'Se a app usar alert()/confirm() nativos, o fluxo é outro: Handle Alert, Accept Alert, Dismiss Alert. Nesta página treinamos o padrão moderno (overlay no DOM), que é o que Angular/Vue geram.',
      },
    ],
  },
  {
    slug: 'ids-dinamicos', sec: 'loc', num: '08',
    titulo: 'Ids gerados dinamicamente',
    nivel: 'medio', tags: ['Vue', 'XPath'],
    resumo: 'Cada carregamento gera ids diferentes para os campos do formulário de login. O id de ontem não serve hoje.',
    objetivo: [
      'Localizar os campos sem usar os ids instáveis',
      'Preencher o login com utilizador e senha',
      'Entrar e validar a mensagem de boas-vindas',
    ],
    dicas: [
      {
        titulo: 'Eixos XPath: parta do rótulo',
        corpo: 'O label é estável; o input vem a seguir. following::input[1] encontra o primeiro input depois do label.',
        codigo: `Input Text    xpath://label[normalize-space()='Utilizador']/following::input[1]    paulo
Input Text    xpath://label[normalize-space()='Senha']/following::input[1]    robot123
Click Button    xpath://button[contains(.,'Entrar')]
Element Text Should Contain    css:p.mensagem    Bem-vindo, paulo`,
      },
      {
        titulo: 'Alternativas estáveis',
        corpo: 'Também pode ancorar no placeholder ou no tipo do campo: //input[contains(@placeholder,"nome de utilizador")]. Se a app for sua, o ideal a longo prazo é pedir data-testid estável à equipa de desenvolvimento.',
        codigo: `Input Text    xpath://input[contains(@placeholder,'utilizador')]    paulo
Click Button    xpath://button[contains(@class,'botao-entrar') or contains(.,'Entrar')]`,
      },
    ],
  },
  {
    slug: 'botoes-repetidos', sec: 'loc', num: '09',
    titulo: 'Botões repetidos em cada linha',
    nivel: 'medio', tags: ['Vue', 'XPath', 'Tabela'],
    resumo: 'Cinco linhas com cinco botões "Editar" idênticos. Só o contexto da linha distingue o botão certo.',
    objetivo: [
      'Clicar em "Editar" apenas na linha da cliente Ana Silva',
      'Validar que o painel de edição mostra o nome dela',
    ],
    dicas: [
      {
        titulo: 'Suba até à linha e desça até ao botão',
        corpo: 'O padrão clássico: encontre a tr que contém o texto único, e dentro dela o botão. Um único XPath resolve.',
        codigo: `Click Element    xpath://tr[.//td[contains(.,'Ana Silva')]]//button[contains(@class,'btn-editar')]
Element Text Should Be    css:p.cliente-em-edicao    A editar: Ana Silva`,
      },
      {
        titulo: 'Índices e posição',
        corpo: 'Para o botão da 3.ª linha sem texto único: //table[contains(@class,"tabela-clientes")]//tr[3]//button. E o último: //tr[last()]//button.',
        codigo: `Click Element    xpath://table[contains(@class,'tabela-clientes')]//tr[3]//button[contains(@class,'btn-editar')]
Click Element    xpath://tr[last()]//button[contains(@class,'btn-editar')]`,
      },
    ],
  },
  {
    slug: 'checkboxes', sec: 'loc', num: '10',
    titulo: 'Checkboxes por linha',
    nivel: 'medio', tags: ['Vue', 'XPath', 'Checkbox'],
    resumo: 'Selecionar pedidos específicos numa tabela e validar o contador — o cenário de "selecionar os meus itens".',
    objetivo: [
      'Selecionar os pedidos "Laptop" e "Teclado mecânico"',
      'Validar que o contador mostra "Selecionados: 2"',
    ],
    dicas: [
      {
        titulo: 'Checkbox dentro da linha certa',
        corpo: 'Mesmo padrão do desafio anterior, agora com input[@type=checkbox].',
        codigo: `Click Element    xpath://tr[.//td[contains(.,'Laptop')]]//input[@type='checkbox']
Click Element    xpath://tr[.//td[contains(.,'Teclado')]]//input[@type='checkbox']
Element Text Should Be    css:p.contador-selecionados    Selecionados: 2`,
      },
      {
        titulo: 'Cuidado com @checked',
        corpo: 'Clicar muda a propriedade checked, mas nem sempre o atributo. Para contar caixas marcadas, leia a propriedade via JavaScript:',
        codigo: `\${marcadas}=    Execute Javascript    return document.querySelectorAll('input.chk-pedido:checked').length
Should Be Equal As Integers    \${marcadas}    2`,
      },
    ],
  },
  {
    slug: 'shadow-dom', sec: 'loc', num: '11',
    titulo: 'Componente com Shadow DOM',
    nivel: 'dificil', tags: ['Vue', 'Shadow DOM'],
    resumo: 'O botão "Adicionar ao carrinho" vive dentro de um shadow root. XPath e CSS param no hospedeiro.',
    objetivo: [
      'Clicar no botão dentro do componente ficha-produto',
      'Validar que o carrinho passou a 1 item',
    ],
    dicas: [
      {
        titulo: 'XPath não atravessa a fronteira do shadow root',
        corpo: 'O Selenium não localiza elementos dentro de shadow DOM com XPath/CSS. Use Execute Javascript para entrar pelo shadowRoot (aberto) do hospedeiro:',
        codigo: `Execute Javascript    document.querySelector('ficha-produto').shadowRoot.querySelector('button').click()
\${itens}=    Execute Javascript    return document.querySelector('ficha-produto').shadowRoot.querySelector('.carrinho').textContent
Should Contain    \${itens}    1 item`,
      },
      {
        titulo: 'A solução moderna: Browser Library',
        corpo: 'A Browser Library (Playwright) atravessa shadow DOM de forma transparente com seletores CSS. Se a sua app usa web components, considere migrar esses testes: Accept Element ou Get Text funcionam diretamente.',
        codigo: `# Com Browser Library (Playwright):
Click    ficha-produto >>> button.adicionar
Get Text    ficha-produto >>> .carrinho    contains    1 item`,
      },
    ],
  },
  {
    slug: 'iframe', sec: 'loc', num: '12',
    titulo: 'Conteúdo dentro de iframe',
    nivel: 'medio', tags: ['Vue', 'Iframe'],
    resumo: 'Um formulário de PIN vive dentro de um iframe embutido. Fora dele, o Selenium não vê nada.',
    objetivo: [
      'Entrar no iframe e preencher o PIN 4321',
      'Validar a mensagem de PIN válido',
      'Sair do iframe',
    ],
    dicas: [
      {
        titulo: 'Select Frame / Unselect Frame',
        corpo: 'Todo o conteúdo dentro do iframe exige que primeiro mude o contexto. No fim, volte ao contexto principal.',
        codigo: `Select Frame    css:iframe.moldura
Input Text    css:input.campo-pin    4321
Click Button    xpath://button[contains(.,'Validar PIN')]
Wait Until Element Is Visible    css:p.resultado-pin    timeout=5s
Element Text Should Be    css:p.resultado-pin    PIN válido
Unselect Frame`,
      },
      {
        titulo: 'iframes aninhados',
        corpo: 'Com iframes dentro de iframes, faça Select Frame em sequência (um de cada vez). Unselect Frame com o argumento ALL=true volta ao topo de uma só vez.',
        codigo: `Select Frame    css:iframe.moldura
Select Frame    css:iframe.interna
# ... interações ...
Unselect Frame    ALL=true`,
      },
    ],
  },
];

/* ---------- Componentes de cenário ---------- */

const CarregamentoAtrasado = {
  template: `
  <div>
    <button class="btn btn-primario" id="btn-carregar" @click="carregar" :disabled="!pronto || carregando">
      {{ carregando ? 'A carregar…' : 'Carregar dados' }}
    </button>
    <div v-if="carregando" style="margin-top:16px"><div class="spinner"></div></div>
    <div v-if="carregado" class="resultado">
      <ul>
        <li v-for="s in sensores" :key="s">{{ s }}</li>
      </ul>
    </div>
  </div>`,
  setup() {
    const pronto = ref(false);
    const carregando = ref(false);
    const carregado = ref(false);
    const sensores = ref([]);
    onMounted(() => { pronto.value = true; });
    function carregar() {
      carregando.value = true; carregado.value = false;
      setTimeout(() => {
        sensores.value = ['Sensor de temperatura', 'Pressão do circuito A', 'Humidade relativa', 'Consumo energético', 'Estado da válvula 3'];
        carregando.value = false; carregado.value = true;
      }, 3500);
    }
    return { pronto, carregando, carregado, sensores, carregar };
  },
};

const BarraProgresso = {
  template: `
  <div>
    <button class="btn" @click="iniciar" :disabled="aCorrer">Iniciar processamento</button>
    <div class="trilho-progresso"><div class="valor-progresso" id="barra" :style="{width: pct + '%'}"></div></div>
    <p style="font-family:var(--font-code);font-size:var(--text-xs);color:var(--text-faint)">Progresso: <span id="texto-progresso">{{ pct }}%</span></p>
    <button class="btn btn-primario" id="btn-concluir" :disabled="pct < 100" @click="concluido = true" style="margin-top:16px">Concluir pedido</button>
    <p v-if="concluido" class="mensagem-final" style="margin-top:16px;color:var(--primary);font-family:var(--font-code)">Pedido concluído</p>
  </div>`,
  setup() {
    const pct = ref(0); const aCorrer = ref(false); const concluido = ref(false);
    function iniciar() {
      concluido.value = false; aCorrer.value = true; pct.value = 0;
      const passo = () => {
        pct.value = Math.min(100, pct.value + 2);
        if (pct.value < 100) setTimeout(passo, 100); else aCorrer.value = false;
      };
      setTimeout(passo, 100);
    }
    return { pct, aCorrer, concluido, iniciar };
  },
};

const ElementoVolatil = {
  template: `
  <div>
    <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:16px">
      O botão abaixo é re-renderizado a cada 3 s com um id novo:
      <code style="font-family:var(--font-code);color:var(--text-faint)">id="btn-acao-{{ selo }}"</code>
    </p>
    <button class="btn btn-primario" :id="'btn-acao-' + selo" :key="selo" @click="confirmar(selo)">Confirmar reserva</button>
    <p v-if="reserva" class="estado-reserva" style="margin-top:16px;font-family:var(--font-code);color:var(--primary)">Reserva #{{ reserva }} confirmada</p>
  </div>`,
  setup() {
    const selo = ref(Math.floor(1000 + Math.random() * 9000));
    const reserva = ref(null);
    const timer = setInterval(() => { selo.value = Math.floor(1000 + Math.random() * 9000); }, 3000);
    onUnmounted(() => clearInterval(timer));
    function confirmar(s) { reserva.value = s; }
    return { selo, reserva, confirmar };
  },
};

const PRODUTOS = [
  ['Monitor 27"', 'Periféricos', '189,99 €', '12'],
  ['Monitor 24"', 'Periféricos', '139,99 €', '5'],
  ['Teclado mecânico K2', 'Periféricos', '89,50 €', '31'],
  ['Rato sem fios MX', 'Periféricos', '64,00 €', '0'],
  ['Portátil Ultra 14', 'Computadores', '1299,00 €', '4'],
  ['Desktop Pro M1', 'Computadores', '1899,00 €', '2'],
  ['Hub USB-C 7 portas', 'Acessórios', '49,90 €', '18'],
  ['Suporte de monitor', 'Acessórios', '34,10 €', '7'],
  ['Webcam Full HD', 'Periféricos', '59,00 €', '9'],
  ['SSD NVMe 1 TB', 'Componentes', '99,90 €', '22'],
  ['Memória RAM 16 GB', 'Componentes', '78,00 €', '14'],
  ['Cadeira ergonómica', 'Mobiliário', '249,00 €', '3'],
];

const TabelaAssincrona = {
  template: `
  <div>
    <label class="rotulo">Buscar produto</label>
    <input class="campo-busca campo-texto" type="text" placeholder="Ex.: monitor" v-model="termo" @input="aoEscrever">
    <p class="contador-resultados" style="margin-top:12px;font-family:var(--font-code);font-size:var(--text-xs);color:var(--text-faint)">{{ contador }}</p>
    <div v-if="aCarregar" style="margin-top:16px;display:flex;flex-direction:column;gap:12px;max-width:520px">
      <div v-for="i in 5" :key="i" class="esqueleto"></div>
    </div>
    <table v-else-if="visivel" class="tabela-produtos tabela-simulada" style="max-width:640px;margin-top:12px">
      <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Stock</th></tr></thead>
      <tbody>
        <tr v-for="p in filtrados" :key="p[0]"><td>{{ p[0] }}</td><td>{{ p[1] }}</td><td>{{ p[2] }}</td><td>{{ p[3] }}</td></tr>
      </tbody>
    </table>
    <div v-else class="resultado-estado">Sem resultados para "{{ termo }}"</div>
  </div>`,
  setup() {
    const termo = ref(''); const aCarregar = ref(false); const visivel = ref(true);
    const filtrados = ref(PRODUTOS);
    let t1 = null, t2 = null;
    const contador = computed(() => {
      if (aCarregar.value) return 'A pesquisar…';
      if (!visivel.value) return '0 resultados';
      return filtrados.value.length + (filtrados.value.length === 1 ? ' resultado' : ' resultados');
    });
    function aoEscrever() {
      clearTimeout(t1); clearTimeout(t2); aCarregar.value = true; visivel.value = false;
      t1 = setTimeout(() => {
        const q = termo.value.trim().toLowerCase();
        t2 = setTimeout(() => {
          filtrados.value = PRODUTOS.filter(p => p[0].toLowerCase().includes(q) || p[1].toLowerCase().includes(q));
          visivel.value = filtrados.value.length > 0; aCarregar.value = false;
        }, 1500);
      }, 800);
    }
    onUnmounted(() => { clearTimeout(t1); clearTimeout(t2); });
    return { termo, aCarregar, visivel, filtrados, contador, aoEscrever };
  },
};

const ScrollInfinito = {
  template: `
  <div>
    <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:12px">Role até ao fundo — {{ itens.length }} itens carregados</p>
    <div class="feed" @scroll="aoRolar">
      <div v-for="(n, i) in itens" :key="n" class="feed-item"><span class="id-feed">#{{ n }}</span>Evento de telemetria {{ n }} — leitura nominal</div>
      <div v-if="aCarregar" style="display:flex;justify-content:center;padding:12px"><div class="spinner"></div></div>
    </div>
  </div>`,
  setup() {
    const itens = ref(Array.from({ length: 10 }, (_, i) => i + 1));
    const aCarregar = ref(false);
    function aoRolar(e) {
      const el = e.target;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && !aCarregar.value && itens.value.length < 100) {
        aCarregar.value = true;
        setTimeout(() => {
          const ultimo = itens.value.length;
          itens.value.push(...Array.from({ length: 10 }, (_, i) => ultimo + i + 1));
          aCarregar.value = false;
        }, 900);
      }
    }
    return { itens, aCarregar, aoRolar };
  },
};

const CIDADES = ['Porto', 'Lisboa', 'Braga', 'Coimbra', 'Portimão', 'Ponta Delgada', 'Póvoa de Varzim', 'Paris', 'Praga', 'Porto Alegre'];

const Autocomplete = {
  template: `
  <div>
    <label class="rotulo">Cidade</label>
    <input class="campo-cidade campo-texto" type="text" placeholder="Escreva pelo menos 2 letras…" v-model="termo" @input="aoEscrever">
    <ul v-if="sugestoes.length" class="sugestoes lista-sugestoes">
      <li v-for="c in sugestoes" :key="c"><button class="item-sugestao" @click="escolher(c)">{{ c }}</button></li>
    </ul>
    <p v-if="escolhida" class="cidade-escolhida" style="margin-top:16px;font-family:var(--font-code);color:var(--primary);font-size:var(--text-sm)">Cidade escolhida: {{ escolhida }}</p>
  </div>`,
  setup() {
    const termo = ref(''); const sugestoes = ref([]); const escolhida = ref('');
    let t = null;
    function aoEscrever() {
      escolhida.value = ''; sugestoes.value = []; clearTimeout(t);
      if (termo.value.trim().length >= 2) {
        const q = termo.value.trim().toLowerCase();
        t = setTimeout(() => {
          sugestoes.value = CIDADES.filter(c => c.toLowerCase().startsWith(q));
        }, 1200);
      }
    }
    function escolher(c) { escolhida.value = c; termo.value = c; sugestoes.value = []; }
    onUnmounted(() => clearTimeout(t));
    return { termo, sugestoes, escolhida, aoEscrever, escolher };
  },
};

const ModalToast = {
  template: `
  <div>
    <div style="display:flex;flex-direction:column;gap:12px;max-width:340px">
      <div><label class="rotulo">Nome</label><input class="campo-nome campo-texto" type="text" v-model="nome"></div>
      <div><label class="rotulo">Email</label><input class="campo-email campo-texto" type="text" v-model="email"></div>
      <button class="btn btn-primario" @click="abrirModal" :disabled="!nome || !email">Guardar alterações</button>
    </div>
    <div v-if="modalAberto" class="overlay-modal">
      <div class="caixa-modal">
        <h4>Confirmar alterações</h4>
        <p>Guardar os dados de {{ nome }} ({{ email }})?</p>
        <div style="display:flex;gap:12px;justify-content:flex-end">
          <button class="btn" @click="modalAberto = false">Cancelar</button>
          <button class="btn btn-primario btn-confirmar" @click="confirmar">Confirmar</button>
        </div>
      </div>
    </div>
    <div v-if="toastVisivel" class="toast">Alterações guardadas com sucesso</div>
  </div>`,
  setup() {
    const nome = ref(''); const email = ref('');
    const modalAberto = ref(false); const toastVisivel = ref(false);
    let t1 = null, t2 = null;
    function abrirModal() { modalAberto.value = true; }
    function confirmar() {
      modalAberto.value = false;
      t1 = setTimeout(() => {
        toastVisivel.value = true;
        t2 = setTimeout(() => { toastVisivel.value = false; }, 4000);
      }, 1200);
    }
    onUnmounted(() => { clearTimeout(t1); clearTimeout(t2); });
    return { nome, email, modalAberto, toastVisivel, abrirModal, confirmar };
  },
};

const IdsDinamicos = {
  template: `
  <div>
    <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:16px">
      Ids desta sessão:
      <code style="font-family:var(--font-code);color:var(--text-faint)">#{{ selo }}</code>
      — clique em "Recarregar formulário" para os mudar.
    </p>
    <div style="display:flex;flex-direction:column;gap:12px;max-width:340px">
      <div>
        <label class="rotulo">Utilizador</label>
        <input class="campo" type="text" :id="'input-utilizador-' + selo" placeholder="nome de utilizador" v-model="utilizador">
      </div>
      <div>
        <label class="rotulo">Senha</label>
        <input class="campo" type="password" :id="'input-senha-' + selo" v-model="senha">
      </div>
      <button class="btn btn-primario botao-entrar" :id="'btn-entrar-' + selo" @click="entrar">Entrar</button>
    </div>
    <p v-if="mensagem" class="mensagem" style="margin-top:16px;font-family:var(--font-code);color:var(--primary)">Bem-vindo, {{ mensagem }}</p>
    <button class="btn" style="margin-top:16px" @click="recarregar">Recarregar formulário</button>
  </div>`,
  setup() {
    const selo = ref(Math.floor(100 + Math.random() * 900));
    const utilizador = ref(''); const senha = ref(''); const mensagem = ref('');
    function recarregar() {
      selo.value = Math.floor(100 + Math.random() * 900);
      utilizador.value = ''; senha.value = ''; mensagem.value = '';
    }
    function entrar() { mensagem.value = utilizador.value || 'convidado'; }
    return { selo, utilizador, senha, mensagem, recarregar, entrar };
  },
};

const CLIENTES = [
  ['Ana Silva', 'ana.silva@exemplo.pt', 'Porto'],
  ['Bruno Costa', 'bruno.costa@exemplo.pt', 'Lisboa'],
  ['Carla Mendes', 'carla.mendes@exemplo.pt', 'Braga'],
  ['Diogo Pereira', 'diogo.pereira@exemplo.pt', 'Coimbra'],
  ['Elisa Ramos', 'elisa.ramos@exemplo.pt', 'Faro'],
];

const BotoesRepetidos = {
  template: `
  <div>
    <table class="tabela-clientes tabela-simulada" style="max-width:640px">
      <thead><tr><th>Nome</th><th>Email</th><th>Cidade</th><th></th></tr></thead>
      <tbody>
        <tr v-for="c in clientes" :key="c[0]">
          <td>{{ c[0] }}</td><td>{{ c[1] }}</td><td>{{ c[2] }}</td>
          <td><button class="btn btn-editar" @click="emEdicao = c[0]">Editar</button></td>
        </tr>
      </tbody>
    </table>
    <p v-if="emEdicao" class="cliente-em-edicao" style="margin-top:16px;font-family:var(--font-code);color:var(--primary)">A editar: {{ emEdicao }}</p>
  </div>`,
  setup() {
    const emEdicao = ref('');
    return { clientes: CLIENTES, emEdicao };
  },
};

const PEDIDOS = [
  ['Laptop', '1299,00 €'],
  ['Monitor 27"', '189,99 €'],
  ['Teclado mecânico', '89,50 €'],
  ['Rato sem fios', '64,00 €'],
  ['SSD NVMe 1 TB', '99,90 €'],
];

const Checkboxes = {
  template: `
  <div>
    <table class="tabela-pedidos tabela-simulada" style="max-width:560px">
      <thead><tr><th></th><th>Pedido</th><th>Valor</th></tr></thead>
      <tbody>
        <tr v-for="p in pedidos" :key="p[0]">
          <td><input type="checkbox" class="chk-pedido" :value="p[0]" v-model="marcados"></td>
          <td>{{ p[0] }}</td><td>{{ p[1] }}</td>
        </tr>
      </tbody>
    </table>
    <p class="contador-selecionados" style="margin-top:16px;font-family:var(--font-code);color:var(--primary)">Selecionados: {{ marcados.length }}</p>
  </div>`,
  setup() {
    const marcados = ref([]);
    return { pedidos: PEDIDOS, marcados };
  },
};

const FICHA_HTML = `
  <style>
    .ficha { font-family: 'General Sans', sans-serif; color: #d9dee6; }
    .ficha h5 { margin: 0 0 4px; font-size: 1rem; }
    .ficha .preco { color: #3ddc97; font-family: monospace; }
    .ficha button { margin-top: 12px; padding: 8px 16px; border-radius: 8px; border: 1px solid #3ddc97;
      background: #3ddc97; color: #0a1510; font-weight: 600; cursor: pointer; }
    .ficha .carrinho { margin-top: 12px; font-family: monospace; font-size: 0.8rem; color: #8b95a5; }
  </style>
  <div class="ficha">
    <h5>Webcam Full HD</h5>
    <span class="preco">59,00 €</span>
    <button class="adicionar">Adicionar ao carrinho</button>
    <p class="carrinho">Carrinho: 0 itens</p>
  </div>`;

const ShadowDomWidget = {
  template: `
  <div>
    <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:16px">
      Componente hospedeiro: <code style="font-family:var(--font-code);color:var(--text-faint)">&lt;ficha-produto&gt;</code> — o botão está dentro do shadow root.
    </p>
    <ficha-produto></ficha-produto>
  </div>`,
};

customElements.define('ficha-produto', class extends HTMLElement {
  connectedCallback() {
    const raiz = this.attachShadow({ mode: 'open' });
    raiz.innerHTML = FICHA_HTML;
    raiz.querySelector('button').addEventListener('click', () => {
      this.itens = (this.itens || 0) + 1;
      raiz.querySelector('.carrinho').textContent = 'Carrinho: ' + this.itens + (this.itens === 1 ? ' item' : ' itens');
    });
  }
});

const PIN_DOC = `<!DOCTYPE html><html><head><style>
  body { background:#0b0e13; color:#d9dee6; font-family:sans-serif; padding:32px; }
  label { display:block; margin-bottom:8px; color:#8b95a5; font-size:14px; }
  input { padding:8px 14px; border-radius:8px; border:1px solid #2a3341; background:#0e1116; color:#d9dee6; }
  button { margin-left:12px; padding:8px 18px; border-radius:8px; border:1px solid #3ddc97; background:#3ddc97; color:#0a1510; font-weight:600; cursor:pointer; }
  p.resultado-pin { margin-top:20px; font-family:monospace; color:#3ddc97; }
</style></head><body>
  <label>PIN de acesso</label>
  <input class='campo-pin' type='password'>
  <button onclick="var r=document.createElement('p');r.className='resultado-pin';r.textContent='PIN válido';document.body.appendChild(r)">Validar PIN</button>
</body></html>`;

const IframeEmbed = {
  setup() {
    return { PIN_DOC };
  },
  template: `
  <div>
    <p style="font-size:var(--text-sm);color:var(--text-muted);margin-bottom:12px">Formulário embutido numa moldura (iframe) com origem diferente:</p>
    <iframe class="moldura" title="Área segura" :srcdoc="PIN_DOC"></iframe>
  </div>`,
};

const COMPONENTES = {
  'carregamento-atrasado': CarregamentoAtrasado,
  'barra-progresso': BarraProgresso,
  'elemento-volatil': ElementoVolatil,
  'tabela-assincrona': TabelaAssincrona,
  'scroll-infinito': ScrollInfinito,
  'autocomplete': Autocomplete,
  'modal-toast': ModalToast,
  'ids-dinamicos': IdsDinamicos,
  'botoes-repetidos': BotoesRepetidos,
  'checkboxes': Checkboxes,
  'shadow-dom': ShadowDomWidget,
  'iframe': IframeEmbed,
};

/* ---------- Páginas ---------- */

const NIVEL_CLASSE = { facil: 'nivel-facil', medio: 'nivel-medio', dificil: 'nivel-dificil' };
const NIVEL_TEXTO = { facil: 'fácil', medio: 'médio', dificil: 'difícil' };

const PaginaDesafio = {
  props: ['desafio'],
  components: COMPONENTES,
  template: `
  <div>
    <header class="cabecalho-desafio">
      <span class="badge" style="font-size:var(--text-xs)">Desafio {{ desafio.num }}</span>
      <h2>{{ desafio.titulo }}</h2>
      <p>{{ desafio.resumo }}</p>
      <div class="badges">
        <span class="badge" :class="NIVEL_CLASSE[desafio.nivel]">nível {{ NIVEL_TEXTO[desafio.nivel] }}</span>
        <span v-for="t in desafio.tags" :key="t" class="badge">{{ t }}</span>
      </div>
    </header>
    <div class="painel-desafio">
      <div class="app-simulada">
        <div class="barra-app">
          <span class="janela" style="background:#e06c75"></span>
          <span class="janela" style="background:#e8b93e"></span>
          <span class="janela" style="background:#3ddc97"></span>
          <span class="titulo-janela">app-demo — produção</span>
        </div>
        <div class="corpo-app"><component :is="desafio.slug"></component></div>
      </div>
      <aside class="painel-info">
        <div class="bloco">
          <h4>Objetivo do teste</h4>
          <ul class="objetivo"><li v-for="o in desafio.objetivo" :key="o">{{ o }}</li></ul>
        </div>
        <div class="bloco">
          <h4>Ajuda</h4>
          <details class="dica" v-for="d in desafio.dicas" :key="d.titulo">
            <summary>{{ d.titulo }}</summary>
            <div class="conteudo-dica">
              <p>{{ d.corpo }}</p>
              <template v-if="d.codigo">
                <span class="etiqueta-codigo">robot</span>
                <pre class="codigo">{{ d.codigo }}</pre>
              </template>
            </div>
          </details>
        </div>
      </aside>
    </div>
  </div>`,
  setup() {
    return { NIVEL_CLASSE, NIVEL_TEXTO };
  },
};

const Home = {
  template: `
  <div>
    <section class="hero">
      <div class="hero-grade">
        <div>
          <p class="kicker">// terreno de treino para automação web</p>
          <h1>Sincronização e XPath em apps modernas — treinados à mão.</h1>
          <p>Uma SPA em Vue 3 com os padrões que quebram testes em Angular, Vue e React: elementos que chegam tarde,
             ids que mudam a cada render, shadow DOM, iframes e tabelas assíncronas. Aponte o Robot Framework
             com SeleniumLibrary para aqui e treine até os waits deixarem de ser um problema.</p>
          <div class="badges">
            <span class="badge vue">Vue 3</span>
            <span class="badge angular">AngularJS</span>
            <span class="badge">Robot Framework + SeleniumLibrary</span>
          </div>
        </div>
        <div class="terminal-demo" aria-hidden="true">
          <div class="topo-terminal">
            <span class="janela" style="background:#e06c75"></span>
            <span class="janela" style="background:#e8b93e"></span>
            <span class="janela" style="background:#3ddc97"></span>
            <span class="titulo-janela">robot — treino.robot</span>
          </div>
          <pre>$ robot treino.robot
============================================
Treino
============================================
Conteudo Assincrono Aparece    <span class="ok-terminal">| PASS |</span>
--------------------------------------------
1 test, 1 passed, 0 failed
============================================
Output:  treino/output.xml
Log:     treino/log.html
Report:  treino/report.html</pre>
        </div>
      </div>
    </section>

    <section>
      <h3 style="font-size:var(--text-lg);margin-bottom:var(--space-2)">Comece por aqui</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm)">Abra o terminal na pasta do projeto e crie um ficheiro <code style="font-family:var(--font-code)">treino.robot</code>:</p>
      <pre class="codigo"><span class="cmt">*** Settings ***</span>
<span class="kw">Library</span>    SeleniumLibrary

<span class="cmt">*** Variables ***</span>
<span class="kw">\${BROWSER}</span>    chrome
<span class="kw">\${URL}</span>         <span class="str">http://localhost:8000/index.html</span>
<span class="kw">\${ROTA}</span>        <span class="str">#/sync/carregamento-atrasado</span>

<span class="cmt">*** Test Cases ***</span>
Conteudo Assincrono Aparece
    <span class="kw">Open Browser</span>    <span class="str">\${URL}\${ROTA}</span>    <span class="str">\${BROWSER}</span>
    <span class="kw">Click Button</span>    <span class="str">id:btn-carregar</span>
    <span class="kw">Wait Until Element Is Visible</span>    <span class="str">css:ul.resultado li</span>    <span class="str">timeout=10s</span>
    <span class="kw">Element Text Should Be</span>    <span class="str">css:ul.resultado li:first-child</span>    <span class="str">Sensor de temperatura</span>
    <span class="cmt">[Teardown]</span>    <span class="kw">Close Browser</span></pre>
    </section>

    <section>
      <h3 style="font-size:var(--text-lg);margin:var(--space-10) 0 var(--space-2)">Desafios de sincronização</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4)">O elemento existe, mas ainda não chegou. Estes desafios tratam de esperar bem.</p>
      <div class="grade-desafios">
        <a v-for="d in sinc" :key="d.slug" class="cartao-desafio" :href="'#/' + d.sec + '/' + d.slug">
          <span class="num">{{ d.num }}</span>
          <h4>{{ d.titulo }}</h4>
          <p>{{ d.resumo }}</p>
          <div class="tags"><span class="badge" :class="NIVEL_CLASSE[d.nivel]">{{ NIVEL_TEXTO[d.nivel] }}</span></div>
        </a>
      </div>

      <h3 style="font-size:var(--text-lg);margin:var(--space-10) 0 var(--space-2)">Desafios de localizadores (XPath)</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4)">O elemento chegou, mas como encontrá-lo sem quebrar amanhã?</p>
      <div class="grade-desafios">
        <a v-for="d in loc" :key="d.slug" class="cartao-desafio" :href="'#/' + d.sec + '/' + d.slug">
          <span class="num">{{ d.num }}</span>
          <h4>{{ d.titulo }}</h4>
          <p>{{ d.resumo }}</p>
          <div class="tags"><span class="badge" :class="NIVEL_CLASSE[d.nivel]">{{ NIVEL_TEXTO[d.nivel] }}</span></div>
        </a>
      </div>

      <h3 style="font-size:var(--text-lg);margin:var(--space-10) 0 var(--space-2)">Bônus: página em AngularJS</h3>
      <p style="color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4)">
        Uma página separada construída em AngularJS 1.x com o detalhe mais importante para automação:
        a diferença entre ng-if (remove o elemento do DOM) e ng-show (só esconde).
      </p>
      <a class="cartao-desafio" href="angular.html">
        <span class="num">A1</span>
        <h4>ng-if vs ng-show, filtros e ng-repeat</h4>
        <p>Busca com filtro, lista dinâmica e a armadilha clássica do elemento escondido vs inexistente.</p>
        <div class="tags"><span class="badge angular">AngularJS</span></div>
      </a>
    </section>
  </div>`,
  setup() {
    return {
      sinc: DESAFIOS.filter(d => d.sec === 'sync'),
      loc: DESAFIOS.filter(d => d.sec === 'loc'),
      NIVEL_CLASSE, NIVEL_TEXTO,
    };
  },
};

const Guia = {
  template: `
  <div>
    <header class="cabecalho-desafio">
      <h2>Guia rápido: waits e XPath para SPAs</h2>
      <p>Referência de bolso para usar durante os desafios. Funciona com SeleniumLibrary do Robot Framework.</p>
    </header>

    <section class="secao-guia">
      <h2>Porque é que as SPAs quebram os testes</h2>
      <p>Numa app Angular/Vue/React, o HTML é reconstruído por JavaScript depois do load. O Selenium
      navega para a página, o DOM ainda está "vazio" e o seu locator falha — não porque está errado,
      mas porque chegou cedo demais. E pior: a framework pode re-renderizar um componente a qualquer
      momento, invalidando referências anteriormente válidas (StaleElementReferenceException).</p>
      <p>As duas regras que resolvem 90% dos casos:</p>
      <ul style="padding-left:20px;color:var(--text-muted);font-size:var(--text-sm);margin-bottom:var(--space-4)">
        <li>Esperar por condições (visível, ativado, contém texto) — nunca por tempos fixos.</li>
        <li>Localizar por atributos estáveis (texto, data-testid, estrutura) — nunca por ids ou índices gerados.</li>
      </ul>
    </section>

    <section class="secao-guia">
      <h2>Keywords de espera da SeleniumLibrary</h2>
      <table class="tabela-guia">
        <tr><th>Keyword</th><th>Quando usar</th></tr>
        <tr><td>Wait Until Element Is Visible</td><td>Padrão para conteúdo que chega tarde (padrão na maioria dos casos).</td></tr>
        <tr><td>Wait Until Element Is Enabled</td><td>Botões desativados durante processamento.</td></tr>
        <tr><td>Wait Until Element Contains</td><td>Texto que muda dentro de um elemento que já existe (contadores, resultados).</td></tr>
        <tr><td>Wait Until Page Contains Element</td><td>Elemento pode estar oculto mas deve existir no DOM.</td></tr>
        <tr><td>Wait For Condition</td><td>Condições personalizadas em JavaScript (propriedades, estado interno).</td></tr>
        <tr><td>Set Browser Implicit Wait</td><td>Rede de segurança global (ex.: 5s) — não substitui as esperas explícitas.</td></tr>
        <tr><td>Sleep</td><td>Quase nunca. Só para depurar passo a passo.</td></tr>
      </table>
    </section>

    <section class="secao-guia">
      <h2>XPath que sobrevive a re-renders</h2>
      <table class="tabela-guia">
        <tr><th>Padrão</th><th>Exemplo</th></tr>
        <tr><td>Por texto exato</td><td>//button[normalize-space()='Guardar']</td></tr>
        <tr><td>Por texto parcial</td><td>//a[contains(.,'Detalhes do pedido')]</td></tr>
        <tr><td>A partir do rótulo</td><td>//label[normalize-space()='Email']/following::input[1]</td></tr>
        <tr><td>Dentro da linha certa</td><td>//tr[.//td[contains(.,'Ana')]]//button</td></tr>
        <tr><td>N-ésimo / último</td><td>//tr[3]//button — //tr[last()]//button</td></tr>
        <tr><td>Subir para o contentor</td><td>//input[@id='x']/ancestor::div[contains(@class,'campo')]</td></tr>
        <tr><td>Input de um tipo</td><td>//form//input[@type='email']</td></tr>
        <tr><td>Classe parcial (cuidado)</td><td>//div[contains(@class,'dropdown-menu')]</td></tr>
      </table>
      <p>Dica de ouro: teste os XPaths no devtools do navegador com
      <code style="font-family:var(--font-code);color:var(--primary)">$x("//button[contains(.,'Entrar')]")</code>
      antes de os pôr no teste. E lembre-se: XPath não atravessa shadow roots nem iframes.</p>
    </section>

    <section class="secao-guia">
      <h2>Angular/Vue: detalhes que apanham testers</h2>
      <table class="tabela-guia">
        <tr><th>Armadilha</th><th>Como lidar</th></tr>
        <tr><td>ng-if (Angular) remove o elemento do DOM</td><td>Use Wait Until Element Is Visible — e para o estado negativo, Element Should Not Be Visible falha porque o elemento nem existe; use Page Should Not Contain Element.</td></tr>
        <tr><td>ng-show / v-show só escondem (class ng-hide / display:none)</td><td>O elemento continua no DOM: Page Should Contain Element passa, mas Element Should Be Visible falha. Escolha a asserção conforme o comportamento.</td></tr>
        <tr><td>Re-render muda ids/classes geradas</td><td>Localize por texto, data-testid ou estrutura relativa.</td></tr>
        <tr><td>Shadow DOM (web components)</td><td>SeleniumLibrary não atravessa: use Execute Javascript via shadowRoot, ou Browser Library (Playwright).</td></tr>
        <tr><td>Router SPA (a URL muda sem recarregar)</td><td>Não espere por "page load"; espere por um elemento único da nova vista.</td></tr>
      </table>
    </section>
  </div>`,
};

/* ---------- App ---------- */

const App = createApp({
  components: { PaginaDesafio, Home, Guia },
  setup() {
    const rota = ref(rotaAtual());
    function aoMudar() { rota.value = rotaAtual(); }
    window.addEventListener('hashchange', aoMudar);
    onUnmounted(() => window.removeEventListener('hashchange', aoMudar));

    const desafio = computed(() =>
      DESAFIOS.find(d => d.sec === rota.value.sec && d.slug === rota.value.slug) || null
    );
    const vista = computed(() => {
      if (!rota.value.sec) return 'Home';
      if (rota.value.sec === 'guia') return 'Guia';
      return 'PaginaDesafio';
    });
    const navAtiva = (chave) => {
      if (chave === 'home') return !rota.value.sec;
      if (chave === 'guia') return rota.value.sec === 'guia';
      return rota.value.sec === chave;
    };
    const temLateral = computed(() => rota.value.sec === 'sync' || rota.value.sec === 'loc');
    return { rota, desafio, vista, navAtiva, temLateral, DESAFIOS };
  },
  template: `
  <header class="topbar">
    <a class="marca" href="#/"><span class="ponto"></span> Treino SPA <span class="mono">/ robot-framework</span></a>
    <nav class="topnav">
      <a href="#/" :class="{ativo: navAtiva('home')}">Início</a>
      <a href="#/sync/carregamento-atrasado" :class="{ativo: navAtiva('sync')}">Sincronização</a>
      <a href="#/loc/ids-dinamicos" :class="{ativo: navAtiva('loc')}">Localizadores</a>
      <a href="angular.html">AngularJS</a>
      <a href="#/guia" :class="{ativo: navAtiva('guia')}">Guia</a>
    </nav>
  </header>
  <div class="shell" :class="{ 'sem-lateral': !temLateral }">
    <aside class="lateral" v-if="temLateral">
      <h3>Sincronização</h3>
      <a v-for="d in DESAFIOS.filter(d => d.sec === 'sync')" :key="d.slug"
         :href="'#/sync/' + d.slug" :class="{ativo: rota.sec === 'sync' && rota.slug === d.slug}">
        {{ d.num }} · {{ d.titulo }}
      </a>
      <h3>Localizadores</h3>
      <a v-for="d in DESAFIOS.filter(d => d.sec === 'loc')" :key="d.slug"
         :href="'#/loc/' + d.slug" :class="{ativo: rota.sec === 'loc' && rota.slug === d.slug}">
        {{ d.num }} · {{ d.titulo }}
      </a>
      <h3>Outros</h3>
      <a class="ext" href="angular.html">Página AngularJS ↗</a>
      <a class="ext" href="#/guia">Guia de waits e XPath</a>
    </aside>
    <main>
      <component :is="vista" :desafio="desafio" v-if="vista !== 'PaginaDesafio' || desafio"></component>
      <div v-else style="padding:var(--space-16);color:var(--text-faint);font-family:var(--font-code)">
        # 404 — desafio não encontrado. <a href="#/">Voltar ao início.</a>
      </div>
    </main>
  </div>
  <footer class="rodape">feito para treinar Robot Framework + SeleniumLibrary — Vue 3 · AngularJS 1.8</footer>`,
});

App.mount('#app');
