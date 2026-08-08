-- Ajusta sequences após importação de dados com IDs existentes (migração via pgloader)

SELECT setval(pg_get_serial_sequence('csa', 'Id'), COALESCE((SELECT MAX("Id") FROM csa), 1));
SELECT setval(pg_get_serial_sequence('grupo', 'Id'), COALESCE((SELECT MAX("Id") FROM grupo), 1));
SELECT setval(pg_get_serial_sequence('reuniao', 'Id'), COALESCE((SELECT MAX("Id") FROM reuniao), 1));
SELECT setval(pg_get_serial_sequence('despesas', 'Id'), COALESCE((SELECT MAX("Id") FROM despesas), 1));
