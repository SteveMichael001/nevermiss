-- Add service address column to calls table
-- Captured by Sarah (AI agent) during each call

ALTER TABLE calls ADD COLUMN IF NOT EXISTS service_address TEXT;
COMMENT ON COLUMN calls.service_address IS 'Property address where service is needed, captured by AI agent during call';
