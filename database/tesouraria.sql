-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16/01/2026 às 01:52
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
-- Estrutura para tabela `grupo`
--

CREATE TABLE `grupo` (
  `Id` int(11) NOT NULL,
  `Nome` varchar(4000) NOT NULL,
  `Endereco` varchar(4000) NOT NULL,
  `CSA` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=utf8mb4_unicode_ci;

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
  `ValorSetima` decimal(10,0) NOT NULL,
  `ValorDespesa` decimal(10,0) NOT NULL,
  `DescricaoDespesa` varchar(4000) NOT NULL,
  `Ingresso` int(11) NOT NULL,
  `TrintaDias` int(11) NOT NULL,
  `SessentaDias` int(11) NOT NULL,
  `NoventaDias` int(11) NOT NULL,
  `SeisMeses` int(11) NOT NULL,
  `NoveMeses` int(11) NOT NULL,
  `UmAno` int(11) NOT NULL,
  `DezoitoMeses` int(11) NOT NULL,
  `MultiplosAnos` int(11) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=utf8mb4_unicode_ci;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
