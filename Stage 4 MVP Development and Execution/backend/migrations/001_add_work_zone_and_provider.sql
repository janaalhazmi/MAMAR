ALTER TABLE projects
ADD COLUMN IF NOT EXISTS work_zone JSONB;

ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS provider_id INTEGER
REFERENCES providers(provider_id);

CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id
ON service_requests(provider_id);
