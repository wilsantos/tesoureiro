-- Migrações incrementais
ALTER TABLE `despesas` ADD `repasse` BOOLEAN NULL AFTER `ValorDespesa`, ADD `compra_literatura` BOOLEAN NULL AFTER `repasse`;
ALTER TABLE `reuniao` ADD `VendaLiteratura` DECIMAL(12,2) NULL AFTER `ValorSetimaPix`;
ALTER TABLE `despesas` MODIFY `Comprovante` MEDIUMBLOB NULL;
ALTER TABLE `despesas` MODIFY `ValorDespesa` DECIMAL(12,2) NOT NULL;
