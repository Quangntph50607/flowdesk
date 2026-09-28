-- ============================================================
-- FlowDesk - Customers / CRM module migration
-- SQL Server
-- Run this on an existing local flowdesk database.
-- ============================================================

USE flowdesk;
GO

IF OBJECT_ID('dbo.customers', 'U') IS NULL
BEGIN
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
END
GO

IF OBJECT_ID('dbo.customer_tags', 'U') IS NULL
BEGIN
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
END
GO

IF OBJECT_ID('dbo.customer_tag_assignments', 'U') IS NULL
BEGIN
    CREATE TABLE customer_tag_assignments (
        id          BIGINT    IDENTITY(1,1) PRIMARY KEY,
        customer_id BIGINT    NOT NULL,
        tag_id      BIGINT    NOT NULL,
        created_at  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

        CONSTRAINT FK_cta_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT FK_cta_tag FOREIGN KEY (tag_id) REFERENCES customer_tags(id),
        CONSTRAINT UQ_customer_tag_assignments UNIQUE (customer_id, tag_id)
    );
END
GO

IF OBJECT_ID('dbo.customer_activities', 'U') IS NULL
BEGIN
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
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customers_workspace')
    CREATE INDEX IX_customers_workspace ON customers(workspace_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customers_branch')
    CREATE INDEX IX_customers_branch ON customers(branch_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customers_status')
    CREATE INDEX IX_customers_status ON customers(status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customer_tags_workspace')
    CREATE INDEX IX_customer_tags_workspace ON customer_tags(workspace_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_cta_customer')
    CREATE INDEX IX_cta_customer ON customer_tag_assignments(customer_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_cta_tag')
    CREATE INDEX IX_cta_tag ON customer_tag_assignments(tag_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_customer_activities_customer')
    CREATE INDEX IX_customer_activities_customer ON customer_activities(customer_id);
GO

UPDATE customer_tags SET name = N'Khách mới' WHERE name = N'Khach moi';
UPDATE customer_tags SET name = N'Cần gọi lại' WHERE name = N'Can goi lai';
UPDATE customer_tags SET name = N'Đã báo giá' WHERE name = N'Da bao gia';
UPDATE customer_tags SET name = N'Đã mua' WHERE name = N'Da mua';
UPDATE customer_tags SET name = N'Tiềm năng' WHERE name = N'Tiem nang';
UPDATE customer_tags SET name = N'Khó chốt' WHERE name = N'Kho chot';
UPDATE customer_tags SET name = N'Ưu tiên cao' WHERE name = N'Uu tien cao';
GO

INSERT INTO customer_tags (workspace_id, name, color)
SELECT w.id, seed.name, seed.color
FROM workspaces w
CROSS APPLY (VALUES
    (N'VIP', '#f59e0b'),
    (N'Khách mới', '#2563eb'),
    (N'Cần gọi lại', '#dc2626'),
    (N'Đã báo giá', '#7c3aed'),
    (N'Đã mua', '#16a34a'),
    (N'Tiềm năng', '#0891b2'),
    (N'Khó chốt', '#64748b'),
    (N'Ưu tiên cao', '#e11d48')
) seed(name, color)
WHERE w.level = 0
  AND NOT EXISTS (
      SELECT 1
      FROM customer_tags t
      WHERE t.workspace_id = w.id AND t.name = seed.name
  );
GO
