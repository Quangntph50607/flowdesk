USE flowdesk;
GO

IF OBJECT_ID('chat_rooms', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('chat_rooms', 'avatar_url') IS NULL
        ALTER TABLE chat_rooms ADD avatar_url NVARCHAR(500) NULL;

    IF COL_LENGTH('chat_rooms', 'description') IS NULL
        ALTER TABLE chat_rooms ADD description NVARCHAR(500) NULL;
END
GO

IF OBJECT_ID('chat_room_members', 'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('chat_room_members', 'is_muted') IS NULL
        ALTER TABLE chat_room_members ADD is_muted BIT NOT NULL CONSTRAINT DF_chat_room_members_is_muted DEFAULT 0;

    IF COL_LENGTH('chat_room_members', 'is_pinned') IS NULL
        ALTER TABLE chat_room_members ADD is_pinned BIT NOT NULL CONSTRAINT DF_chat_room_members_is_pinned DEFAULT 0;

    IF COL_LENGTH('chat_room_members', 'invited_by') IS NULL
        ALTER TABLE chat_room_members ADD invited_by BIGINT NULL;

    IF COL_LENGTH('chat_room_members', 'removed_by') IS NULL
        ALTER TABLE chat_room_members ADD removed_by BIGINT NULL;

    IF COL_LENGTH('chat_room_members', 'left_at') IS NULL
        ALTER TABLE chat_room_members ADD left_at DATETIME2 NULL;

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_crm_invited_by')
        ALTER TABLE chat_room_members
        ADD CONSTRAINT FK_crm_invited_by FOREIGN KEY (invited_by) REFERENCES users(id);

    IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_crm_removed_by')
        ALTER TABLE chat_room_members
        ADD CONSTRAINT FK_crm_removed_by FOREIGN KEY (removed_by) REFERENCES users(id);
END
GO
