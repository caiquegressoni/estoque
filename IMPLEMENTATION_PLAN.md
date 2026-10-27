# SaaS de Gerenciamento de Estoque

Este documento define o plano inicial de implementação para o sistema de gerenciamento de estoque em formato SaaS (Software as a Service) para ambiente web.

## Decisões Técnicas

- **Backend**: Java 21, Spring Boot 4.1.0, Maven.
- **Frontend**: React + Vite com design premium.
- **Banco de Dados**: PostgreSQL.
- **Arquitetura SaaS**: Multi-tenant com identificador de Tenant.

## Proposed Changes

### Estrutura do Projeto

Vamos dividir o projeto em duas partes principais: o backend (API) e o frontend (Interface Web).

#### Backend (Spring Boot)
- **Tecnologias**: Java 21, Spring Boot 3.x, Spring Web, Spring Data JPA, Spring Security, PostgreSQL Driver.
- **Estrutura de Pastas Inicial**: 
  - `src/main/java/com/estoque/saas` (código fonte principal)
  - Configuração do Maven/Gradle.

#### Frontend (Interface Web)
- **Tecnologias**: React + Vite (recomendado) + Tailwind CSS ou Vanilla CSS para um design "premium".
- **Comunicação**: Axios ou Fetch API para consumir a API do Spring Boot.

### Modelagem de Dados Inicial (SaaS)
- `Tenant` (Empresa/Cliente do SaaS)
- `User` (Usuário pertencente a um Tenant)
- `Product` (Produto cadastrado no estoque)
- `StockMovement` (Movimentações de entrada e saída)

## Verification Plan

1. Criar e testar a inicialização do projeto Spring Boot usando o Spring Initializr (via Maven/Gradle).
2. Criar a estrutura inicial do Frontend Web.
3. Testar a comunicação básica entre Frontend e Backend.
