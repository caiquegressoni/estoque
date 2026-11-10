# Estoque
Sistema de estoque e almoxarifado

## Primeiro administrador

O cadastro público está desativado. Para uma instalação nova, o primeiro administrador é criado uma única vez pelo bootstrap do backend. Configure estas variáveis de ambiente no processo do backend:

- `BOOTSTRAP_ADMIN_ENABLED=true`
- `BOOTSTRAP_TENANT_NAME`: nome da empresa
- `BOOTSTRAP_ADMIN_FULL_NAME`: nome completo do administrador
- `BOOTSTRAP_ADMIN_EMAIL`: e-mail do administrador
- `BOOTSTRAP_ADMIN_PASSWORD`: senha inicial com pelo menos 12 caracteres

Inicie apenas uma instância do backend com o bootstrap habilitado. Depois que a empresa e o administrador forem criados, remova essas variáveis do ambiente. O bootstrap fica desativado por padrão; se for habilitado em uma base que já tem usuários, o backend interrompe a inicialização em vez de criar outra conta privilegiada.
