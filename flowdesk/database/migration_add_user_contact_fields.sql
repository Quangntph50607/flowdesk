USE flowdesk;
GO

IF COL_LENGTH('users', 'phone') IS NULL
BEGIN
    ALTER TABLE users ADD phone NVARCHAR(40) NULL;
END
ELSE
BEGIN
    ALTER TABLE users ALTER COLUMN phone NVARCHAR(40) NULL;
END
GO

IF COL_LENGTH('users', 'phone_normalized') IS NULL
BEGIN
    ALTER TABLE users ADD phone_normalized NVARCHAR(20) NULL;
END
GO

IF COL_LENGTH('users', 'address') IS NULL
BEGIN
    ALTER TABLE users ADD address NVARCHAR(500) NULL;
END
GO

IF COL_LENGTH('users', 'date_of_birth') IS NULL
BEGIN
    ALTER TABLE users ADD date_of_birth DATE NULL;
END
GO

UPDATE users
SET phone_normalized =
    CASE
        WHEN LEFT(cleaned.phone_value, 3) = '+84' THEN CONCAT('0', SUBSTRING(cleaned.phone_value, 4, 20))
        WHEN LEFT(cleaned.phone_value, 2) = '84' THEN CONCAT('0', SUBSTRING(cleaned.phone_value, 3, 20))
        ELSE cleaned.phone_value
    END
FROM users
CROSS APPLY (
    SELECT REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(phone)), ' ', ''), '.', ''), '-', ''), '(', ''), ')', '') AS phone_value
) cleaned
WHERE phone IS NOT NULL
  AND LTRIM(RTRIM(phone)) <> ''
  AND phone_normalized IS NULL;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_users_phone_normalized'
      AND object_id = OBJECT_ID('users')
)
BEGIN
    CREATE UNIQUE INDEX UX_users_phone_normalized
    ON users(phone_normalized)
    WHERE phone_normalized IS NOT NULL;
END
GO
