# Relatório de andamento e revisão técnica — Estoque

**Data da revisão:** 06/11/2026  
**Escopo:** código e configuração atualmente presentes no repositório; revisão estática, sem execução de testes ou deploy.

## Resumo do andamento

O repositório contém uma aplicação web de estoque com backend Java 21/Spring Boot e frontend React/Vite. As funcionalidades documentadas em `TASKS.md` cobrem login JWT, cadastro de produtos, entradas e saídas com histórico, usuários por empresa, dashboard analítico, alertas de estoque e preparação para deploy com PostgreSQL, Render e Netlify. Os diretórios `backend/target` e `frontend/dist` existem, mas isso não comprova que a versão atual esteja compilando ou publicada.

O checklist marca as tarefas listadas como concluídas. Não há integração com Notion implementada no código ou documentação técnica localizada. Também não há evidência verificável neste repositório sobre uma automação agendada que publique relatórios no Notion; esta revisão pode ser publicada no workspace do Notion, mas não foi possível vincular uma automação existente sem identificador/configuração dela.

O Git já tinha alterações locais antes desta revisão em `.gitignore`, `SecurityConfig.java`, `application.yml`, `Login.jsx`, `api.js`, `Dockerfile`, perfis Spring e redirects do frontend. Essas alterações foram preservadas e fazem parte do estado avaliado.

## Arquitetura e funcionalidades identificadas

- **Backend:** controllers REST para autenticação, produtos, usuários, movimentações, dashboard e alertas; serviços separados; JPA/PostgreSQL; autenticação stateless com JWT e BCrypt.
- **Frontend:** React Router; login; telas de dashboard, produtos, movimentações e equipe; cliente HTTP central; guarda de rotas; armazenamento de JWT em `localStorage`.
- **Dados:** entidades tenant, usuário, produto e movimentação. Produtos e movimentos carregam empresa proprietária; consultas principais filtram pelo tenant do usuário autenticado.
- **Operação:** perfis `dev` e `prod`, Dockerfile multi-stage, compose PostgreSQL local e configuração de roteamento SPA para Netlify.
- **Documentação:** `TASKS.md` está mais atualizado que o README raiz. O plano inicial contém decisões antigas/inconsistentes com a implementação atual.

## Riscos de segurança prioritários

### Críticos / corrigir antes de produção

1. **Cadastro público permite escolher empresa e papel.** `POST /api/auth/register` é público e recebe `tenantId` e `role` de `RegisterRequestDTO`. Um usuário pode tentar se associar a outro tenant ou cadastrar-se como `ADMIN`. Remover cadastro aberto ou criar onboarding controlado no servidor, derivando tenant e papel de uma fonte confiável; nunca aceitar privilégio do cliente.
2. **Credenciais de desenvolvimento versionadas.** `application-dev.yml` contém senha PostgreSQL e segredo JWT estáticos; `docker-compose.yml` também contém senha previsível. Retirar valores do Git, rotacionar qualquer segredo que tenha sido usado fora de ambiente local e carregar via variáveis/secret manager. Tratar valores ausentes como erro de inicialização.
3. **JWT no `localStorage`.** Uma falha XSS pode exfiltrar o token. Preferir cookie `HttpOnly`, `Secure`, `SameSite` com proteção CSRF adequada; complementar com CSP e redução de scripts de terceiros. Se mantiver bearer em storage, documentar e endurecer mitigação de XSS.
4. **JWT sem revogação/validação contextual explícita.** O parser verifica assinatura e expiração, mas o código não exige issuer esperado nem trata token inválido com resposta 401 específica. O filtro converte erro em username vazio e consulta banco a cada requisição autenticada. Validar issuer/claims, formato estrito `Bearer`, resposta 401 uniforme e estratégia de revogação/rotação conforme o risco.

### Altos

5. **Validação de entrada inexistente nos DTOs.** Não há `@Valid` nem constraints evidentes para nome, e-mail, senha, preço e quantidades. Quantidade negativa em produto e movimento, preço negativo, campos excessivos e valores nulos podem causar inconsistência ou erro interno. Adicionar validação nos DTOs e limites de tamanho.
6. **CORS muito amplo para produção.** O padrão `https://*.netlify.app` admite qualquer site Netlify e credenciais. Configurar lista explícita de origens de produção; manter localhost apenas no perfil dev e restringir métodos/headers ao necessário.
7. **`ddl-auto: update` em produção.** Migrações automáticas podem alterar schema sem revisão e não fornecem trilha confiável de rollback. Adotar Flyway/Liquibase e `validate` no perfil de produção.
8. **Autorização de usuário por id com exceções genéricas.** A verificação de tenant em exclusão está presente; recomenda-se concentrar escopo de tenant na query de busca e responder 404 uniforme, reduzindo enumeração de IDs. Revisar tratamento global de exceções para não vazar detalhes internos.
9. **Auditoria não é imutável.** O serviço impede excluir usuário com movimentos, mas produto pode ser apagado sem checar histórico, e o saldo pode ser alterado diretamente via update de produto sem criar movimento. Impor movimentação como único caminho para alterar saldo e definir política de arquivamento/auditoria.

## Otimização e confiabilidade

- **Concorrência de saldo:** a transação lê e atualiza quantidade sem lock/versionamento. Duas saídas simultâneas podem ambas validar o saldo antigo e gerar saldo incorreto/negativo. Aplicar `@Version` otimista ou lock pessimista e operação atômica no banco; garantir quantidade positiva.
- **Escala de dashboard e alertas:** ambos carregam listas completas de produtos e/ou movimentos em memória; o dashboard percorre dados para somar e filtrar datas. Migrar agregações para queries paginadas/agrupadas por tenant e intervalo; indexar `tenant_id`, timestamps e chaves de relacionamento.
- **Listagens sem paginação:** produtos, equipe e movimentações retornam listas inteiras. Introduzir paginação, ordenação e filtros no backend.
- **Dependências:** `jjwt-api`/`jjwt-jackson` estão em 0.12.3, mas `jjwt-impl` em 0.12.6. Alinhar versões e acompanhar dependências vulneráveis; adicionar verificação automatizada de dependências e imagem Docker.
- **Injeção de dependência e tratamento de erros:** há uso generalizado de `@Autowired` em campos e `RuntimeException` para erros de domínio. Migrar para construtor, exceções tipadas e `@ControllerAdvice` com respostas HTTP consistentes.
- **Persistência temporal:** datas usam `LocalDateTime.now()` sem zona explícita. Padronizar UTC em armazenamento e conversão de fuso na interface.
- **Frontend:** decodificação do payload JWT no cliente serve apenas para UI e não é autorização; o backend deve ser a fonte de verdade. `api.js` não trata falhas de rede nem padroniza mensagens. Rever logout em 401, expiração do token e tratamento de erros.
- **Build/deploy:** fixar versões de imagens base, executar container com usuário não privilegiado, adicionar health checks e separar configuração de dev/prod. Rever `README.md`, `IMPLEMENTATION_PLAN.md` e `TASKS.md` para refletirem o estado real.

## Próximos passos recomendados

1. Fechar o cadastro público e impedir elevação de privilégio/tenant.
2. Remover e rotacionar segredos locais/versionados; tornar produção fail-fast quando os secrets não existirem.
3. Tornar saldo derivado de movimentações, com concorrência protegida e auditoria consistente.
4. Adicionar validação dos DTOs, tratamento global de erros e testes de autorização multi-tenant.
5. Substituir `ddl-auto:update` por migrações e configurar CORS por ambiente.
6. Otimizar consultas com paginação/agregações e índices após definir volume esperado.
7. Atualizar documentação e automatizar build, lint, testes e análise de dependências em CI.
8. Para automatizar a publicação recorrente deste relatório no Notion, identificar a automação existente e confirmar periodicidade, destino e formato. Não foi localizada configuração correspondente neste repositório nem identificador da automação nesta sessão.

## Limites da revisão

Esta é uma revisão estática do código e configuração disponíveis. Não foram executados testes, build, análise dinâmica, consulta ao banco, varredura de dependências, validação de secrets no provedor, nem confirmação do estado dos serviços publicados. Os itens acima são observações do código, não prova de exploração ou incidente.
