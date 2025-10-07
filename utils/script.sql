CREATE TABLE user (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL, 
    latitude DECIMAL(10,7),               
    longitude DECIMAL(10,7),              
    time DATETIME NOT NULL,
    photo VARCHAR(255),
    description TEXT,
    status ENUM('Not Claimed', 'Claimed') DEFAULT 'Not Claimed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);