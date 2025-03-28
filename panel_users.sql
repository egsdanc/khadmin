CREATE TABLE panel_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    branch VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'Bayi',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    image TEXT,
    email_token VARCHAR(255),
    remember_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    firma VARCHAR(255) DEFAULT NULL,
    INDEX email_idx (email),
    INDEX role_idx (role),
    INDEX status_idx (status),
    INDEX firma_idx (firma)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_turkish_ci;