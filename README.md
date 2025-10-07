# FinditUnsri

FinditUnsri is a platform that provides information about items found within the Sriwijaya University environment. This website aims to facilitate the handover of found items to the faculty administration, who will then upload the information to help return the items to their rightful owners.

---

## Features

-   An admin dashboard to manage found item data, including adding, updating, and deleting item information.
-   An item detail page to display complete information for each found item.
-   Saves the location coordinates of items to direct users to where the item can be retrieved.

---

## Installation and Setup

Here are the steps to run this project locally.

### 1. Prerequisites

-   [Node.js](https://nodejs.org/)
-   [NPM](https://www.npmjs.com/)
-   [MySQL](https://www.mysql.com/) or other MySQL databases like MariaDB.

### 2. Installation

1.  **Clone this repository:**
    ```bash
    git clone https://github.com/Faridi17/FindIt-Unsri.git
    cd FindIt-Unsri
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the project root and fill it with the following configuration. Replace `your_password` and `your_secret_key` with your own values.
    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password
    DB_NAME=findit_unsri
    PORT=3000
    SESSION_SECRET=your_secret_key
    ```

4.  **Create the MySQL database:**
    Run the following SQL command in your MySQL client.
    ```sql
    CREATE DATABASE findit_unsri;
    ```

5.  **Create the `user` and `item` tables:**
    Run the following SQL commands to create the necessary tables.
    ```sql
    CREATE TABLE user (
        id CHAR(36) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
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
        status ENUM('Not Claimed','Claimed') DEFAULT 'Not Claimed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

6.  **Run the server:**
    ```bash
    node index.js
    ```

7.  **Create an Admin User:**
    With the server running, you need to create a user account to log in. Send a `POST` request to `http://localhost:3000/register` using an API platform like Postman or Insomnia.

    **Request Body (JSON):**
    ```json
    {
    	"username": "username",
    	"password": "password"
    }
    ```

8.  **Access the application** in your browser at:
    ```
    http://localhost:3000
    ```
---

## License

This project is **Open Source**. You are free to use, modify, and distribute it as needed.