#!/usr/bin/env python3
"""Converte dump MySQL da aplicação Tesoureiro para PostgreSQL."""

import re
import sys
from pathlib import Path


def bool_val(value: str) -> str:
    value = value.strip()
    if value.upper() == "NULL":
        return "NULL"
    if value == "0":
        return "FALSE"
    if value == "1":
        return "TRUE"
    return value


def extract_insert(content: str, table: str) -> str:
    pattern = rf"INSERT INTO `{table}` VALUES (.+?);"
    match = re.search(pattern, content, re.S)
    if not match:
        raise ValueError(f"INSERT não encontrado para tabela {table}")
    return match.group(1).strip()


def split_rows(values_blob: str) -> list[str]:
    rows = []
    depth = 0
    current = ""

    for char in values_blob:
        if char == "(":
            depth += 1
            if depth == 1:
                current = ""
                continue
        elif char == ")":
            depth -= 1
            if depth == 0:
                rows.append(current)
                current = ""
                continue

        if depth >= 1:
            current += char

    return rows


def split_fields(row: str) -> list[str]:
    parts = []
    buf = ""
    in_string = False

    for char in row:
        if char == "'":
            in_string = not in_string
            buf += char
        elif char == "," and not in_string:
            parts.append(buf.strip())
            buf = ""
        else:
            buf += char

    if buf:
        parts.append(buf.strip())

    return parts


def convert_despesas(values_blob: str) -> str:
    converted_rows = []

    for row in split_rows(values_blob):
        fields = split_fields(row)
        if len(fields) != 7:
            raise ValueError(f"Linha de despesas inválida: {row[:80]}...")
        fields[4] = bool_val(fields[4])
        fields[5] = bool_val(fields[5])
        converted_rows.append("(" + ", ".join(fields) + ")")

    return ", ".join(converted_rows)


def build_postgres_dump(mysql_content: str) -> str:
    schema = """-- Dump PostgreSQL convertido de dump-tesouraria-202608070727-mysql.sql
-- Compatível com o schema da aplicação Tesoureiro

BEGIN;

DROP TABLE IF EXISTS despesas CASCADE;
DROP TABLE IF EXISTS reuniao CASCADE;
DROP TABLE IF EXISTS grupo CASCADE;
DROP TABLE IF EXISTS csa CASCADE;

CREATE TABLE csa (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(400) NOT NULL
);

CREATE TABLE grupo (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(4000) NOT NULL,
  "Endereco" VARCHAR(4000) NOT NULL,
  "CSA" INTEGER NOT NULL,
  "Saldo" DECIMAL(12,2) NOT NULL,
  "DataSaldo" DATE DEFAULT NULL
);

CREATE TABLE reuniao (
  "Id" SERIAL PRIMARY KEY,
  "IdGrupo" INTEGER NOT NULL,
  "Data" DATE NOT NULL,
  "Membros" INTEGER NOT NULL,
  "Visitantes" INTEGER NOT NULL,
  "ValorSetima" DECIMAL(12,2) NOT NULL,
  "ValorSetimaPix" DECIMAL(12,2) NOT NULL,
  "VendaLiteratura" DECIMAL(12,2) DEFAULT NULL,
  "Ingresso" INTEGER NOT NULL,
  "TrintaDias" INTEGER NOT NULL,
  "SessentaDias" INTEGER NOT NULL,
  "NoventaDias" INTEGER NOT NULL,
  "SeisMeses" INTEGER NOT NULL,
  "NoveMeses" INTEGER NOT NULL,
  "UmAno" INTEGER NOT NULL,
  "DezoitoMeses" INTEGER NOT NULL,
  "MultiplosAnos" INTEGER NOT NULL,
  "FatosRelevantes" VARCHAR(4000) NOT NULL
);

CREATE TABLE despesas (
  "Id" SERIAL PRIMARY KEY,
  "IdReuniao" INTEGER NOT NULL,
  "Descricao" VARCHAR(400) NOT NULL,
  "ValorDespesa" DECIMAL(12,2) NOT NULL,
  repasse BOOLEAN DEFAULT NULL,
  compra_literatura BOOLEAN DEFAULT NULL,
  "Comprovante" BYTEA DEFAULT NULL
);
"""

    reuniao_columns = (
        '"Id", "IdGrupo", "Data", "Membros", "Visitantes", "ValorSetima", '
        '"ValorSetimaPix", "VendaLiteratura", "Ingresso", "TrintaDias", '
        '"SessentaDias", "NoventaDias", "SeisMeses", "NoveMeses", "UmAno", '
        '"DezoitoMeses", "MultiplosAnos", "FatosRelevantes"'
    )

    lines = [
        schema,
        'INSERT INTO csa ("Id", "Nome") VALUES ' + extract_insert(mysql_content, "csa") + ";",
        (
            'INSERT INTO grupo ("Id", "Nome", "Endereco", "CSA", "Saldo", "DataSaldo") VALUES '
            + extract_insert(mysql_content, "grupo")
            + ";"
        ),
        f"INSERT INTO reuniao ({reuniao_columns}) VALUES " + extract_insert(mysql_content, "reuniao") + ";",
        (
            'INSERT INTO despesas ("Id", "IdReuniao", "Descricao", "ValorDespesa", repasse, compra_literatura, "Comprovante") VALUES '
            + convert_despesas(extract_insert(mysql_content, "despesas"))
            + ";"
        ),
        """SELECT setval(pg_get_serial_sequence('csa', 'Id'), COALESCE((SELECT MAX("Id") FROM csa), 1));
SELECT setval(pg_get_serial_sequence('grupo', 'Id'), COALESCE((SELECT MAX("Id") FROM grupo), 1));
SELECT setval(pg_get_serial_sequence('reuniao', 'Id'), COALESCE((SELECT MAX("Id") FROM reuniao), 1));
SELECT setval(pg_get_serial_sequence('despesas', 'Id'), COALESCE((SELECT MAX("Id") FROM despesas), 1));

COMMIT;
""",
    ]

    return "\n".join(lines)


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    mysql_path = project_root / "database" / "dump-tesouraria-202608070727-mysql.sql"
    out_path = project_root / "database" / "dump-tesouraria-202608070727-postgres.sql"

    if len(sys.argv) > 1:
        mysql_path = Path(sys.argv[1])
    if len(sys.argv) > 2:
        out_path = Path(sys.argv[2])

    mysql_content = mysql_path.read_text(encoding="utf-8")
    out_path.write_text(build_postgres_dump(mysql_content), encoding="utf-8")

    print(f"Gerado: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
