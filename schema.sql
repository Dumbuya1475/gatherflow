
-- Enums
CREATE TYPE public.ticket_status AS ENUM ('pending', 'approved', 'rejected', 'expired');
CREATE TYPE public.field_type AS ENUM ('text', 'number', 'date', 'boolean', 'multiple-choice', 'checkboxes', 'dropdown');
CREATE TYPE public.payment_status AS ENUM ('paid', 'unpaid', 'refunded');

-- Profiles Table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    updated_at timestamp with time zone,
    first_name text,
    last_name text,
    avatar_url text,
    is_guest boolean DEFAULT false NOT NULL,
    email text,
    phone text
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Events Table
CREATE TABLE public.events (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    title text,
    description text,
    welcome_message text,
    date timestamp with time zone,
    end_date timestamp with time zone,
    location text,
    cover_image text,
    ticket_brand_logo text,
    ticket_brand_color text,
    organizer_id uuid,
    capacity integer,
    is_paid boolean,
    price numeric,
    is_public boolean DEFAULT true,
    requires_approval boolean,
    ticket_background_image text,
    status text DEFAULT 'draft'::text,
    payout_completed boolean DEFAULT false,
    event_date date,
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
ALTER TABLE public