CREATE TABLE app_users (id VARCHAR(36) PRIMARY KEY, name VARCHAR(80) NOT NULL, email VARCHAR(254) NOT NULL UNIQUE, password_hash VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE rooms ADD COLUMN owner_id VARCHAR(36) REFERENCES app_users(id) ON DELETE SET NULL;
CREATE INDEX rooms_owner_idx ON rooms(owner_id);
CREATE TABLE board_members (id VARCHAR(36) PRIMARY KEY, room_id VARCHAR(36) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE, user_id VARCHAR(36) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, role VARCHAR(16) NOT NULL DEFAULT 'EDITOR', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), CONSTRAINT board_members_room_user_unique UNIQUE(room_id,user_id));
CREATE INDEX board_members_user_idx ON board_members(user_id);
CREATE TABLE board_invitations (id VARCHAR(36) PRIMARY KEY, room_id VARCHAR(36) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE, token_hash VARCHAR(64) NOT NULL UNIQUE, created_by VARCHAR(36) NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
