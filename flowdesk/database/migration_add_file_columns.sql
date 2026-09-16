USE flowdesk;
GO

-- 1. Thêm cột file_name (bỏ qua nếu đã có)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('chat_messages') AND name = 'file_name'
)
BEGIN
    ALTER TABLE chat_messages ADD file_name NVARCHAR(500) NULL;
    PRINT 'Đã thêm cột file_name';
END
ELSE
    PRINT 'Cột file_name đã tồn tại, bỏ qua';
GO

-- 2. Thêm cột file_size (bỏ qua nếu đã có)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('chat_messages') AND name = 'file_size'
)
BEGIN
    ALTER TABLE chat_messages ADD file_size BIGINT NULL;
    PRINT 'Đã thêm cột file_size';
END
ELSE
    PRINT 'Cột file_size đã tồn tại, bỏ qua';
GO

-- 3. Thêm CHECK constraint bao gồm cả SYSTEM
--    (không cần drop vì query trước xác nhận không có constraint nào)
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE parent_object_id = OBJECT_ID('chat_messages')
      AND name = 'CHK_chat_messages_type'
)
BEGIN
    ALTER TABLE chat_messages
        ADD CONSTRAINT CHK_chat_messages_type
        CHECK (type IN ('TEXT', 'IMAGE', 'FILE', 'VIDEO', 'AUDIO', 'SYSTEM'));
    PRINT 'Đã thêm CHECK constraint';
END
ELSE
    PRINT 'Constraint đã tồn tại, bỏ qua';
GO

PRINT 'Migration hoàn tất!';
GO
