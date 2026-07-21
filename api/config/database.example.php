<?php
// Headers CORS removidos daqui - devem ser enviados apenas nos endpoints específicos
// para evitar problemas com redirecionamentos
//
// Configure via variáveis de ambiente (Docker) ou edite os valores padrão abaixo (XAMPP/local).

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $conn;

    public function __construct() {
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'tesouraria';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '';
    }

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
            error_log("DB Error Details - Host: " . $this->host . ", DB: " . $this->db_name);
            throw new Exception("Erro na conexão com o banco de dados.");
        }

        return $this->conn;
    }
}
?>
