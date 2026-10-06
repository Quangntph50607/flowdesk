# FlowDesk - Tài liệu thiết kế hiện tại

Tài liệu này mô tả trạng thái đang được implement trong repo hiện tại. Khi có điểm khác với tài liệu cũ, ưu tiên theo code hiện tại.

---

## 1. FlowDesk là gì?

FlowDesk là nền tảng quản lý workspace, thành viên, khách hàng và chat nội bộ cho doanh nghiệp nhỏ/vừa. Hệ thống chạy theo mô hình nhiều workspace, trong đó dữ liệu nghiệp vụ được tách theo workspace tổng và chi nhánh.

MVP hiện tại tập trung vào:

```text
Đăng ký / đăng nhập
  -> setup hoặc chọn workspace
  -> quản lý workspace, chi nhánh, thành viên
  -> quản lý khách hàng, tag, lịch sử chăm sóc
  -> chat trực tiếp / chat nhóm realtime
  -> upload avatar / file chat qua storage ngoài
```

Các phần như task, notification, audit log, billing, automation, AI suggestion chưa phải implementation hiện tại trong repo.

---

## 2. Mô hình workspace

### 2.1 Hai tầng workspace

```text
Workspace tổng (level = 0)
  ├── Chi nhánh A (level = 1)
  ├── Chi nhánh B (level = 1)
  └── Chi nhánh C (level = 1)
```

- `workspaces.parent_id = NULL` và `level = 0`: workspace tổng.
- `workspaces.parent_id != NULL` và `level = 1`: chi nhánh.
- Constraint DB chỉ cho phép `level IN (0, 1)`.
- Chi nhánh luôn thuộc một workspace tổng.
- Workspace tổng vẫn có thể hoạt động nếu chưa có chi nhánh, nhưng module Customers hiện tại yêu cầu customer gắn với một `branch_id`.

### 2.2 Phân quyền workspace

Hệ thống có hai lớp quyền:

| Lớp quyền | Nơi lưu | Ghi chú |
| --- | --- | --- |
| Platform Admin | `users.system_role = 'SUPER_ADMIN'` | Tài khoản vận hành nội bộ FlowDesk |
| Workspace Role | `workspace_members.role_id` | Quyền của user trong workspace/chi nhánh |

Workspace roles hiện có:

| Role | Code | Nơi gán theo thiết kế hiện tại |
| --- | --- | --- |
| Owner | `OWNER` | Workspace tổng |
| Admin | `ADMIN` | Workspace tổng |
| Agent | `AGENT` | Chi nhánh, hoặc workspace user được gán trực tiếp |

Các rule chính đang có trong service:

- `SUPER_ADMIN` quản lý `/api/admin/**`.
- Khi tạo workspace tổng, hệ thống tự tạo membership `OWNER` cho owner.
- Owner/Admin của workspace tổng được tạo, sửa, xóa chi nhánh và quản lý members.
- User là member active của chi nhánh có thể truy cập data trong chi nhánh đó.
- Customer scope:
  - `SUPER_ADMIN`: xem được tất cả customer, có filter theo `workspaceId`, `branchId`, `status`, `tagId`, `search`.
  - `OWNER`/`ADMIN` ở workspace tổng: xem toàn bộ customer của workspace tổng theo các chi nhánh con.
  - User chỉ thuộc chi nhánh: chỉ xem customer của các chi nhánh mình là member active.

---

## 3. Backend hiện tại

Backend dùng Spring Boot, Spring Security JWT, JPA/Hibernate, SQL Server và WebSocket STOMP.

Các package chính:

```text
flowdesk_be/src/main/java/com/example/flowdesk_be
  config/
  controller/
  dto/request/
  dto/response/
  entity/
  exception/
  repository/
  security/
  service/
  service/impl/
```

Security hiện tại:

- `/api/auth/**`: public.
- `/ws/**`: public ở filter chain để handshake WebSocket.
- `/swagger-ui/**`, `/v3/api-docs/**`: public.
- `/api/admin/**`: yêu cầu role `SUPER_ADMIN`.
- `/api/me/**`, `/api/workspaces/**`, `/api/upload/**`: authenticated.
- JWT access token mặc định sống 24 giờ.
- Refresh token sống mặc định 7 ngày.

---

## 4. Database hiện tại

`database/schema.sql` đang tạo database SQL Server với các bảng nền tảng và CRM. `spring.jpa.hibernate.ddl-auto=none`, nên DB sạch cần có migration/schema đầy đủ trước khi chạy app.

### 4.1 Thứ tự bảng trong `schema.sql`

```text
1. users
2. refresh_tokens
3. roles
4. workspaces
5. workspace_members
6. customers
7. customer_tags
8. customer_tag_assignments
9. customer_activities
```

Ngoài ra code hiện có entity chat:

```text
chat_rooms
chat_room_members
chat_messages
```

`database/migration_chat_details.sql` chỉ bổ sung cột cho `chat_rooms` và `chat_room_members` nếu các bảng này đã tồn tại. Nếu dựng DB mới từ đầu, cần đảm bảo migration tạo 3 bảng chat base cũng được chạy/có sẵn.

### 4.2 `users`

```sql
CREATE TABLE users (
    id               BIGINT        IDENTITY(1,1) PRIMARY KEY,
    email            NVARCHAR(255) NOT NULL,
    password_hash    NVARCHAR(255) NOT NULL,
    full_name        NVARCHAR(150) NOT NULL,
    avatar_url       NVARCHAR(500) NULL,
    phone            NVARCHAR(40)  NULL,
    phone_normalized NVARCHAR(20)  NULL,
    address          NVARCHAR(500) NULL,
    date_of_birth    DATE          NULL,
    system_role      NVARCHAR(50)  NULL,
    is_active        BIT           NOT NULL DEFAULT 1,
    created_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at       DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_users_email UNIQUE (email),
    CONSTRAINT CHK_users_system_role CHECK (system_role IN ('SUPER_ADMIN') OR system_role IS NULL)
);
```

Index bổ sung:

```sql
CREATE UNIQUE INDEX UX_users_phone_normalized
ON users(phone_normalized)
WHERE phone_normalized IS NOT NULL;
```

### 4.3 `refresh_tokens`

```sql
CREATE TABLE refresh_tokens (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    user_id    BIGINT        NOT NULL,
    token      NVARCHAR(500) NOT NULL UNIQUE,
    expires_at DATETIME2     NOT NULL,
    is_revoked BIT           NOT NULL DEFAULT 0,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.4 `roles`

```sql
CREATE TABLE roles (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    code       NVARCHAR(50)  NOT NULL UNIQUE,
    name       NVARCHAR(100) NOT NULL,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT CHK_roles_code CHECK (code IN ('OWNER', 'ADMIN', 'AGENT'))
);
```

Seed hiện tại:

```sql
INSERT INTO roles (code, name) VALUES
    ('OWNER', N'Chủ workspace'),
    ('ADMIN', N'Quản trị viên'),
    ('AGENT', N'Nhân viên');
```

### 4.5 `workspaces`

```sql
CREATE TABLE workspaces (
    id         BIGINT        IDENTITY(1,1) PRIMARY KEY,
    name       NVARCHAR(150) NOT NULL,
    slug       NVARCHAR(150) NOT NULL UNIQUE,
    owner_id   BIGINT        NOT NULL,
    parent_id  BIGINT        NULL,
    level      TINYINT       NOT NULL DEFAULT 0,
    is_active  BIT           NOT NULL DEFAULT 1,
    created_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),
    updated_at DATETIME2     NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_workspaces_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT FK_workspaces_parent FOREIGN KEY (parent_id) REFERENCES workspaces(id),
    CONSTRAINT CHK_workspaces_level CHECK (level IN (0, 1))
);
```

### 4.6 `workspace_members`

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
    CONSTRAINT FK_wm_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT FK_wm_role FOREIGN KEY (role_id) REFERENCES roles(id),
    CONSTRAINT UQ_workspace_user UNIQUE (workspace_id, user_id)
);
```

### 4.7 CRM customers

Code hiện tại không dùng bảng `tags` và bảng nối `customer_tags` như tài liệu cũ. Thay vào đó:

- `customer_tags`: danh mục tag theo workspace tổng.
- `customer_tag_assignments`: bảng gán tag cho customer.
- `customer_activities`: lịch sử thao tác trên customer.

```sql
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
```

Customer status hợp lệ:

```text
NEW, CONTACTING, POTENTIAL, QUOTED, WON, LOST
```

Tag và activity:

```sql
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

CREATE TABLE customer_tag_assignments (
    id          BIGINT    IDENTITY(1,1) PRIMARY KEY,
    customer_id BIGINT    NOT NULL,
    tag_id      BIGINT    NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_cta_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT FK_cta_tag FOREIGN KEY (tag_id) REFERENCES customer_tags(id),
    CONSTRAINT UQ_customer_tag_assignments UNIQUE (customer_id, tag_id)
);

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
```

Workspace tổng được tạo sẽ seed các tag mặc định: `VIP`, `Khách mới`, `Cần gọi lại`, `Đã báo giá`, `Đã mua`, `Tiềm năng`, `Khó chốt`, `Ưu tiên cao`.

### 4.8 Chat entities hiện tại

Code hiện tại dùng chat nội bộ theo phòng, không dùng các bảng `conversations`, `conversation_members`, `messages` như tài liệu cũ.

Các entity hiện có:

```text
chat_rooms
  id
  workspace_id
  type              -- DIRECT | GROUP
  name
  avatar_url
  description
  created_by
  is_active
  created_at
  updated_at

chat_room_members
  id
  room_id
  user_id
  is_owner
  is_active
  is_muted
  is_pinned
  invited_by
  removed_by
  joined_at
  left_at
  last_read_at

chat_messages
  id
  room_id
  sender_id
  type              -- TEXT | IMAGE | FILE | VIDEO | AUDIO | SYSTEM
  content
  file_name
  file_size
  is_recalled
  is_edited
  created_at
  updated_at
```

Khi gọi chat từ chi nhánh, service resolve về workspace tổng để room chat nằm ở scope workspace tổng.

---

## 5. API hiện tại

### 5.1 Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all
```

Auth response hiện có thêm thông tin profile:

```json
{
  "accessToken": "jwt",
  "refreshToken": "uuid",
  "tokenType": "Bearer",
  "userId": 10,
  "email": "owner@flowdesk.vn",
  "fullName": "Nguyễn Văn A",
  "avatarUrl": null,
  "phone": null,
  "address": null,
  "dateOfBirth": null,
  "systemRole": null,
  "workspaces": [
    {
      "workspaceId": 1,
      "workspaceName": "Spa ABC",
      "workspaceSlug": "spa-abc",
      "parentId": null,
      "roleCode": "OWNER"
    }
  ]
}
```

### 5.2 User / admin users

```text
GET /api/me
GET /api/admin/users
GET /api/admin/users/by-email
GET /api/admin/users/{id}
```

### 5.3 Workspace

```text
POST   /api/admin/workspaces
GET    /api/admin/workspaces
GET    /api/admin/workspaces/{id}
PUT    /api/admin/workspaces/{id}
DELETE /api/admin/workspaces/{id}

POST   /api/workspaces
GET    /api/workspaces/{workspaceId}
POST   /api/workspaces/{workspaceId}/branches
GET    /api/workspaces/{workspaceId}/branches
PUT    /api/workspaces/{workspaceId}/branches/{branchId}
DELETE /api/workspaces/{workspaceId}/branches/{branchId}

GET    /api/workspaces/{workspaceId}/available-users
GET    /api/workspaces/{workspaceId}/all-members
POST   /api/workspaces/{workspaceId}/members
GET    /api/workspaces/{workspaceId}/members
DELETE /api/workspaces/{workspaceId}/members/{memberId}
```

### 5.4 Customers / CRM

```text
GET  /api/customers
GET  /api/workspaces/{workspaceId}/customers
GET  /api/workspaces/{workspaceId}/customers/{customerId}
POST /api/workspaces/{workspaceId}/customers
PUT  /api/workspaces/{workspaceId}/customers/{customerId}

GET    /api/workspaces/{workspaceId}/customer-tags
POST   /api/workspaces/{workspaceId}/customer-tags
PUT    /api/workspaces/{workspaceId}/customer-tags/{tagId}
DELETE /api/workspaces/{workspaceId}/customer-tags/{tagId}

GET /api/workspaces/{workspaceId}/customers/{customerId}/activities
```

List endpoints đang trả qua `PageResponse.fromList(...)`, tức phân trang ở memory theo `limit` và `page`.

### 5.5 Chat REST

```text
GET    /api/workspaces/{workspaceId}/chat/rooms
POST   /api/workspaces/{workspaceId}/chat/rooms/direct
POST   /api/workspaces/{workspaceId}/chat/rooms/group
GET    /api/workspaces/{workspaceId}/chat/rooms/{roomId}/messages
POST   /api/workspaces/{workspaceId}/chat/rooms/{roomId}/read
POST   /api/workspaces/{workspaceId}/chat/rooms/{roomId}/members/{targetUserId}
DELETE /api/workspaces/{workspaceId}/chat/rooms/{roomId}/members/{targetUserId}
POST   /api/workspaces/{workspaceId}/chat/rooms/{roomId}/leave
PATCH  /api/workspaces/{workspaceId}/chat/rooms/{roomId}/name
PATCH  /api/workspaces/{workspaceId}/chat/rooms/{roomId}/avatar
GET    /api/workspaces/{workspaceId}/chat/rooms/{roomId}/members
DELETE /api/workspaces/{workspaceId}/chat/rooms/{roomId}
```

### 5.6 Upload

```text
POST /api/upload/avatar
POST /api/upload/chat
GET  /api/upload/presign
```

Storage hiện tại cấu hình qua Backblaze B2/S3-compatible env:

```text
B2_ENDPOINT
B2_REGION
B2_BUCKET_NAME
B2_KEY_ID
B2_APPLICATION_KEY
```

---

## 6. Realtime chat

WebSocket hiện tại dùng STOMP qua endpoint `/ws`.

Flow gửi message:

```text
FE connect /ws
  -> subscribe /topic/room/{roomId}
  -> send JSON tới /app/chat/{roomId}/send
  -> BE lưu chat_messages
  -> BE broadcast MessageResponse tới /topic/room/{roomId}
```

Payload gửi message:

```json
{
  "type": "TEXT",
  "content": "Nội dung tin nhắn",
  "fileName": null,
  "fileSize": null
}
```

`type` hợp lệ:

```text
TEXT, IMAGE, FILE, VIDEO, AUDIO, SYSTEM
```

REST vẫn dùng để:

- Lấy danh sách rooms.
- Tạo direct room hoặc group room.
- Lấy lịch sử messages.
- Mark read.
- Quản lý member group.
- Đổi tên, đổi avatar, xóa group.

---

## 7. Frontend hiện tại

Frontend hiện tại là Nuxt 3/Vue 3, không phải Next.js App Router.

Stack:

```text
Nuxt 3
Vue 3
Pinia
PrimeVue
Tailwind CSS
STOMP + SockJS client
Axios
```

Routes hiện có:

```text
/
/login
/register
/setup-workspace

/dashboard
/dashboard/users
/dashboard/workspaces
/dashboard/workspaces/[id]
/dashboard/workspaces/[id]/branches/[branchId]
/dashboard/customers
/dashboard/chat
```

Layouts:

```text
layouts/auth.vue
layouts/default.vue
```

Middleware:

```text
middleware/auth.ts
middleware/guest.ts
```

Stores/composables chính:

```text
stores/auth.ts
stores/chat.ts

composables/useApi.ts
composables/useAuthCookies.ts
composables/useChat.ts
composables/useFileUpload.ts
composables/useAppToast.ts
composables/useAppConfirm.ts
```

Ghi chú khác với tài liệu cũ:

- Không có route `/admin-workspace/*` hoặc `/agent/*`.
- Các màn workspace, customers, chat hiện nằm dưới `/dashboard/*`.
- Không có route guard React component như `<SuperAdminGuard>`.
- Guard thực tế dùng Nuxt middleware và logic trong store/API.

---

## 8. Nguyên tắc dữ liệu hiện tại

### 8.1 Workspace isolation

Business data hiện tại tách theo workspace và branch:

- Customer có `workspace_id` trỏ workspace tổng.
- Customer có `branch_id` trỏ chi nhánh.
- Customer tag thuộc workspace tổng.
- Chat room thuộc workspace tổng sau khi normalize từ chi nhánh.

### 8.2 Soft delete

Các entity có soft delete hiện tại:

- `workspaces.is_active`
- `workspace_members.is_active`
- `customers.is_active`
- `chat_rooms.is_active`
- `chat_room_members.is_active`

### 8.3 Những bảng chưa có trong implementation hiện tại

Các bảng/feature trong tài liệu cũ nhưng chưa có entity/controller/schema hiện tại:

```text
tasks
notifications
audit_logs
conversations
conversation_members
messages theo mô hình customer conversation
```

Chat hiện tại là chat nội bộ giữa users (`chat_rooms`, `chat_room_members`, `chat_messages`), không phải conversation với customer.

---

## 9. Checklist khi cập nhật tiếp

Khi code thay đổi, ưu tiên cập nhật các phần sau trong tài liệu:

1. `database/schema.sql` và migration đi kèm.
2. Entity JPA trong `flowdesk_be/entity`.
3. Controller mappings trong `flowdesk_be/controller`.
4. Route thực tế trong `flowdesk_fe/pages`.
5. Store/composable frontend nếu thay đổi flow đăng nhập, workspace, customers hoặc chat.

