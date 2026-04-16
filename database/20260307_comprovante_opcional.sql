-- Alterar campo Comprovante para permitir NULL (tornar opcional)
ALTER TABLE `despesas` MODIFY `Comprovante` MEDIUMBLOB NULL;
