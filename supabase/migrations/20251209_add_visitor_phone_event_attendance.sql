-- Add visitor_phone to event_attendance to store phone for visitor check-ins
ALTER TABLE event_attendance ADD COLUMN IF NOT EXISTS visitor_phone TEXT;

-- Optional: no index needed now; UI uses filtering by event_id only

