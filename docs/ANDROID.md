# App Android

O life-os roda no Android como um app instalável, gerado com
[Capacitor](https://capacitorjs.com). O projeto nativo fica em `android/` e
abre no Android Studio.

## O que este app é (e o que não é)

O life-os é **renderizado no servidor** — as telas são React Server Components
e as mutações passam por Server Actions. Não existe, portanto, um pacote
estático que possa ser embarcado no aparelho: o app nativo é uma casca que
carrega a versão hospedada, configurada em `server.url` no
[`capacitor.config.ts`](../capacitor.config.ts).

Na prática isso significa:

- ✅ Ícone próprio, splash screen, abre sem barra de navegador, aparece na
  gaveta de apps e no multitarefa como qualquer app.
- ✅ O botão físico de voltar navega no histórico, comportamento que o
  Capacitor já traz.
- ❌ **Não funciona sem internet.** Sem conexão, aparece a tela de fallback de
  `capacitor/www/index.html`.
- ❌ Não usa recursos do aparelho ainda. É aqui que o app deixaria de ser uma
  casca: notificações locais para lembrar de tarefas seriam o próximo passo
  natural, e exigiriam o plugin `@capacitor/local-notifications`.

Vale saber, se um dia pensar em publicar: a Play Store costuma rejeitar apps
que são apenas um site embrulhado, sem nenhuma funcionalidade nativa. Para uso
próprio e portfólio, instalado por sideload, não há problema.

## Rodando no Android Studio

```bash
npm run android:open
```

Isso abre o projeto `android/` no Android Studio. Na primeira vez ele vai
baixar as dependências do Gradle — pode levar alguns minutos.

Depois: escolha um emulador (ou conecte o aparelho com depuração USB ativada)
e clique em **Run**.

> O Gradle usa o Java que vem dentro do Android Studio. Se você rodar comandos
> de build pelo terminal e aparecer *"Unable to locate a Java Runtime"*,
> aponte o `JAVA_HOME` para o runtime embutido:
>
> ```bash
> export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
> ```

## Depois de mudar a configuração

O código da aplicação **não** precisa de novo build do app: como as telas vêm
do servidor, um `git push` já atualiza o que aparece no aparelho.

Só é preciso reconstruir o app quando algo do lado nativo muda — a URL do
servidor, o nome, o ícone ou um plugin novo:

```bash
npm run android:sync
```

## Ícones e splash

Os arquivos-fonte ficam em `assets/` e são a origem de tudo que está em
`android/app/src/main/res/`. Para regerar depois de mudar a marca:

```bash
npx @capacitor/assets generate --android
```

| Arquivo                      | Papel                                        |
| ---------------------------- | -------------------------------------------- |
| `assets/icon-only.png`       | Ícone completo (fundo + traço)                |
| `assets/icon-foreground.png` | Traço do ícone adaptativo, na zona segura     |
| `assets/icon-background.png` | Fundo do ícone adaptativo                     |
| `assets/splash.png`          | Splash no tema claro                          |
| `assets/splash-dark.png`     | Splash no tema escuro                         |

## Gerando o APK

No Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

O arquivo sai em `android/app/build/outputs/apk/debug/`. Esse é um APK de
*debug*, assinado com uma chave de desenvolvimento — serve para instalar no
seu aparelho, não para distribuir.
