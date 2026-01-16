<?php
// Headers CORS removidos daqui - devem ser enviados apenas nos endpoints específicos
// para evitar problemas com redirecionamentos

class Database {
    private $host = 'sql310.infinityfree.com';
    private $db_name = 'if0_40900505_db_tesouraria';
    private $username = 'if0_40900505';
    private $password = ''; // Preencha com a senha do banco de dados
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            error_log("Connection Error: " . $e->getMessage());
            // Em produção, não exponha detalhes do erro
            // Mas registre em log para debug
            error_log("DB Error Details - Host: " . $this->host . ", DB: " . $this->db_name);
            throw new Exception("Erro na conexão com o banco de dados.");
        }

        return $this->conn;
    }
}
?>
