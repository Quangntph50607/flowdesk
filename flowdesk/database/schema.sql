-- ============================================================
-- FlowDesk Database Schema
-- SQL Server
-- ============================================================

USE master;
GO

-- Drop và tạo lại DB
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'flowdesk')
BEGIN
    ALTER DATABASE flowdesk SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE flowdesk;
END
GO

CREATE DATABASE flowdesk;
GO

USE flowdesk;
GO

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    id            BIGINT        IDENTITY(1,1) PRIMARY KEY,
    email         NVARCHAR(255) NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    full_name     NVARCHAR(150) NOT NULL,
    avatar_url    NVARCHAR(500) NULL,
    system_role   NVARCHAR(50)  NULL,       -- NULL | 'SUPER_ADMIN'
    is_active     BIT           NOT NULL DEFAULT 1,
    created_at    DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at    DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_users_email         UNIQUE (email),
    CONSTRAINT CHK_users_system_role  CHECK (system_role IN ('SUPER_ADMIN') OR system_role IS NULL)
);
GO

-- ============================================================
-- 2. refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    user_id    BIGINT        NOT NULL,
    token      NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2     NOT NULL,
    is_revoked BIT           NOT NULL DEFAULT 0,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

-- ============================================================
-- 3. roles  (workspace roles: OWNER / ADMIN / AGENT)
-- ============================================================
CREATE TABLE roles (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    code       NVARCHAR(50)  NOT NULL UNIQUE,   -- 'OWNER' | 'ADMIN' | 'AGENT'
    name       NVARCHAR(100) NOT NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CHK_roles_code CHECK (code IN ('OWNER', 'ADMIN', 'AGENT'))
);
GO

-- ============================================================
-- 4. workspaces
-- ============================================================
CREATE TABLE workspaces (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(150) NOT NULL,
    slug       NVARCHAR(150) NOT NULL UNIQUE,
    owner_id   BIGINT        NOT NULL,           -- FK đến users (người tạo / OWNER)
    parent_id  BIGINT        NULL,               -- NULL = workspace tổng, non-null = chi nhánh
    level      TINYINT       NOT NULL DEFAULT 0, -- 0 = tổng, 1 = chi nhánh
    is_active  BIT           NOT NULL DEFAULT 1,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_workspaces_owner  FOREIGN KEY (owner_id)  REFERENCES users(id),
    CONSTRAINT FK_workspaces_parent FOREIGN KEY (parent_id) REFERENCES workspaces(id),
    CONSTRAINT CHK_workspaces_level CHECK (level IN (0, 1))
);
GO

-- ============================================================
-- 5. workspace_members
-- ============================================================
CREATE TABLE workspace_members (
    id           BIGINT    IDENTITY(1,1) PRIMARY KEY,
    workspace_id BIGINT    NOT NULL,
    user_id      BIGINT    NOT NULL,
    role_id      BIGINT    NOT NULL,
    is_active    BIT       NOT NULL DEFAULT 1,
    joined_at    DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    created_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_wm_workspace   FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT FK_wm_user        FOREIGN KEY (user_id)      REFERENCES users(id),
    CONSTRAINT FK_wm_role        FOREIGN KEY (role_id)      REFERENCES roles(id),
    CONSTRAINT UQ_workspace_user UNIQUE (workspace_id, user_id)
);
GO

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IX_workspaces_parent     ON workspaces(parent_id);
CREATE INDEX IX_wm_workspace          ON workspace_members(workspace_id);
CREATE INDEX IX_wm_user               ON workspace_members(user_id);
GO

-- ============================================================
-- Seed Data
-- ============================================================

-- Roles (cố định, không thay đổi)
INSERT INTO roles (code, name) VALUES
    ('OWNER', N'Chủ workspace'),
    ('ADMIN', N'Quản trị viên'),
    ('AGENT', N'Nhân viên');
GO

-- SUPER_ADMIN account
-- Email: superadmin@flowdesk.vn
-- Password: Admin@123  (BCrypt $2a$12$, generated via Spring BCryptPasswordEncoder)
INSERT INTO users (email, password_hash, full_name, system_role, is_active)
VALUES (
    N'superadmin@flowdesk.vn',
    '$2a$12$4geDGHa/VL6OYQHTdzyGkOyqwlXJLYTnWyAp3lwK6h6ggsDI7.SLa',
    N'Super Admin',
    'SUPER_ADMIN',
    1
);
GO

-- ============================================================
-- Verify
-- ============================================================
SELECT id, email, full_name, system_role, is_active FROM users;
SELECT id, code, name FROM roles;
GO
