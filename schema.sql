
-- Enums
CREATE TYPE public.ticket_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'checked_in',
    'checked_out',
    'expired'
);

CREATE TYPE public.field_type AS ENUM (
    'text',
    'number',
    'date',
    'boolean',
    'multiple-choice',
    'checkboxes',
    'dropdown'
);

-- Profiles Table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    first_name text,
    last_name text,
    avatar_url text,
    is_guest boolean DEFAULT false,
    email text,
    phone text
);

ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT auth.uid();
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Events Table
CREATE TABLE public.events (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text NOT NULL,
    description text,
    welcome_message text,
    date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    location text,
    cover_image text,
    ticket_brand_logo text,
    ticket_brand_color text,
    organizer_id uuid,
    capacity integer,
    is_paid boolean DEFAULT false NOT NULL,
    price double precision,
    is_public boolean DEFAULT true,
    requires_approval boolean DEFAULT false,
    ticket_background_image text,
    status text DEFAULT 'draft'::text,
    payout_completed boolean DEFAULT false,
    fee_bearer text DEFAULT 'buyer'::text
);

CREATE SEQUENCE public.events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;
ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);
ALTER TABLE public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE public.events ADD CONSTRAINT events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.profiles(id);

-- Tickets Table
CREATE TABLE public.tickets (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    qr_token uuid,
    checked_in boolean DEFAULT false,
    checked_out boolean DEFAULT false,
    status public.ticket_status DEFAULT 'pending'::public.ticket_status NOT NULL,
    checked_in_at timestamp with time zone,
    checked_out_at timestamp with time zone,
    ticket_price double precision,
    monime_checkout_session_id text,
    monime_payment_status text,
    fee_bearer text
);

CREATE SEQUENCE public.tickets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.tickets_id_seq OWNED BY public.tickets.id;
ALTER TABLE ONLY public.tickets ALTER COLUMN id SET DEFAULT nextval('public.tickets_id_seq'::regclass);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);
ALTER TABLE public.tickets ADD CONSTRAINT tickets_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.tickets ADD CONSTRAINT tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Event Scanners Table
CREATE TABLE public.event_scanners (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    user_id uuid NOT NULL
);

CREATE SEQUENCE public.event_scanners_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.event_scanners_id_seq OWNED BY public.event_scanners.id;
ALTER TABLE ONLY public.event_scanners ALTER COLUMN id SET DEFAULT nextval('public.event_scanners_id_seq'::regclass);
ALTER TABLE public.event_scanners ADD CONSTRAINT event_scanners_pkey PRIMARY KEY (id);
ALTER TABLE public.event_scanners ADD CONSTRAINT event_scanners_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.event_scanners ADD CONSTRAINT event_scanners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Event Form Fields Table
CREATE TABLE public.event_form_fields (
    id bigint NOT NULL,
    event_id bigint NOT NULL,
    field_name text NOT NULL,
    field_type public.field_type NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    "order" integer
);

CREATE SEQUENCE public.event_form_fields_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.event_form_fields_id_seq OWNED BY public.event_form_fields.id;
ALTER TABLE ONLY public.event_form_fields ALTER COLUMN id SET DEFAULT nextval('public.event_form_fields_id_seq'::regclass);
ALTER TABLE public.event_form_fields ADD CONSTRAINT event_form_fields_pkey PRIMARY KEY (id);
ALTER TABLE public.event_form_fields ADD CONSTRAINT event_form_fields_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Event Form Field Options Table
CREATE TABLE public.event_form_field_options (
    id bigint NOT NULL,
    form_field_id bigint NOT NULL,
    value text NOT NULL
);

CREATE SEQUENCE public.event_form_field_options_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.event_form_field_options_id_seq OWNED BY public.event_form_field_options.id;
ALTER TABLE ONLY public.event_form_field_options ALTER COLUMN id SET DEFAULT nextval('public.event_form_field_options_id_seq'::regclass);
ALTER TABLE public.event_form_field_options ADD CONSTRAINT event_form_field_options_pkey PRIMARY KEY (id);
ALTER TABLE public.event_form_field_options ADD CONSTRAINT event_form_field_options_form_field_id_fkey FOREIGN KEY (form_field_id) REFERENCES public.event_form_fields(id) ON DELETE CASCADE;

-- Attendee Form Responses Table
CREATE TABLE public.attendee_form_responses (
    id bigint NOT NULL,
    ticket_id bigint NOT NULL,
    form_field_id bigint NOT NULL,
    field_value text NOT NULL
);

CREATE SEQUENCE public.attendee_form_responses_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.attendee_form_responses_id_seq OWNED BY public.attendee_form_responses.id;
ALTER TABLE ONLY public.attendee_form_responses ALTER COLUMN id SET DEFAULT nextval('public.attendee_form_responses_id_seq'::regclass);
ALTER TABLE public.attendee_form_responses ADD CONSTRAINT attendee_form_responses_pkey PRIMARY KEY (id);
ALTER TABLE public.attendee_form_responses ADD CONSTRAINT attendee_form_responses_form_field_id_fkey FOREIGN KEY (form_field_id) REFERENCES public.event_form_fields(id) ON DELETE CASCADE;
ALTER TABLE public.attendee_form_responses ADD CONSTRAINT attendee_form_responses_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;

-- Payouts Table
CREATE TABLE public.payouts (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    event_id bigint NOT NULL,
    organizer_id uuid NOT NULL,
    total_tickets_sold integer,
    gross_amount double precision,
    platform_fees double precision,
    monime_fees double precision,
    net_payout double precision,
    monime_payout_id text,
    recipient_phone text,
    monime_payout_status text
);
CREATE SEQUENCE public.payouts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE public.payouts ALTER COLUMN id SET DEFAULT nextval('public.payouts_id_seq'::regclass);
ALTER TABLE public.payouts ADD CONSTRAINT payouts_pkey PRIMARY KEY (id);
ALTER TABLE public.payouts ADD CONSTRAINT payouts_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE public.payouts ADD CONSTRAINT payouts_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events are viewable by everyone." ON public.events FOR SELECT USING (true);
CREATE POLICY "Organizers can create events." ON public.events FOR INSERT WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "Organizers can update their own events." ON public.events FOR UPDATE USING (auth.uid() = organizer_id);
CREATE POLICY "Organizers can delete their own events." ON public.events FOR DELETE USING (auth.uid() = organizer_id);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own tickets." ON public.tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own tickets." ON public.tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Organizers can view tickets for their events." ON public.tickets FOR SELECT USING (
  (SELECT organizer_id FROM public.events WHERE id = tickets.event_id) = auth.uid()
);

ALTER TABLE public.event_scanners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Organizers can manage scanners for their events." ON public.event_scanners FOR ALL USING (
  (SELECT organizer_id FROM public.events WHERE id = event_scanners.event_id) = auth.uid()
);
CREATE POLICY "Scanners can view their assigned events." ON public.event_scanners FOR SELECT USING (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION public.get_attendees_for_event(event_id_param integer)
RETURNS TABLE(ticket_id bigint, checked_in boolean, checked_out boolean, status public.ticket_status, first_name text, last_name text, email text, avatar_url text, form_responses json)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ((SELECT organizer_id FROM public.events WHERE id = event_id_param) = auth.uid()) THEN
    RETURN QUERY
    SELECT
        t.id AS ticket_id,
        t.checked_in,
        t.checked_out,
        t.status,
        p.first_name,
        p.last_name,
        p.email,
        p.avatar_url,
        (
            SELECT json_agg(json_build_object('field_name', f.field_name, 'field_value', r.field_value))
            FROM attendee_form_responses r
            JOIN event_form_fields f ON r.form_field_id = f.id
            WHERE r.ticket_id = t.id
        ) AS form_responses
    FROM
        public.tickets t
    JOIN
        public.profiles p ON t.user_id = p.id
    WHERE
        t.event_id = event_id_param;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.count_users()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM auth.users);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_event_attendee_counts(event_ids integer[])
RETURNS TABLE(event_id_out integer, attendee_count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    count(t.id)
  FROM
    public.events e
  LEFT JOIN
    public.tickets t ON e.id = t.event_id
  WHERE
    e.id = ANY(event_ids)
  GROUP BY
    e.id;
END;
$$;

-- Storage Policies
CREATE POLICY "Event cover images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-covers' );

CREATE POLICY "Anyone can upload an event cover."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'event-covers' );

CREATE POLICY "Anyone can update their own event cover."
ON storage.objects FOR UPDATE
TO authenticated
USING ( auth.uid() = owner );

CREATE POLICY "Event images are publicly accessible."
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-images' );

CREATE POLICY "Anyone can upload an event image."
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'event-images' );
