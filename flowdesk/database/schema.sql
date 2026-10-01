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
    phone         NVARCHAR(40)  NULL,
    phone_normalized NVARCHAR(20) NULL,
    address       NVARCHAR(500) NULL,
    date_of_birth DATE          NULL,
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
-- 6. customers
-- ============================================================
CREATE TABLE customers (
    id               BIGINT         IDENTITY(1,1) PRIMARY KEY,
    workspace_id     BIGINT         NOT NULL,
    branch_id        BIGINT         NOT NULL,
    assigned_user_id BIGINT         NULL,
    created_by       BIGINT         NOT NULL,
    name             NVARCHAR(150)  NOT NULL,
    phone            NVARCHAR(40)   NULL,
    email            NVARCHAR(255)  NULL,
    address          NVARCHAR(500)  NULL,
    source           NVARCHAR(80)   NULL,
    status           NVARCHAR(50)   NOT NULL DEFAULT 'NEW',
    note             NVARCHAR(1000) NULL,
    is_active        BIT            NOT NULL DEFAULT 1,
    created_at       DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    updated_at       DATETIME2      NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_customers_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT FK_customers_branch FOREIGN KEY (branch_id) REFERENCES workspaces(id),
    CONSTRAINT FK_customers_assigned_user FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    CONSTRAINT FK_customers_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT CHK_customers_status CHECK (status IN ('NEW', 'CONTACTING', 'POTENTIAL', 'QUOTED', 'WON', 'LOST'))
);
GO

-- ============================================================
-- 7. customer_tags
-- ============================================================
CREATE TABLE customer_tags (
    id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
    workspace_id BIGINT        NOT NULL,
    name         NVARCHAR(80)  NOT NULL,
    color        NVARCHAR(20)  NOT NULL DEFAULT '#64748b',
    created_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_customer_tags_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    CONSTRAINT UQ_customer_tags_workspace_name UNIQUE (workspace_id, name)
);
GO

-- ============================================================
-- 8. customer_tag_assignments
-- ============================================================
CREATE TABLE customer_tag_assignments (
    id          BIGINT    IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT    NOT NULL,
    tag_id      BIGINT    NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_cta_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT FK_cta_tag FOREIGN KEY (tag_id) REFERENCES customer_tags(id),
    CONSTRAINT UQ_customer_tag_assignments UNIQUE (customer_id, tag_id)
);
GO

-- ============================================================
-- 9. customer_activities
-- ============================================================
CREATE TABLE customer_activities (
    id          BIGINT        IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT        NOT NULL,
    actor_id    BIGINT        NOT NULL,
    action      NVARCHAR(50)  NOT NULL,
    description NVARCHAR(500) NOT NULL,
    created_at  DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_customer_activities_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT FK_customer_activities_actor FOREIGN KEY (actor_id) REFERENCES users(id)
);
GO

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IX_workspaces_parent     ON workspaces(parent_id);
CREATE INDEX IX_wm_workspace          ON workspace_members(workspace_id);
CREATE INDEX IX_wm_user               ON workspace_members(user_id);
CREATE UNIQUE INDEX UX_users_phone_normalized ON users(phone_normalized) WHERE phone_normalized IS NOT NULL;
CREATE INDEX IX_customers_workspace   ON customers(workspace_id);
CREATE INDEX IX_customers_branch      ON customers(branch_id);
CREATE INDEX IX_customers_status      ON customers(status);
CREATE INDEX IX_customer_tags_workspace ON customer_tags(workspace_id);
CREATE INDEX IX_cta_customer          ON customer_tag_assignments(customer_id);
CREATE INDEX IX_cta_tag               ON customer_tag_assignments(tag_id);
CREATE INDEX IX_customer_activities_customer ON customer_activities(customer_id);
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
