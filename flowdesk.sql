CREATE DATABASE flowdesk;
GO

USE flowdesk;
GO

CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,

    email NVARCHAR(255) NOT NULL,

    password_hash NVARCHAR(255) NOT NULL,

    full_name NVARCHAR(150) NOT NULL,

    avatar_url NVARCHAR(500) NULL,

    is_active BIT NOT NULL DEFAULT 1,

    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_users_email UNIQUE (email)
);
GO

CREATE TABLE refresh_tokens (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    is_revoked BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_refresh_tokens_user 
        FOREIGN KEY (user_id) REFERENCES users(id)
);


SELECT * FROM users;