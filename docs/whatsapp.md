# WhatsApp do Promia (encarte do concorrente por foto)

O dono manda a foto do encarte de um concorrente para o número do Promia, com o nome do mercado na legenda, e recebe a comparação de preços na própria conversa.

## Como liga

1. Em developers.facebook.com, crie um app do tipo Business e adicione o produto WhatsApp.
2. Registre e verifique um número para o Promia (ele não pode estar no app WhatsApp comum).
3. Em Configuração do webhook, use a URL `https://SEU-DOMINIO/api/whatsapp/webhook`, o mesmo token de verificação que você pôs em `WHATSAPP_VERIFY_TOKEN`, e assine o campo `messages`.
4. Na Vercel (Settings, Environment Variables), cadastre sozinho no painel, sem colar em chat:
   - `WHATSAPP_TOKEN`: token permanente do usuário de sistema
   - `WHATSAPP_PHONE_ID`: id do número de telefone
   - `WHATSAPP_VERIFY_TOKEN`: texto qualquer que você inventa, igual nos dois lados
   - `META_APP_SECRET`: segredo do app (valida que a mensagem veio da Meta)
   - `WHATSAPP_DISPLAY_NUMBER`: o número com DDI e DDD, só dígitos (aparece o botão na tela Concorrência)
5. Faça um novo deploy.

## Regras

- Só atende quem manda do WhatsApp cadastrado em Mercado (campo WhatsApp do mercado).
- Mensagem sem assinatura válida da Meta é recusada.
- Conta no limite diário de leitura de encartes (o mesmo da tela).
- A Meta cobra por conversa iniciada pela empresa fora da janela de 24 horas; respostas dentro da janela, como aqui, não geram esse custo.
