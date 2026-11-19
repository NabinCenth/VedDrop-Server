CREATE TABLE VedDrop (
    file_id         UUID                     PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name       VARCHAR(255)             NOT NULL,
    file_size       BIGINT                   NOT NULL,
    pin_hash        TEXT                     NOT NULL,
    status          TEXT                     NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    download_count  INTEGER                  NOT NULL DEFAULT 0,
    failed_attempts INTEGER                  NOT NULL DEFAULT 0,
    file_type       TEXT                     NOT NULL DEFAULT 'application/octet-stream'
    storage_key     TEXT                     NOT NULL UNIQUE
);