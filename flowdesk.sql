CREATE DATABASE flowdesk;
GO

USE flowdesk;
GO

CREATE TABLE users (
    id            BIGINT        IDENTITY(1,1) PRIMARY KEY,
    email         NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name     NVARCHAR(150) NOT NULL,
    avatar_url    NVARCHAR(500) NULL,
    system_role   NVARCHAR(50)  NULL,
    is_active     BIT           NOT NULL DEFAULT 1,
    created_at    DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CHK_users_system_role CHECK (system_role IN ('SUPER_ADMIN') OR system_role IS NULL)
);

CREATE TABLE refresh_tokens (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    user_id    BIGINT        NOT NULL,
    token      NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2     NOT NULL,
    is_revoked BIT           NOT NULL DEFAULT 0,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE roles (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    code       NVARCHAR(50)  NOT NULL UNIQUE,
    name       NVARCHAR(100) NOT NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT CHK_roles_code CHECK (code IN ('ADMIN', 'AGENT'))
);

CREATE TABLE workspaces (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(150) NOT NULL,
    slug       NVARCHAR(150) NOT NULL UNIQUE,
    owner_id   BIGINT        NOT NULL,
    parent_id  BIGINT        NULL,
    level      INT           NOT NULL DEFAULT 0,
    is_active  BIT           NOT NULL DEFAULT 1,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_workspaces_owner  FOREIGN KEY (owner_id)  REFERENCES users(id),
    CONSTRAINT FK_workspaces_parent FOREIGN KEY (parent_id) REFERENCES workspaces(id),
    CONSTRAINT CHK_workspaces_level CHECK (level IN (0, 1))
);

CREATE TABLE workspace_members (
    id           BIGINT    IDENTITY(1,1) PRIMARY KEY,
    workspace_id BIGINT    NOT NULL,
    user_id      BIGINT    NOT NULL,
    role_id      BIGINT    NOT NULL,
    is_active    BIT       NOT NULL DEFAULT 1,
    joined_at    DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    created_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    CONSTRAINT FK_wm_workspace  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT FK_wm_user       FOREIGN KEY (user_id)      REFERENCES users(id),
    CONSTRAINT FK_wm_role       FOREIGN KEY (role_id)      REFERENCES roles(id),
    CONSTRAINT UQ_workspace_user UNIQUE (workspace_id, user_id)
);

-- Roles (master data cố định)
INSERT INTO roles (code, name) VALUES
('ADMIN', N'Quản trị viên workspace'),
('AGENT', N'Nhân viên');

-- SUPER_ADMIN account
-- Password: Admin@123
INSERT INTO users (email, password_hash, full_name, system_role, is_active) VALUES
(
    N'superadmin@flowdesk.vn',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
    N'Super Admin',
    'SUPER_ADMIN',
    1
);

-- Verify
SELECT id, email, full_name, system_role, is_active FROM users;
SELECT id, code, name FROM roles;

SELECT * FROM users;
SELECT * FROM roles;
SELECT * FROM workspaces;
SELECT * FROM workspace_members;

