# AERION — O Laboratório dos Ventos

Plataforma educacional em português para gases ideais e Termodinâmica. **Abra `index.html` diretamente** depois de extrair o ZIP: as funções essenciais são locais e não exigem instalação, conta, internet ou chave de API. Para instalar como PWA, utilize a versão hospedada ou o servidor local.

## O que está implementado

- Central com progresso real, seis módulos, atividade recente e indicação de revisão.
- Academia: fundamentos, transformações isotérmica/isobárica/isocórica/geral, trabalho, energia interna, primeira lei, adiabática, ciclos, leitura de gráficos e aplicações.
- Arsenal com 9 equações principais e 4 auxiliares. Cada equação tem condições, símbolos/unidades, isolamentos, três exemplos, erros comuns e treino relacionado.
- Arena procedural: 26 famílias, três dificuldades (fácil, médio e difícil), múltipla escolha, números digitados, conceitos, verdadeiro/falso e ordenação no formato misto. Variação de dados, contextos, incógnitas e unidades; semente reproduzível em cada instância.
- Treino equilibrado, focado e adaptativo. Dicas graduais, resolução calculada, salvamento de questões, repetição sem duplicar a primeira tentativa, sessões de revisão de cinco questões.
- Radar de fórmulas com tempo livre, 30/15/10 segundos ou valor personalizado. O fim do tempo de referência não penaliza respostas.
- Simulados de 5 a 60 questões ou o roteiro escolar de 15 estruturas. Navegação, pendências, cronômetro, retomada após recarregar, confirmação de entrega, correção, relatório e histórico.
- Laboratório: pistão, recipiente rígido, trabalho, energia interna monoatômica e balanço da primeira lei. Controles interdependentes obedecem a PV = nRT. Gráficos P×V, V×T, P×T e U×T, seleção de dois estados e área do trabalho.
- Palácio Eólico: nove marcos com exploração, recordação, reconstrução com símbolos, identificação por problema e revisão espacial. Cenas pessoais por marco.
- 33 flashcards com intervalos reais de revisão e histórico de caixas.
- Analisador de erros com hipóteses baseadas nos distratores e acesso à revisão.
- Estatísticas por fórmula, módulo, dificuldade, dia, prova e origem. Critérios conservadores de domínio e retenção.
- Cálculo mental com proporcionalidade, cancelamentos, divisões, conversões/potências e estimativas.
- Temas claro/escuro, movimento reduzido, navegação por teclado, mapa 2D, armazenamento local e exportação/importação JSON.
- PWA com recursos inteiramente locais; versão compilada sem bibliotecas ou fontes de terceiros.

## Executar localmente

### Mais simples

Extraia o ZIP e abra `index.html` em um navegador moderno (Chrome, Edge, Firefox ou Safari atualizado). Esse HTML contém toda a aplicação. O registro de service worker é desativado no protocolo `file:`; os demais recursos essenciais funcionam. A persistência sob `file:` varia entre navegadores; exporte uma cópia se necessário.

### Com Node.js 20 ou superior

```bash
npm run build
npm start
```

Abra `http://localhost:4173`. Não é necessário executar `npm install`: não existem dependências de execução ou compilação.

### Com Python, sem Node

```bash
python INICIAR.py
```

Abra `http://localhost:8000`. Essa opção serve o `dist/` já compilado.

## Testar e compilar

```bash
npm test
npm run build
```

O conjunto contém **36 testes**. Os testes do gerador criam **1.000 instâncias por família**, totalizando **26.000 questões**, distribuídas entre os três níveis. Conferem a resposta com cálculo independente, coerência física, sementes, alternativas, arredondamento e condições positivas. Há verificações adicionais de conversões, dados inválidos, distribuição de simulados, duplicação de tentativas, importação, espaçamento, balanços e trajetórias do laboratório.

O build produz `dist/` e também atualiza o `index.html` independente na raiz. Não edite o HTML compilado; edite `src/` e recompile. O compilador local reúne os módulos e estilos sem baixar pacotes.

## Publicar em hospedagem estática

Envie **o conteúdo de `dist/`** à raiz da hospedagem. `index.html`, `icon.svg`, `manifest.webmanifest` e `sw.js` devem permanecer juntos. Não publique somente o HTML de `src/`, que é um molde de compilação.

### GitHub Pages

1. Crie um repositório e envie os quatro arquivos de `dist/` à raiz da branch principal (ou os arquivos compilados equivalentes da raiz do projeto).
2. Em Settings → Pages, selecione Deploy from a branch, a branch escolhida e a pasta `/ (root)`.
3. Aguarde a publicação e abra o endereço informado pelo GitHub. As rotas usam `#/`, funcionando em subpastas sem regras de redirecionamento.
4. Após a primeira visita completa por HTTPS, o service worker prepara os recursos para visitas offline.

Para desenvolvimento com o código-fonte inteiro, preserve as pastas `src/`, `scripts/` e `tests/`, execute o build e publique a saída. Os arquivos de identidade da hospedagem gerenciada não são necessários para hospedar a cópia em outro serviço.

## Organização

```text
src/
  physics.js    Equações puras, grandezas, conversões, PRNG e correção
  content.js    Aulas, fórmulas, condições, mnemônicas e flashcards
  engine.js     Níveis, alternativas, seleção e distribuição
  question-templates.js  Enunciados e cálculos a partir dos dados exibidos
  storage.js    Histórico, espaçamento, domínio, importação e provas
  visuals.js    Ícones/SVG locais, fórmulas MathML e gráficos
  lab.js        Estado físico, trajetórias, balanços e partículas
  app.js        Rotas, componentes de interface e interações
  styles.css    Layout responsivo, temas, acessibilidade e animações
  index.html    Molde do documento
scripts/
  build.mjs     Compilação local, manifest e service worker
  serve.mjs     Servidor de desenvolvimento/uso local
tests/
  engine.test.js
  physics-storage.test.js
```

Foi escolhida uma implementação modular com JavaScript nativo, SVG, canvas e MathML em vez de React/Three.js. Essa alternativa reduz requisitos de instalação, permite um HTML independente e mantém as funções principais sem rede. Há validação de grandezas e documentação JSDoc nas funções centrais; os arquivos não são TypeScript.

## Convenções científicas

- `R = 8,31 J/(mol·K)`. Com esse valor, PV = nRT utiliza Pa, m³, mol e K.
- `1 atm = 101325 Pa`; `1 L = 10⁻³ m³`; `T(K) = T(°C) + 273,15`.
- Pressão absoluta nas equações. Temperatura absoluta e volumes devem ser positivos.
- Trabalho positivo **pelo gás**. Primeira lei: `ΔU = Q − W`.
- `U = (3/2)nRT` e sua variação são aplicadas a gás ideal monoatômico clássico. `W = nRΔT` exige processo isobárico de amostra ideal fixa.
- A área em P×V usa processos quase-estáticos. O laboratório integra a isotérmica com `nRT ln(Vf/Vi)`, usa `PΔV` na isobárica e zero na isocórica. Questões avançadas de trajetória reta usam a área de um trapézio.
- Correção numérica: tolerância de 0,5% do módulo da resposta, ampliada quando necessário para aceitar o arredondamento à última casa exibida (até 2 casas decimais). Os distratores são separados por mais que a tolerância; vírgula, ponto, notação científica e unidades compatíveis são aceitos.
- A eólica é identidade visual/mnemônica; não se afirma que uma turbina real equivale a um cilindro fechado de gás ideal.

## Precisão e níveis das questões

Todos os novos enunciados, alternativas, resultados, exemplos gerados e indicadores usam **até duas casas decimais**. Inteiros não recebem zeros desnecessários. Grandezas muito pequenas são mostradas em notação científica com duas casas no coeficiente para evitar exibir zero.

Os dados são arredondados antes de gerar o enunciado e o gabarito é recalculado com esses mesmos dados. Os cálculos intermediários mantêm precisão interna; as resoluções usam o sinal de aproximação quando apresentam um resultado arredondado. Uma resposta corretamente arredondada é aceita tanto no treino quanto no simulado.

- **Fácil:** dados diretos, valores simples e reconhecimento explícito do processo.
- **Médio:** conversão Celsius–Kelvin, razões, decimais e isolamento de variáveis.
- **Difícil:** conversões combinadas, incógnitas inversas, trajetórias em gráficos e mais etapas.

O antigo quarto nível é integrado ao difícil ao carregar/importar o histórico. Identificadores das tentativas, respostas, provas e pontos já ganhos são preservados. Questões antigas arquivadas continuam com seus enunciados originais; as novas questões usam o gerador atualizado.

## Progresso e revisão

Dados guardados em `localStorage`, chave `aerion-progress-v1`. Não há sincronização automática entre dispositivos. Configurações → Exportar JSON produz uma cópia; a importação é validada e pede confirmação antes de substituir os dados.

Uma questão com o mesmo identificador só registra uma primeira tentativa. Abrir novamente uma questão salva ou tentar corrigir uma resposta não cria um novo acerto independente. Dicas e soluções reveladas são registradas como ajuda. Simulados são corrigidos apenas na entrega; a finalização é idempotente.

Flashcards incorretos: 1 minuto; difíceis: 10 minutos; acertos: 1, 3, 7, 14 e 30 dias. Domínio consolidado requer várias tentativas recentes, diversidade, dois dias de prática e evidência de revisão posterior. Um acerto isolado não consolida uma fórmula.

Armazenamento local depende da cota/permissões do navegador. Se o salvamento falhar, a interface informa e recomenda exportar; modo anônimo ou limpeza de dados pode remover o progresso. Mudar de endereço/origem cria outro armazenamento.

## Alternativas visuais e limites explícitos

- O parque e o palácio usam **perspectiva CSS/SVG**, sem navegação livre em um mundo WebGL. O modo 2D oferece os mesmos exercícios de memória.
- Partículas são ilustrativas; não constituem simulação molecular quantitativa. Sua velocidade visual acompanha √T; P, V, T, n, W, U e Q são calculados pelo modelo termodinâmico.
- Os geradores numéricos são procedurais; conceitos necessariamente reaparecem com variações e revisões. Não existe dependência de IA externa para criar ou corrigir exercícios.
- Somente mecanismos abordados nas aulas são usados. O laboratório contém três trajetórias de amostra ideal e um balanço de energia; não modela uma turbina eólica real, mudanças de fase ou gases reais.
- Instalação de PWA e o botão de instalação dependem do navegador. O uso pelo HTML e o servidor local continuam disponíveis.

## Fontes abertas para consulta

- [OpenStax: Work, Heat, and Internal Energy](https://openstax.org/books/university-physics-volume-2/pages/3-2-work-heat-and-internal-energy)
- [OpenStax: First Law of Thermodynamics](https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics)
- [OpenStax: Thermodynamic Processes](https://openstax.org/books/university-physics-volume-2/pages/3-4-thermodynamic-processes)
- [BIPM: SI Brochure](https://www.bipm.org/en/publications/si-brochure)

Textos, ilustrações e interface foram preparados para esta aplicação. Não há imagens remotas, fontes remotas ou serviços pagos nas funções essenciais.
