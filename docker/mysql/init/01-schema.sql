-- Schema base do banco tesouraria
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES latin1 */;

CREATE TABLE `csa` (
  `Id` int(11) NOT NULL,
  `Nome` varchar(400) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

INSERT INTO `csa` (`Id`, `Nome`) VALUES
(1, 'CSA ABC'),
(2, 'CSA Mauá Sem Fronteiras');

CREATE TABLE `despesas` (
  `Id` int(11) NOT NULL,
  `IdReuniao` int(11) NOT NULL,
  `Descricao` varchar(400) NOT NULL,
  `ValorDespesa` decimal(10,0) NOT NULL,
  `Comprovante` mediumblob NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

CREATE TABLE `grupo` (
  `Id` int(11) NOT NULL,
  `Nome` varchar(4000) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `Endereco` varchar(4000) CHARACTER SET latin1 COLLATE latin1_general_ci NOT NULL,
  `CSA` int(11) NOT NULL,
  `Saldo` decimal(12,2) NOT NULL,
  `DataSaldo` date DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=latin1 COLLATE=latin1_general_ci;

INSERT INTO `grupo` (`Id`, `Nome`, `Endereco`, `CSA`, `Saldo`) VALUES
(1, 'Grupo Parque Erasmo', 'Rua Hipólito da Costa, 190 - Parque Erasmo - Santo André', 1, 0.00),
(2, 'Grupo Rudge Ramos', 'Rua Rio Feio, 58 - Vila Vivaldi - São Bernardo do Campo', 1, 0.00);

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

ALTER TABLE `csa`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `despesas`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `grupo`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `reuniao`
  ADD PRIMARY KEY (`Id`);

ALTER TABLE `csa`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `despesas`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `grupo`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

ALTER TABLE `reuniao`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
