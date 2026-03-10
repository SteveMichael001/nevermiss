ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dial_timeout_seconds INTEGER DEFAULT 20;

COMMENT ON COLUMN businesses.dial_timeout_seconds IS 'Seconds to ring contractor phone before AI answers. 0 = AI always answers immediately.';
