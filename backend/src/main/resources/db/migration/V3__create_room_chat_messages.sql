CREATE TABLE room_chat_messages (
    message_id VARCHAR(36) PRIMARY KEY,
    room_id VARCHAR(36) NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
    content VARCHAR(2000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_chat_messages_room_created
    ON room_chat_messages (room_id, created_at DESC, message_id DESC);
