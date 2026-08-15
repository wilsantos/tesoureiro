# Agents do Tesoureiro

Documentação de arquitetura: [`docs/arquitetura.md`](docs/arquitetura.md) · [`docs/api.md`](docs/api.md)

Quatro specialists para manutenções futuras. Definições em `agents/` — pasta que o Cursor carrega.

| Agent | Como chamar | Faz | Não faz |
|---|---|---|---|
| Arquiteto | `/arquiteto` | ADRs em `docs/decisoes/`, desenho de módulos | Implementar PHP, Angular ou SQL |
| DBA | `/dba` | Scripts em `database/YYYYMMDD_*.sql` | Executar qualquer comando no banco |
| Dev PHP | `/dev-php` | Endpoints em `api/` | Migrar banco ou alterar o Angular |
| Front-end | `/frontend-dev` | Telas e jornadas em `frontend/` | Inventar contrato de API |

No chat, use `/arquiteto`, `/dba`, `/dev-php` ou `/frontend-dev`, ou descreva a tarefa: o agent principal deve delegar ao specialist.

O DBA só aplica script no PostgreSQL depois de um “pode executar” explícito seu.
