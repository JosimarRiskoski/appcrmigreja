CREATE OR REPLACE FUNCTION public_checkin_member(p_event_id uuid, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_member RECORD;
  v_phone TEXT;
BEGIN
  SELECT e.* INTO v_event FROM events e WHERE e.id = p_event_id;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;
  v_phone := regexp_replace(COALESCE(p_phone,''),'[^0-9]','','g');
  IF length(v_phone) < 8 THEN RAISE EXCEPTION 'invalid_phone'; END IF;
  SELECT m.* INTO v_member FROM members m WHERE m.church_id = v_event.church_id AND regexp_replace(COALESCE(m.phone,''),'[^0-9]','','g') = v_phone LIMIT 1;
  IF v_member.id IS NULL THEN RAISE EXCEPTION 'member_not_found'; END IF;
  INSERT INTO event_attendance(event_id, member_id, visitor_name, visitor_phone, checked_in_at)
  VALUES (v_event.id, v_member.id, NULL, NULL, NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION public_checkin_member(uuid, text) TO anon;

CREATE OR REPLACE FUNCTION public_checkin_visitor(p_event_id uuid, p_full_name text, p_phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_phone TEXT;
  v_existing RECORD;
BEGIN
  SELECT e.* INTO v_event FROM events e WHERE e.id = p_event_id;
  IF v_event.id IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;
  v_phone := regexp_replace(COALESCE(p_phone,''),'[^0-9]','','g');
  IF length(v_phone) < 8 THEN RAISE EXCEPTION 'invalid_phone'; END IF;
  SELECT v.* INTO v_existing FROM visitors v WHERE v.church_id = v_event.church_id AND regexp_replace(COALESCE(v.phone,''),'[^0-9]','','g') = v_phone LIMIT 1;
  IF v_existing.id IS NULL THEN
    INSERT INTO visitors(church_id, full_name, phone, first_visit_date, notes, tag, status, history)
    VALUES (v_event.church_id, COALESCE(p_full_name,''), v_phone, CURRENT_DATE, NULL, 'QR Code | Check-in', 'primeira_visita', jsonb_build_array(jsonb_build_object('timestamp', NOW(), 'from','-', 'to','primeira_visita', 'user','—', 'action','criado', 'event_id', v_event.id)));
  END IF;
  INSERT INTO event_attendance(event_id, member_id, visitor_name, visitor_phone, checked_in_at)
  VALUES (v_event.id, NULL, COALESCE(p_full_name,''), v_phone, NOW());
END;
$$;

GRANT EXECUTE ON FUNCTION public_checkin_visitor(uuid, text, text) TO anon;
