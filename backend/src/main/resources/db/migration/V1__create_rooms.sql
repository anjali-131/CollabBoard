CREATE TABLE rooms (room_id VARCHAR(36) PRIMARY KEY, title VARCHAR(120) NOT NULL, board_state JSONB NOT NULL DEFAULT '[]'::jsonb, version BIGINT NOT NULL DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX rooms_updated_at_idx ON rooms(updated_at);
