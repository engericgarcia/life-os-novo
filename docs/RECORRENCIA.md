# Recorrência de tarefas — abordagem escolhida

> Este documento existe porque a recorrência é a parte mais delicada da
> modelagem. Ele registra **o que foi implementado, por quê, e o que muda se
> você preferir outro caminho**.

## O problema

Uma tarefa recorrente ("Academia toda seg/qua/sex") precisa de duas coisas ao
mesmo tempo:

1. Uma **regra** estável — que dias, com que frequência.
2. Um **histórico** de instâncias com estado próprio — a de segunda foi
   concluída, a de quarta não.

Se as duas coisas moram na mesma linha, uma delas se perde: ou você sobrescreve
o estado a cada ciclo (e não tem histórico), ou duplica a regra em cada
instância (e editar a tarefa vira uma migração).

## Modelagem

Duas tabelas, com responsabilidades separadas:

| Tabela             | Papel                                                         |
| ------------------ | ------------------------------------------------------------- |
| `tasks`            | A **regra**: título, área, prioridade, tipo de recorrência.     |
| `task_occurrences` | O **estado datado**: uma linha por ocorrência (data + status).  |

- Tarefa **sem** recorrência (`recurrence is null`) guarda o próprio estado em
  `tasks` (`status`, `due_date`, `completed_at`). Não gera ocorrências.
- Tarefa **com** recorrência nunca é concluída diretamente: uma constraint no
  banco (`tasks_recurring_status_check`) obriga `status = 'pendente'` na regra.
  Quem conclui é a ocorrência.
- `due_date` da regra é a **âncora**: a data da primeira ocorrência.

## Quando as ocorrências são geradas

**Materialização preguiçosa: existe no máximo uma ocorrência em aberto por
tarefa.**

1. **Ao criar** a tarefa recorrente, é criada **uma** ocorrência: a primeira
   data ≥ hoje que satisfaz a regra (para a diária/semanal a partir da âncora;
   se a âncora já passou, avança até hoje).
2. **Ao concluir** a ocorrência de hoje, a aplicação calcula a **próxima** data
   válida (estritamente depois da data concluída, nunca antes de hoje) e insere
   a próxima ocorrência na mesma transação lógica.
3. **Ao desfazer** uma conclusão, a ocorrência volta a `pendente` e a próxima —
   se ainda estiver pendente e tiver sido gerada por aquela conclusão — é
   removida, para não sobrar duas em aberto.

Ou seja: **nada roda em background**. Sem cron, sem Edge Function, sem job de
madrugada. A geração acontece no momento exato em que o usuário conclui algo,
dentro da própria Server Action.

### E se eu ficar dias sem abrir o app?

A ocorrência pendente **não se move**. Ela continua com a data antiga e aparece
como *atrasada* na visão "Hoje" (`Atrasada há 4 dias`). Ao concluí-la, a próxima
é calculada a partir de hoje — não de quatro dias atrás.

Isso é uma escolha deliberada: o alternativo seria criar retroativamente as
ocorrências perdidas, e você abriria o app com 12 "Academia" atrasadas. Um
sistema de uso diário precisa perdoar a ausência, não punir.

O custo: o histórico não registra explicitamente os dias pulados. Se um dia
você quiser um gráfico de aderência por tarefa (como o dos hábitos), será
preciso derivar os dias esperados a partir da regra — a informação continua
disponível, só não está materializada.

## Regras de cálculo da próxima data

Implementadas em [`src/features/tasks/recurrence.ts`](../src/features/tasks/recurrence.ts)
como **funções puras** (sem banco, sem `Date.now()` implícito): recebem a regra
e uma data de referência, devolvem a próxima data. Isso as torna testáveis e
mantém a lógica delicada fora das Server Actions.

| Tipo        | Regra                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| **Diária**  | Próximo dia.                                                                             |
| **Semanal** | Próximo dia da semana marcado (`recurrence_weekdays`, 0 = domingo … 6 = sábado).          |
| **Mensal**  | Mesmo dia do mês seguinte. Em mês curto, cai no **último dia** do mês (31 → 28/29/30).    |

O caso mensal merece atenção: uma tarefa "dia 31" em fevereiro vira 28/02 — mas
a regra continua guardando `31`, então em março ela volta para 31/03. O ajuste é
sempre local ao mês, nunca destrói a regra.

## Fuso horário

Todo "hoje" do sistema é o **dia civil em `America/Sao_Paulo`**
([`src/lib/date.ts`](../src/lib/date.ts)), independente de onde o servidor roda.

As datas são tratadas como **flutuantes** (`yyyy-MM-dd`, colunas `date` no
Postgres): nunca são convertidas para UTC. Isso elimina de vez a classe de bug
em que a tarefa do dia 10 aparece no dia 9 porque o servidor está em outro fuso.

## Invariantes garantidas pelo banco

Não confiamos só na aplicação — o banco recusa estado inconsistente:

- `task_occurrences_task_due_date_unique`: a mesma tarefa nunca gera duas
  ocorrências para a mesma data. É isso que torna a geração **idempotente**:
  dois cliques rápidos no mesmo botão não criam duas ocorrências.
- `tasks_recurrence_fields_check`: cada tipo de recorrência exige exatamente os
  seus campos (semanal tem dias da semana e não tem dia do mês, e vice-versa).
- `tasks_recurring_requires_due_date_check`: recorrente sem âncora não entra.
- `tasks_recurring_status_check`: a regra de uma recorrente nunca é marcada como
  concluída.
- `*_status_completed_at_check`: `status` e `completed_at` nunca divergem.

## Alternativas consideradas (e por que não)

**A. Pré-gerar um horizonte (ex.: 90 dias) por cron.**
Consultas ficam triviais (é só filtrar por data), mas exige infraestrutura
agendada, multiplica linhas por tarefa, e cria o problema de reconciliação:
editar a regra obriga a apagar e regerar o futuro — e decidir o que fazer com
ocorrências já concluídas dentro do horizonte. Complexidade desproporcional
para a v1.

**B. Não materializar nada; derivar as ocorrências na leitura.**
Zero linhas extras e regra sempre "verdadeira". Mas o estado de conclusão
precisa morar em algum lugar de qualquer forma, e aí você reintroduz a tabela —
só que agora com dois modelos concorrentes de verdade. Além disso, filtrar
"o que vence hoje" vira computação em memória sobre todas as tarefas em vez de
um índice.

**C. Materialização preguiçosa (escolhida).**
Uma linha por ocorrência realmente vivida. Sem infraestrutura extra. Editar a
regra afeta naturalmente só o futuro, porque o futuro ainda não existe. O ponto
fraco (dias pulados não materializados) é aceitável e reversível.

## Se você preferir mudar

- **Quer ver as ocorrências futuras no calendário?** Vá para (A): mantenha este
  esquema e adicione um job que chama `proximaOcorrencia` em laço até o
  horizonte. O `unique (task_id, due_date)` já protege contra duplicatas — a
  migração é aditiva, nada precisa ser desfeito.
- **Quer registrar os dias pulados?** Ao concluir com atraso, gere também as
  ocorrências intermediárias com um status novo (ex.: `perdida`). Exige um valor
  a mais no enum `task_status` e ajuste nas constraints.
- **Quer recorrência com fim (`até tal data` / `N vezes`)?** Adicione
  `recurrence_ends_on date` / `recurrence_count int` em `tasks` e um teste no
  fim de `proximaOcorrencia`. Nenhuma outra parte do código precisa saber.
