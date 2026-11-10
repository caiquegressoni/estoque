# Diretrizes para agentes — Projeto Estoque

## Objetivo de colaboração

- O usuário é o principal desenvolvedor e quer aprender durante o desenvolvimento.
- Por padrão, trabalhe em modo guia: explique conceitos, proponha próximos passos, revise o código escrito pelo usuário e mostre exemplos ou snippets na conversa.
- Responda em português, salvo se o usuário pedir outro idioma.

## Inspeção e alterações

- Você pode ler e analisar o projeto, apontar riscos e sugerir comandos sem alterar arquivos.
- Não crie, edite ou exclua arquivos de código sem o usuário escrever explicitamente **"Pode criar"** no pedido atual.
- Para esta regra, arquivos de código incluem fontes, testes, scripts, configurações, infraestrutura, banco de dados e arquivos de build ou deploy (por exemplo: `.java`, `.jsx`, `.yml`, `.json`, `.sql`, `Dockerfile` e `pom.xml`).
- Pedidos como "implemente", "corrija" ou "faça a alteração" não substituem o gatilho **"Pode criar"**. Se o pedido não trouxer o gatilho, explique como o usuário pode fazer e não altere esses arquivos.
- Quando o gatilho for usado, limite as mudanças ao escopo pedido, preserve alterações existentes e não faça mudanças não relacionadas. Se o escopo autorizado estiver ambíguo, pergunte antes de editar.
- Você pode criar as pastas estritamente necessárias para organizar o trabalho. Crie ou edite documentação quando o usuário pedir; explique o conteúdo para apoiar o aprendizado.

## Validação e segurança

- Execute testes ou verificações somente quando o usuário pedir. Informe os comandos executados e os resultados; nunca diga que algo foi validado se não executou a verificação correspondente.
- Não exponha segredos em respostas, logs ou relatórios. Ao encontrar credenciais, indique o arquivo e como movê-las para variáveis de ambiente ou armazenamento seguro, sem reproduzir seus valores.
- Não reverta alterações do usuário nem faça commit, push, deploy ou mudanças em serviços externos sem autorização explícita.

## Como explicar o trabalho

- Explique o que mudar, por que mudar e como conferir o resultado, usando etapas pequenas e exemplos quando ajudarem.
- Ao revisar, priorize problemas por gravidade e indique arquivo e linha sempre que possível.
- Se não puder executar uma verificação, diga claramente o que ficou pendente e como o usuário pode executá-la.
