-- Schema base do banco tesouraria (PostgreSQL)

CREATE TABLE csa (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(400) NOT NULL
);

INSERT INTO csa ("Id", "Nome") VALUES
(1, 'CSA ABC'),
(2, 'CSA Mauá Sem Fronteiras');

SELECT setval(pg_get_serial_sequence('csa', 'Id'), (SELECT MAX("Id") FROM csa));

CREATE TABLE grupo (
  "Id" SERIAL PRIMARY KEY,
  "Nome" VARCHAR(4000) NOT NULL,
  "Endereco" VARCHAR(4000) NOT NULL,
  "CSA" INTEGER NOT NULL,
  "Saldo" DECIMAL(12,2) NOT NULL,
  "DataSaldo" DATE DEFAULT NULL
);

INSERT INTO grupo ("Id", "Nome", "Endereco", "CSA", "Saldo") VALUES
(1, 'Grupo Parque Erasmo', 'Rua Hipólito da Costa, 190 - Parque Erasmo - Santo André', 1, 0.00),
(2, 'Grupo Rudge Ramos', 'Rua Rio Feio, 58 - Vila Vivaldi - São Bernardo do Campo', 1, 0.00);

SELECT setval(pg_get_serial_sequence('grupo', 'Id'), (SELECT MAX("Id") FROM grupo));

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
