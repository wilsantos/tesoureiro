-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16/01/2026 às 02:47
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `tesouraria`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `csa`
--

CREATE TABLE `csa` (
  `Id` int(11) NOT NULL,
  `Nome` varchar(400) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `csa`
--

INSERT INTO `csa` (`Id`, `Nome`) VALUES
(1, 'CSA ABC'),
(2, 'CSA Mauá Sem Fronteiras');

-- --------------------------------------------------------

--
-- Estrutura para tabela `despesas`
--

CREATE TABLE `despesas` (
  `Id` int(11) NOT NULL,
  `IdReuniao` int(11) NOT NULL,
  `Descricao` varchar(400) NOT NULL,
  `ValorDespesa` decimal(10,0) NOT NULL,
  `Comprovante` mediumblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `grupo`
--

CREATE TABLE `grupo` (
  `Id` int(11) NOT NULL,
  `Nome` varchar(4000) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `Endereco` varchar(4000) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `CSA` int(11) NOT NULL,
  `Saldo` decimal(12,2) NOT NULL,
  `DataSaldo` date DEFAULT NULL
)ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

--
-- Despejando dados para a tabela `grupo`
--

INSERT INTO `grupo` (`Id`, `Nome`, `Endereco`, `CSA`) VALUES
(1, 'Grupo Parque Erasmo', 'Rua Hipólito da Costa, 190 - Parque Erasmo - Santo André', 1),
(2, 'Grupo Rudge Ramos', 'Rua Rio Feio, 58 - Vila Vivaldi - São Bernardo do Campo', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `reuniao`
--

CREATE TABLE `reuniao` (
  `Id` int(11) NOT NULL,
  `IdGrupo` int(11) NOT NULL,
  `Data` date NOT NULL,
  `Membros` int(11) NOT NULL,
  `Visitantes` int(11) NOT NULL,
  `ValorSetima` decimal(12,2) NOT NULL,
  `ValorSetimaPix` decimal(12,2) NOT NULL,
  `Ingresso` int(11) NOT NULL,
  `TrintaDias` int(11) NOT NULL,
  `SessentaDias` int(11) NOT NULL,
  `NoventaDias` int(11) NOT NULL,
  `SeisMeses` int(11) NOT NULL,
  `NoveMeses` int(11) NOT NULL,
  `UmAno` int(11) NOT NULL,
  `DezoitoMeses` int(11) NOT NULL,
  `MultiplosAnos` int(11) NOT NULL,
  `FatosRelevantes` varchar(4000) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `csa`
--
ALTER TABLE `csa`
  ADD PRIMARY KEY (`Id`);

--
-- Índices de tabela `despesas`
--
ALTER TABLE `despesas`
  ADD PRIMARY KEY (`Id`);

--
-- Índices de tabela `grupo`
--
ALTER TABLE `grupo`
  ADD PRIMARY KEY (`Id`);

--
-- Índices de tabela `reuniao`
--
ALTER TABLE `reuniao`
  ADD PRIMARY KEY (`Id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `csa`
--
ALTER TABLE `csa`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `despesas`
--
ALTER TABLE `despesas`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `grupo`
--
ALTER TABLE `grupo`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `reuniao`
--
ALTER TABLE `reuniao`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
