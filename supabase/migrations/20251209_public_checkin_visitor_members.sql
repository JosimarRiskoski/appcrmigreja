CREATE OR REPLACE FUNCTION public_checkin_visitor_members(p_event_id uuid, p_full_name text, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_phone TEXT;
  v_member RECORD;
BEGIN
  PERFORM set_config('search_path','public', true);
  SELECT e.* INTO v_event FROM events e WHERE e.id = p_event_id;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;

  v_phone := regexp_replace(COALESCE(p_phone,''),'[^0-9]','','g');
  IF length(v_phone) < 8 THEN RAISE EXCEPTION 'invalid_phone'; END IF;

  SELECT m.* INTO v_member
  FROM members m
  WHERE m.church_id = v_event.church_id
    AND regexp_replace(COALESCE(m.phone,''),'[^0-9]','','g') = v_phone
  LIMIT 1;

  IF v_member.id IS NULL THEN
    INSERT INTO members(church_id, full_name, phone, status, member_since, notes)
    VALUES (v_event.church_id, COALESCE(p_full_name,''), v_phone, 'visitante', NULL, 'QR Code | Check-in | first_visit=' || CURRENT_DATE::text);

    SELECT m.* INTO v_member
    FROM members m
    WHERE m.church_id = v_event.church_id
      AND regexp_replace(COALESCE(m.phone,''),'[^0-9]','','g') = v_phone
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  INSERT INTO event_attendance(event_id, member_id, visitor_name, visitor_phone)
  VALUES (v_event.id, NULL, COALESCE(p_full_name,''), v_phone);
END;
$$;

GRANT EXECUTE ON FUNCTION public_checkin_visitor_members(uuid, text, text) TO anon;
