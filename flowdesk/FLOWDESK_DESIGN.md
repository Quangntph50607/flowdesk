# FlowDesk – Tài liệu Thiết kế Nghiệp vụ, ERD & Database

---

## 1. FlowDesk là gì?

FlowDesk là nền tảng quản lý và chăm sóc khách hàng (CRM + Live Chat) dành cho doanh nghiệp nhỏ và vừa, hoạt động theo mô hình **multi-tenant SaaS**.

Mỗi doanh nghiệp sử dụng FlowDesk sẽ có **một Workspace riêng** — dữ liệu giữa các workspace hoàn toàn cách ly nhau.

### Mục tiêu MVP

```
Đăng nhập
     ↓
Vào workspace của doanh nghiệp
     ↓
Quản lý khách hàng
     ↓
Tạo hội thoại & nhắn tin realtime
     ↓
Gắn Tag / Tạo Task
     ↓
Theo dõi lịch sử chăm sóc
```

### Sau MVP

- Tích hợp kênh ngoài (Facebook, Zalo, Email)
- WebSocket realtime hoàn chỉnh
- AI suggestion
- Redis / Kafka / Automation
- Billing & Subscription

---

## 2. Mô hình Workspace — Tổng & Chi nhánh

### 2.1 Hai tầng, không hơn

```
Workspace Tổng (level = 0)  ←  đại diện cho doanh nghiệp
     ├── Chi nhánh A (level = 1)
     ├── Chi nhánh B (level = 1)
     └── Chi nhánh C (level = 1)
```

- Chỉ có **2 tầng**: workspace tổng và chi nhánh. Không có tầng thứ 3.
- Chi nhánh **luôn thuộc về** một workspace tổng duy nhất (`parent_id`).
- Nếu doanh nghiệp không tạo chi nhánh, **workspace tổng chính là nơi làm việc** — hoạt động bình thường, không cần chi nhánh.

### 2.2 Hai kịch bản sử dụng

**Kịch bản 1 — Không có chi nhánh (doanh nghiệp nhỏ)**

```
Workspace: Spa ABC
  → Tất cả members làm việc trực tiếp tại workspace tổng
  → Customer, Conversation, Task đều thuộc workspace tổng
```

**Kịch bản 2 — Có chi nhánh**

```
Workspace tổng: Spa ABC (level=0)
  ├── Chi nhánh: Spa ABC – Quận 1 (level=1)
  └── Chi nhánh: Spa ABC – Quận 3 (level=1)

Agent A → phân bổ vào "Quận 1" → chỉ thấy data của Quận 1
Agent B → phân bổ vào "Quận 3" → chỉ thấy data của Quận 3
Agent C → phân bổ vào cả "Quận 1" và "Quận 3" → thấy data của cả 2
Owner/Admin → thấy tất cả data của mọi chi nhánh, có cột "Chi nhánh" để biết data thuộc về đâu
```

### 2.3 Data thuộc về chi nhánh nào?

- Customer, Conversation, Task, Tag đều có `workspace_id`.
- Khi Agent Quận 1 thêm khách hàng, `workspace_id` = ID của chi nhánh Quận 1.
- Owner xem workspace tổng → **query tất cả** customers có `workspace_id` thuộc bất kỳ chi nhánh con nào (hoặc bản thân workspace tổng nếu không có chi nhánh).
- **Không "copy" data** giữa các tầng — query theo cây workspace.

---

## 3. Hệ thống Phân quyền

### 3.1 Hai tầng quyền

| Tầng               | Mô tả                                           | Lưu ở đâu                           |
| ------------------ | ----------------------------------------------- | ----------------------------------- |
| **Platform Admin** | Người vận hành hệ thống FlowDesk (internal)     | `users.system_role = 'SUPER_ADMIN'` |
| **Workspace Role** | Quyền của user trong workspace/chi nhánh cụ thể | `workspace_members.role_id`         |

> `SUPER_ADMIN` là tài khoản nội bộ của team FlowDesk, không phải doanh nghiệp dùng sản phẩm.

### 3.2 Workspace Roles

| Role      | Code    | Gán vào tầng nào                                               | Mô tả                                                                    |
| --------- | ------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Owner** | `OWNER` | Workspace tổng (level=0)                                       | Người tạo workspace. Toàn quyền trên cả workspace tổng lẫn mọi chi nhánh |
| **Admin** | `ADMIN` | Workspace tổng (level=0)                                       | Quản trị viên được Owner bổ nhiệm. Quản lý members, chi nhánh            |
| **Agent** | `AGENT` | Chi nhánh (level=1) hoặc workspace tổng nếu không có chi nhánh | Nhân viên chăm sóc khách hàng                                            |

### 3.3 Quy tắc phân quyền

**OWNER và ADMIN** (gán ở workspace tổng):

- Xem/quản lý toàn bộ data của workspace tổng + mọi chi nhánh
- Tạo/xóa/sửa chi nhánh
- Thêm/xóa thành viên ở bất kỳ tầng nào
- ADMIN không thể thêm ADMIN khác (chỉ OWNER mới thêm được ADMIN)

**AGENT** (gán ở chi nhánh):

- Chỉ thấy data của chi nhánh mình được phân bổ
- Một Agent **có thể thuộc nhiều chi nhánh** — thấy data của tất cả chi nhánh đó
- Không quản lý members, không thấy data chi nhánh khác

**Khi không có chi nhánh:**

- Agent được gán trực tiếp vào workspace tổng (level=0) với role `AGENT`
- Hoạt động y hệt như có chi nhánh, chỉ khác là `workspace_id` trỏ vào tổng

### 3.4 Ma trận quyền

| Hành động                 | SUPER_ADMIN | OWNER | ADMIN | AGENT |
| ------------------------- | :---------: | :---: | :---: | :---: |
| Quản lý toàn platform     |     ✅      |  ❌   |  ❌   |  ❌   |
| Xóa workspace             |     ❌      |  ✅   |  ❌   |  ❌   |
| Sửa tên workspace         |     ❌      |  ✅   |  ✅   |  ❌   |
| Tạo/xóa chi nhánh         |     ❌      |  ✅   |  ✅   |  ❌   |
| Thêm ADMIN                |     ❌      |  ✅   |  ❌   |  ❌   |
| Thêm AGENT vào chi nhánh  |     ❌      |  ✅   |  ✅   |  ❌   |
| Xem data tất cả chi nhánh |     ❌      |  ✅   |  ✅   |  ❌   |
| Xem data chi nhánh mình   |     ❌      |  ✅   |  ✅   |  ✅   |
| Thêm/sửa/xóa Customer     |     ❌      |  ✅   |  ✅   |  ✅   |
| Tạo/xử lý Conversation    |     ❌      |  ✅   |  ✅   |  ✅   |
| Gửi Message               |     ❌      |  ✅   |  ✅   |  ✅   |
| Tạo/hoàn thành Task       |     ❌      |  ✅   |  ✅   |  ✅   |
| Quản lý Tags              |     ❌      |  ✅   |  ✅   |  ❌   |

---

## 4. ERD Tổng thể

```
USERS
  │
  ├──[owns]──► WORKSPACES ◄──[parent]── WORKSPACES (self-ref, chi nhánh)
  │                 │
  │           WORKSPACE_MEMBERS ◄──[role]── ROLES
  │                 │
  │        (workspace_id = tổng hoặc chi nhánh)
  │                 │
  │                 ├──► CUSTOMERS ──────────────────────────────────┐
  │                 │         │                                       │
  │                 │         └──► CONVERSATIONS ──► MESSAGES        │
  │                 │                   │                             │
  │                 │                   └──► CONVERSATION_MEMBERS    │
  │                 │                                                 │
  │                 │         └──► CUSTOMER_TAGS ◄── TAGS            │
  │                 │                                                 │
  │                 └──► TASKS ◄───────────────────────────────────┘
  │                 │
  │                 ├──► NOTIFICATIONS
  │                 └──► AUDIT_LOGS
  │
  └──[receives]──► NOTIFICATIONS
  └──[assigned]──► CONVERSATIONS, TASKS
```

---

## 5. Database SQL Server

### Thứ tự tạo bảng

```
1.  users
2.  roles
3.  workspaces          ← self-referential (parent_id)
4.  workspace_members
5.  customers
6.  conversations
7.  conversation_members
8.  messages
9.  tags
10. customer_tags
11. tasks
12. notifications
13. audit_logs
```

---

### 5.1 `users`

```sql
CREATE TABLE users (
  id            BIGINT        IDENTITY(1,1) PRIMARY KEY,
  email         NVARCHAR(255) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  full_name     NVARCHAR(150) NOT NULL,
  avatar_url    NVARCHAR(500) NULL,
  system_role   NVARCHAR(50)  NULL,         -- NULL | 'SUPER_ADMIN'
  is_active     BIT           NOT NULL DEFAULT 1,
  created_at    DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  updated_at    DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);
```

---

### 5.2 `roles`

```sql
CREATE TABLE roles (
  id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
  code       NVARCHAR(50)  NOT NULL UNIQUE,  -- 'OWNER' | 'ADMIN' | 'AGENT'
  name       NVARCHAR(100) NOT NULL,
  created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME()
);

-- Seed data (chạy một lần khi setup)
INSERT INTO roles (code, name) VALUES
  ('OWNER', 'Chủ workspace'),
  ('ADMIN', 'Quản trị viên'),
  ('AGENT', 'Nhân viên');
```

---

### 5.3 `workspaces`

```sql
CREATE TABLE workspaces (
  id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
  name       NVARCHAR(150) NOT NULL,
  slug       NVARCHAR(150) NOT NULL UNIQUE,
  owner_id   BIGINT        NOT NULL,
  parent_id  BIGINT        NULL,    -- NULL = workspace tổng, non-null = chi nhánh
  level      TINYINT       NOT NULL DEFAULT 0,  -- 0 = tổng, 1 = chi nhánh
  is_active  BIT           NOT NULL DEFAULT 1,
  created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_workspaces_owner  FOREIGN KEY (owner_id)  REFERENCES users(id),
  CONSTRAINT FK_workspaces_parent FOREIGN KEY (parent_id) REFERENCES workspaces(id),
  CONSTRAINT CHK_workspace_level  CHECK (level IN (0, 1))  -- chỉ 2 tầng
);
```

**Ghi chú:**

- `level = 0`: workspace tổng — `parent_id` luôn NULL
- `level = 1`: chi nhánh — `parent_id` trỏ vào workspace tổng
- Constraint `CHK_workspace_level` enforce cứng không có tầng thứ 3

---

### 5.4 `workspace_members`

```sql
CREATE TABLE workspace_members (
  id           BIGINT    IDENTITY(1,1) PRIMARY KEY,
  workspace_id BIGINT    NOT NULL,
  user_id      BIGINT    NOT NULL,
  role_id      BIGINT    NOT NULL,
  is_active    BIT       NOT NULL DEFAULT 1,
  joined_at    DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  created_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  updated_at   DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_wm_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT FK_wm_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT FK_wm_role      FOREIGN KEY (role_id)      REFERENCES roles(id),
  CONSTRAINT UQ_workspace_user UNIQUE (workspace_id, user_id)
);
```

**Quy tắc gán role (enforce ở application layer):**

| Role    | Gán vào workspace level                                                 |
| ------- | ----------------------------------------------------------------------- |
| `OWNER` | level = 0 (workspace tổng)                                              |
| `ADMIN` | level = 0 (workspace tổng)                                              |
| `AGENT` | level = 1 (chi nhánh) — hoặc level = 0 nếu workspace không có chi nhánh |

**Ví dụ dữ liệu:**

```
workspace_members:
  workspace_id=1 (Spa ABC tổng),   user_id=10, role=OWNER   ← Owner
  workspace_id=1 (Spa ABC tổng),   user_id=11, role=ADMIN   ← Admin
  workspace_id=2 (Spa ABC Quận 1), user_id=12, role=AGENT   ← Agent Quận 1
  workspace_id=3 (Spa ABC Quận 3), user_id=12, role=AGENT   ← Agent 12 cũng ở Quận 3
  workspace_id=2 (Spa ABC Quận 1), user_id=13, role=AGENT   ← Agent chỉ Quận 1
```

> User 12 thuộc cả 2 chi nhánh → thấy data của cả 2.

---

### 5.5 `customers`

```sql
CREATE TABLE customers (
  id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
  workspace_id BIGINT        NOT NULL,    -- trỏ vào chi nhánh (hoặc tổng nếu k có chi nhánh)
  full_name    NVARCHAR(150) NOT NULL,
  phone        NVARCHAR(20)  NULL,
  email        NVARCHAR(255) NULL,
  avatar_url   NVARCHAR(500) NULL,
  source       NVARCHAR(50)  NULL,   -- 'WALK_IN' | 'REFERRAL' | 'FACEBOOK' | 'ZALO' | ...
  status       NVARCHAR(50)  NOT NULL DEFAULT 'ACTIVE',
  note         NVARCHAR(MAX) NULL,
  created_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  updated_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_customers_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);
```

**Cách query theo tầng:**

```sql
-- Agent Quận 1 (workspace_id = 2) xem customers của mình:
SELECT * FROM customers WHERE workspace_id = 2;

-- Owner xem tất cả customers của Spa ABC (workspace tổng id=1):
SELECT c.*, w.name AS branch_name
FROM customers c
JOIN workspaces w ON w.id = c.workspace_id
WHERE w.id = 1                          -- workspace tổng
   OR w.parent_id = 1                   -- tất cả chi nhánh của tổng
ORDER BY c.created_at DESC;
```

---

### 5.6 `conversations`

```sql
CREATE TABLE conversations (
  id               BIGINT        IDENTITY(1,1) PRIMARY KEY,
  workspace_id     BIGINT        NOT NULL,
  customer_id      BIGINT        NOT NULL,
  assigned_user_id BIGINT        NULL,
  channel          NVARCHAR(50)  NOT NULL DEFAULT 'WEB',
  status           NVARCHAR(50)  NOT NULL DEFAULT 'OPEN',
  subject          NVARCHAR(255) NULL,
  last_message_at  DATETIME2     NULL,
  created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  updated_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_conv_workspace FOREIGN KEY (workspace_id)     REFERENCES workspaces(id),
  CONSTRAINT FK_conv_customer  FOREIGN KEY (customer_id)      REFERENCES customers(id),
  CONSTRAINT FK_conv_agent     FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
```

---

### 5.7 `conversation_members`

```sql
CREATE TABLE conversation_members (
  id              BIGINT    IDENTITY(1,1) PRIMARY KEY,
  conversation_id BIGINT    NOT NULL,
  user_id         BIGINT    NOT NULL,
  joined_at       DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_cm_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT FK_cm_user         FOREIGN KEY (user_id)         REFERENCES users(id),
  CONSTRAINT UQ_conv_user       UNIQUE (conversation_id, user_id)
);
```

---

### 5.8 `messages`

```sql
CREATE TABLE messages (
  id              BIGINT        IDENTITY(1,1) PRIMARY KEY,
  conversation_id BIGINT        NOT NULL,
  sender_user_id  BIGINT        NULL,       -- NULL nếu sender_type = CUSTOMER / SYSTEM
  sender_type     NVARCHAR(20)  NOT NULL,   -- 'USER' | 'CUSTOMER' | 'SYSTEM' | 'AI'
  content         NVARCHAR(MAX) NOT NULL,
  message_type    NVARCHAR(20)  NOT NULL DEFAULT 'TEXT',
  status          NVARCHAR(20)  NOT NULL DEFAULT 'SENT',
  sent_at         DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  edited_at       DATETIME2     NULL,

  CONSTRAINT FK_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
  CONSTRAINT FK_msg_sender       FOREIGN KEY (sender_user_id)  REFERENCES users(id)
);
```

---

### 5.9 `tags`

```sql
CREATE TABLE tags (
  id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
  workspace_id BIGINT        NOT NULL,    -- thuộc workspace tổng hoặc chi nhánh
  name         NVARCHAR(100) NOT NULL,
  color        NVARCHAR(20)  NULL,
  created_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_tags_workspace     FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT UQ_tag_name_workspace UNIQUE (workspace_id, name)
);
```

---

### 5.10 `customer_tags`

```sql
CREATE TABLE customer_tags (
  customer_id BIGINT NOT NULL,
  tag_id      BIGINT NOT NULL,

  CONSTRAINT PK_customer_tags PRIMARY KEY (customer_id, tag_id),
  CONSTRAINT FK_ct_customer   FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT FK_ct_tag        FOREIGN KEY (tag_id)      REFERENCES tags(id)
);
```

---

### 5.11 `tasks`

```sql
CREATE TABLE tasks (
  id               BIGINT        IDENTITY(1,1) PRIMARY KEY,
  workspace_id     BIGINT        NOT NULL,
  customer_id      BIGINT        NULL,
  conversation_id  BIGINT        NULL,
  assigned_user_id BIGINT        NULL,
  title            NVARCHAR(255) NOT NULL,
  description      NVARCHAR(MAX) NULL,
  status           NVARCHAR(20)  NOT NULL DEFAULT 'TODO',
  priority         NVARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
  due_at           DATETIME2     NULL,
  completed_at     DATETIME2     NULL,
  created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  updated_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_tasks_workspace    FOREIGN KEY (workspace_id)     REFERENCES workspaces(id),
  CONSTRAINT FK_tasks_customer     FOREIGN KEY (customer_id)      REFERENCES customers(id),
  CONSTRAINT FK_tasks_conversation FOREIGN KEY (conversation_id)  REFERENCES conversations(id),
  CONSTRAINT FK_tasks_assignee     FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
```

---

### 5.12 `notifications`

```sql
CREATE TABLE notifications (
  id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
  workspace_id BIGINT        NOT NULL,
  user_id      BIGINT        NOT NULL,
  type         NVARCHAR(50)  NOT NULL,
  title        NVARCHAR(255) NOT NULL,
  content      NVARCHAR(MAX) NULL,
  is_read      BIT           NOT NULL DEFAULT 0,
  created_at   DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
  read_at      DATETIME2     NULL,

  CONSTRAINT FK_notif_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT FK_notif_user      FOREIGN KEY (user_id)      REFERENCES users(id)
);
```

---

### 5.13 `audit_logs`

```sql
CREATE TABLE audit_logs (
  id           BIGINT         IDENTITY(1,1) PRIMARY KEY,
  workspace_id BIGINT         NULL,
  user_id      BIGINT         NOT NULL,
  action       NVARCHAR(100)  NOT NULL,
  entity_type  NVARCHAR(50)   NOT NULL,
  entity_id    BIGINT         NULL,
  details      NVARCHAR(MAX)  NULL,
  created_at   DATETIME2      NOT NULL DEFAULT SYSDATETIME(),

  CONSTRAINT FK_audit_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  CONSTRAINT FK_audit_user      FOREIGN KEY (user_id)      REFERENCES users(id)
);
```

---

## 6. Indexes

```sql
-- users
CREATE UNIQUE INDEX IX_users_email ON users(email);

-- workspaces
CREATE UNIQUE INDEX IX_workspaces_slug   ON workspaces(slug);
CREATE INDEX        IX_workspaces_parent ON workspaces(parent_id);  -- query chi nhánh của tổng

-- workspace_members
CREATE INDEX IX_wm_workspace ON workspace_members(workspace_id);
CREATE INDEX IX_wm_user      ON workspace_members(user_id);         -- user thuộc ws nào

-- customers
CREATE INDEX IX_customers_workspace      ON customers(workspace_id);
CREATE INDEX IX_customers_ws_phone       ON customers(workspace_id, phone);

-- conversations
CREATE INDEX IX_conv_workspace_status    ON conversations(workspace_id, status);
CREATE INDEX IX_conv_customer            ON conversations(customer_id);
CREATE INDEX IX_conv_assigned            ON conversations(assigned_user_id);
CREATE INDEX IX_conv_last_message        ON conversations(workspace_id, last_message_at DESC);

-- messages (quan trọng nhất cho Inbox)
CREATE INDEX IX_messages_conv_sent       ON messages(conversation_id, sent_at);

-- tasks
CREATE INDEX IX_tasks_ws_user_status     ON tasks(workspace_id, assigned_user_id, status);

-- notifications
CREATE INDEX IX_notif_user_unread        ON notifications(user_id, is_read);

-- audit_logs
CREATE INDEX IX_audit_workspace_time     ON audit_logs(workspace_id, created_at DESC);
```

---

## 7. Kiến trúc API

### 7.1 Nhóm endpoint

```
/api/auth/**                              → Public
/api/me                                   → Mọi user đã đăng nhập

/api/admin/**                             → SUPER_ADMIN only
  /api/admin/users/**
  /api/admin/workspaces/**

/api/workspace/{workspaceId}/**           → Members của workspace đó
  /api/workspace/{workspaceId}/branches/**        → OWNER + ADMIN
  /api/workspace/{workspaceId}/members/**         → OWNER + ADMIN
  /api/workspace/{workspaceId}/customers/**       → Tất cả members
  /api/workspace/{workspaceId}/conversations/**   → Tất cả members
  /api/workspace/{workspaceId}/tasks/**           → Tất cả members
  /api/workspace/{workspaceId}/tags/**            → OWNER + ADMIN
```

**Lưu ý authorization thực tế:**

- Khi Agent gọi `/api/workspace/2/customers` (chi nhánh Quận 1), BE kiểm tra user có `workspace_member` active ở workspace 2.
- Khi OWNER gọi `/api/workspace/1/customers` (workspace tổng), BE tự động include customers của tổng **và** tất cả chi nhánh con.

### 7.2 Auth Response

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "uuid...",
  "tokenType": "Bearer",
  "userId": 10,
  "email": "owner@spaABC.vn",
  "fullName": "Nguyễn Văn A",
  "avatarUrl": null,
  "systemRole": null,
  "workspaces": [
    {
      "workspaceId": 1,
      "workspaceName": "Spa ABC",
      "workspaceSlug": "spa-abc",
      "parentId": null,
      "roleCode": "OWNER"
    },
    {
      "workspaceId": 2,
      "workspaceName": "Spa ABC – Quận 1",
      "workspaceSlug": "spa-abc-quan-1",
      "parentId": 1,
      "roleCode": "AGENT"
    }
  ]
}
```

> `parentId = null` → workspace tổng. `parentId = 1` → chi nhánh của workspace 1.
> FE dùng thông tin này để render đúng sidebar và guard.

---

## 8. Kiến trúc Frontend (Next.js App Router)

### 8.1 Xác định portal theo role

```
user.systemRole === 'SUPER_ADMIN'
  → SUPER_ADMIN Portal (/dashboard, /admin/*)

user.workspaces có entry với roleCode='OWNER' hoặc 'ADMIN' và parentId=null
  → Owner/Admin Portal (/admin-workspace/*)

user.workspaces chỉ có entry với roleCode='AGENT' (parentId != null)
  → Agent Portal (/agent/*)
```

### 8.2 Cấu trúc route

```
(auth)/
  login/
  register/

(dashboard)/
  welcome/               ← Workspace picker (SUPER_ADMIN, OWNER, ADMIN)
  dashboard/             ← SUPER_ADMIN only — platform overview

  admin/                 ← SUPER_ADMIN only
    users/
    workspaces/
      [id]/              ← Chi tiết workspace + danh sách chi nhánh

  admin-workspace/       ← OWNER + ADMIN
    page                 ← Dashboard workspace tổng
    branches/            ← Quản lý chi nhánh
      [id]/
    members/             ← Quản lý thành viên

  agent/                 ← AGENT only
    page                 ← Danh sách chi nhánh được phân bổ
    branch/[id]/         ← Làm việc trong chi nhánh cụ thể

  profile/               ← Mọi user
```

### 8.3 Sidebar navigation

```
SUPER_ADMIN:          OWNER/ADMIN:              AGENT:
  Tổng quan             Dashboard                 Chi nhánh của tôi
  Người dùng            Chi nhánh
  Workspace             Thành viên
```

### 8.4 Route Guards

```tsx
// SUPER_ADMIN only
<SuperAdminGuard>...</SuperAdminGuard>

// OWNER hoặc ADMIN của workspace tổng
<WorkspaceOwnerAdminGuard>...</WorkspaceOwnerAdminGuard>

// AGENT — có ít nhất 1 chi nhánh được phân bổ
<AgentGuard>...</AgentGuard>
```

---

## 9. Logic hiển thị data theo role

### 9.1 Agent vào chi nhánh

```
Agent được gán vào chi nhánh Quận 1 (workspace_id = 2)
→ Vào /agent/branch/2
→ FE gọi /api/workspace/2/customers
→ BE: kiểm tra user có member record tại workspace 2 → trả data của workspace 2
→ Hiển thị: danh sách customers của Quận 1
```

### 9.2 Owner xem workspace tổng

```
Owner của Spa ABC (workspace_id = 1)
→ Vào /admin-workspace
→ FE gọi /api/workspace/1/customers
→ BE: user có role OWNER tại workspace 1
    → query: workspace_id = 1 OR parent_id = 1
    → kèm thêm field branch_name
→ Hiển thị: tất cả customers, có cột "Chi nhánh: Quận 1 / Quận 3 / Tổng"
```

### 9.3 Workspace không có chi nhánh

```
Spa XYZ không tạo chi nhánh
→ Agent được gán vào workspace tổng (workspace_id = 5, level=0) với role AGENT
→ Hoạt động bình thường, không khác gì có chi nhánh
→ Không có màn hình "chọn chi nhánh"
→ Vào thẳng /agent/workspace/5
```

---

## 10. Luồng WebSocket (Realtime)

```
Agent gửi tin nhắn
      ↓
POST /api/workspace/{id}/conversations/{convId}/messages
      ↓
BE: validate → save messages table → update last_message_at
      ↓
Phát WebSocket event → conversation_members của conversation đó
      ↓
FE nhận event → update UI ngay, không cần polling
```

**REST vs WebSocket:**
| | REST | WebSocket |
|---|:---:|:---:|
| Lịch sử messages | ✅ | ❌ |
| Gửi message mới | ✅ (persist) | ✅ (broadcast) |
| Typing indicator | ❌ | ✅ |
| Read receipt | ❌ | ✅ |
| New notification | ❌ | ✅ |

---

## 11. Thứ tự code Spring Boot

```
Giai đoạn 1 — Foundation
  1. Auth (register, login, refresh, logout)
  2. User (profile, /api/me)

Giai đoạn 2 — Workspace & Members
  3. Workspace (tạo tổng, tạo chi nhánh, CRUD)
  4. Workspace Members (thêm, phân role, xóa)

Giai đoạn 3 — Core Business
  5. Customer (CRUD, filter theo branch/tổng)
  6. Conversation (tạo, assign, đóng)
  7. Message (gửi, lịch sử)

Giai đoạn 4 — Productivity
  8. Tag (tạo, gắn cho customer)
  9. Task (tạo, assign, hoàn thành)

Giai đoạn 5 — Realtime
  10. WebSocket (message, typing, online status)
  11. Notification

Giai đoạn 6 — Platform Admin
  12. SUPER_ADMIN: quản lý toàn platform

Giai đoạn 7 — Infrastructure (sau MVP)
  13. Redis cache
  14. Kafka event streaming
  15. AI integration
```

---

## 12. Nguyên tắc thiết kế cốt lõi

**1. Mọi business data phải có `workspace_id`**
Đây là trụ cột của tenant isolation. Query luôn bắt đầu từ `workspace_id`.

**2. Workspace chỉ có 2 tầng**
`level = 0` (tổng) và `level = 1` (chi nhánh). Constraint `CHK_workspace_level` enforce cứng.
Nếu sau này cần "phòng ban trong chi nhánh", đó là feature riêng với bảng riêng.

**3. OWNER và ADMIN gán ở workspace tổng — AGENT gán ở chi nhánh**
Quyền quản lý (OWNER, ADMIN) luôn ở level 0.
Quyền làm việc (AGENT) ở level 1, hoặc level 0 nếu không có chi nhánh.

**4. Một Agent có thể thuộc nhiều chi nhánh**
`UQ_workspace_user` đảm bảo không gán trùng trong cùng một workspace.
Nhưng user có thể có N records trong `workspace_members` với N workspace_id khác nhau.

**5. Owner/Admin query xuyên chi nhánh**
Không denormalize data. Query bằng:

```sql
WHERE workspace_id = {tổng_id} OR parent_id = {tổng_id}
```

**6. Soft delete cho workspace và membership**
`workspaces.is_active = 0` và `workspace_members.is_active = 0`
thay vì xóa record — giữ lại audit trail.

---

## 13. Tóm tắt 13 bảng MVP

| #   | Bảng                   | Ghi chú quan trọng                                                |
| --- | ---------------------- | ----------------------------------------------------------------- |
| 1   | `users`                | `system_role` chỉ cho platform operator                           |
| 2   | `roles`                | 3 roles: OWNER / ADMIN / AGENT                                    |
| 3   | `workspaces`           | Self-ref: `parent_id` NULL = tổng, non-NULL = chi nhánh           |
| 4   | `workspace_members`    | OWNER+ADMIN → tổng; AGENT → chi nhánh (hoặc tổng nếu k có branch) |
| 5   | `customers`            | `workspace_id` trỏ vào chi nhánh cụ thể                           |
| 6   | `conversations`        | `workspace_id` = chi nhánh; `last_message_at` cho Inbox sort      |
| 7   | `conversation_members` | Nhiều agent cùng theo dõi 1 conversation                          |
| 8   | `messages`             | Core của realtime; index `(conversation_id, sent_at)`             |
| 9   | `tags`                 | Thuộc workspace (tổng hoặc chi nhánh)                             |
| 10  | `customer_tags`        | Many-to-many                                                      |
| 11  | `tasks`                | Link customer + conversation + user                               |
| 12  | `notifications`        | Realtime via WebSocket sau                                        |
| 13  | `audit_logs`           | Truy vết toàn bộ hành động                                        |
