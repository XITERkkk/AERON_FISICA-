# Verificação da entrega

## Testes automatizados

`npm test`: 36 testes, incluindo 26.000 instâncias procedurais (1.000 por família, três níveis), com recomputação independente das respostas. Os testes também conferem unidades, parâmetros positivos, alternativas equivalentes, arredondamento, sementes, distribuição dos módulos, correção de simulados, persistência, importação, deduplicação, espaçamento e relações físicas do laboratório.

O build valida a sintaxe do pacote final e gera todos os recursos locais necessários.

## Atualização de precisão e coerência

- Os 26.000 casos também conferem que os números do enunciado correspondem aos dados usados nos cálculos, sem valores ocultos de precisão superior.
- Enunciados, passos e alternativas são inspecionados para impedir mais de duas casas decimais.
- Há regressões para respostas com duas casas, pequenos volumes em notação científica, alternativas distintas após arredondar e migração do antigo quarto nível sem perda de XP ou identidade.

## Verificação no navegador desta atualização

- Arena e simulados exibem exatamente três opções de dificuldade: Fácil, Médio e Difícil.
- Questão isotérmica: P₁ = 1,25 atm, V₁ = 8 L, V₂ = 24 L. A resposta 0,42 foi aceita no campo numérico e na alternativa; o destaque correto também funcionou com o gabarito interno não arredondado.
- A repetição da questão salva não criou uma nova primeira tentativa.
- Simulado escolar difícil: foram respondidas corretamente as questões 1, 9 e 15; as outras 12 ficaram em branco. O resultado foi 3/15 (20%), conforme esperado.
- Conferidos os problemas de primeira lei com kJ, conversão de volume em notação científica e aquecimento isobárico monoatômico com várias equações.
- A revisão do simulado mostrou dados, conversões, resultados e resposta digitada/selecionada com até duas casas decimais.

## Fluxos verificados no navegador (entrega original)

- Central carregada com indicadores reais e parque eólico animado.
- Treino focado em isotérmica com resposta digitada usando vírgula; correção correta.
- Questão salva, tentativa repetida e conferência de que o histórico manteve apenas uma primeira tentativa.
- Recarregamento com preservação do histórico e da precisão.
- Laboratório: controle de volume ajustando pressão em T constante; controle de temperatura em recipiente rígido; troca de gráfico; seleção da incógnita Q no balanço de energia.
- Simulado equilibrado de cinco questões, sem fórmulas antecipadas; aviso de quatro respostas em branco; cancelamento da entrega; retomada após recarregar; navegação e conclusão com resultado esperado de 4/5 (80%). Revisão da única resposta incorreta com gabarito e passos corretos.
- Flashcard revelado e marcado como correto, avançando ao próximo cartão e agendando a revisão.
- Reconstrução de P₁V₁ = P₂V₂ no palácio, com verificação da associação.
- Radar com limite personalizado de cinco segundos: o prazo expirou e a resposta posterior continuou válida, sem penalização.
- Layout em viewport de celular por iframe de 390 px: central, menu recolhível, lista de fórmulas, detalhe da lei geral e palácio sem rolagem horizontal. No conteúdo útil, `scrollWidth = clientWidth = 375 px` (a diferença até 390 corresponde à barra do navegador).
- Tema escuro com leitura e fórmula matemática conferidas visualmente.

## Limites da verificação

A conferência responsiva foi realizada em um viewport estreito do mesmo navegador; não substitui uma rodada em aparelhos físicos e em todas as versões de Safari/Firefox. A aplicação inclui service worker e todos os recursos locais, mas não foi executado um teste de desligamento real da rede do navegador. O ZIP contém o HTML independente como alternativa offline.

As cenas de perspectiva são CSS/SVG, com alternativa 2D; as partículas são ilustrativas. Essas escolhas são documentadas no README e não são apresentadas como simulação molecular quantitativa ou mundo WebGL navegável.
