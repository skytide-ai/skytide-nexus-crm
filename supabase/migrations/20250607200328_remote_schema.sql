

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'superadmin',
    'admin',
    'member'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."clean_expired_invitations"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  UPDATE public.member_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' AND expires_at < now();
$$;


ALTER FUNCTION "public"."clean_expired_invitations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_organization"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_organization"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_user_role"() RETURNS "public"."app_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_current_user_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_phone_config"("org_id" "uuid", "phone_num" "text", "contact_id" "uuid" DEFAULT NULL::"uuid", "bot_enabled_val" boolean DEFAULT NULL::boolean) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  config_id UUID;
BEGIN
  -- Intentar obtener la configuración existente
  SELECT id INTO config_id
  FROM public.whatsapp_phone_config
  WHERE organization_id = org_id AND phone_number = phone_num;
  
  -- Si no existe, crear una nueva configuración
  IF config_id IS NULL THEN
    INSERT INTO public.whatsapp_phone_config (
      organization_id,
      phone_number,
      contact_id,
      bot_enabled
    ) VALUES (
      org_id,
      phone_num,
      contact_id,
      bot_enabled_val
    )
    RETURNING id INTO config_id;
  END IF;
  
  RETURN config_id;
END;
$$;


ALTER FUNCTION "public"."get_or_create_phone_config"("org_id" "uuid", "phone_num" "text", "contact_id" "uuid", "bot_enabled_val" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_contacts"("org_id" "uuid") RETURNS TABLE("id" "uuid", "contact_name" "text", "email" "text", "phone" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
    c.email,
    c.phone,
    c.created_at,
    c.updated_at
  FROM 
    contacts c
  WHERE 
    c.organization_id = org_id
  ORDER BY 
    contact_name;
END;
$$;


ALTER FUNCTION "public"."get_organization_contacts"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_whatsapp_chats"("org_id" "uuid") RETURNS TABLE("phone_number" "text", "last_message" "text", "last_message_at" timestamp with time zone, "unread_count" bigint, "contact_id" "uuid", "contact_name" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT 
      wm.phone_number,
      wm.message AS last_message,
      wm.timestamp AS last_message_at,
      COUNT(*) FILTER (WHERE NOT wm.is_from_admin) AS unread_count,
      wpc.contact_id,
      CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
      ROW_NUMBER() OVER (PARTITION BY wm.phone_number ORDER BY wm.timestamp DESC) AS rn
    FROM 
      whatsapp_messages wm
      LEFT JOIN whatsapp_phone_config wpc ON wm.phone_number = wpc.phone_number AND wm.organization_id = wpc.organization_id
      LEFT JOIN contacts c ON wpc.contact_id = c.id
    WHERE 
      wm.organization_id = org_id
    GROUP BY 
      wm.phone_number, wm.message, wm.timestamp, wpc.contact_id, c.first_name, c.last_name
  )
  SELECT 
    lm.phone_number,
    lm.last_message,
    lm.last_message_at,
    lm.unread_count,
    lm.contact_id,
    lm.contact_name
  FROM 
    latest_messages lm
  WHERE 
    lm.rn = 1
  ORDER BY 
    lm.last_message_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_whatsapp_chats"("org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Si el usuario fue invitado, usar los datos de la invitación
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    -- Usuario invitado - usar organización de la invitación
    INSERT INTO public.profiles (id, email, first_name, last_name, organization_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      (NEW.raw_user_meta_data->>'organization_id')::UUID,
      'member'
    );
  ELSIF NEW.raw_user_meta_data->>'organization_name' IS NOT NULL THEN
    -- Admin creando nueva organización
    INSERT INTO public.organizations (name)
    VALUES (NEW.raw_user_meta_data->>'organization_name')
    RETURNING id INTO org_id;
    
    INSERT INTO public.profiles (id, email, first_name, last_name, organization_id, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      org_id,
      'admin'
    );
  ELSE
    -- Usuario sin organización (para casos especiales)
    INSERT INTO public.profiles (id, email, first_name, last_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      'member'
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "service_id" "uuid",
    "member_id" "uuid",
    "appointment_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "status" "text" DEFAULT 'programada'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['programada'::"text", 'confirmada'::"text", 'en_curso'::"text", 'completada'::"text", 'cancelada'::"text", 'no_asistio'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "mime_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."contact_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "contact_id" "uuid" NOT NULL,
    "note" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."contact_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "country_code" "text" DEFAULT '+57'::"text" NOT NULL,
    "email" "text",
    "age" integer,
    "gender" "text",
    "birth_date" "date",
    "address" "text",
    "city" "text",
    "document_type" "text" DEFAULT 'CC'::"text",
    "document_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "contacts_document_type_check" CHECK (("document_type" = ANY (ARRAY['CC'::"text", 'NIT'::"text"]))),
    CONSTRAINT "contacts_gender_check" CHECK (("gender" = ANY (ARRAY['masculino'::"text", 'femenino'::"text", 'otro'::"text", 'prefiero_no_decir'::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer NOT NULL,
    "price_cop" numeric(10,2) NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "services_duration_minutes_check" CHECK (("duration_minutes" > 0)),
    CONSTRAINT "services_price_cop_check" CHECK (("price_cop" >= (0)::numeric))
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_metrics" WITH ("security_invoker"='on') AS
 WITH "monthly_stats" AS (
         SELECT "date_trunc"('month'::"text", "now"()) AS "current_month",
            ("date_trunc"('month'::"text", "now"()) - '1 mon'::interval) AS "previous_month"
        ), "appointments_count" AS (
         SELECT "count"(*) FILTER (WHERE ("appointments"."appointment_date" >= (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date")) AS "current_month_appointments",
            "count"(*) FILTER (WHERE (("appointments"."appointment_date" >= (( SELECT "monthly_stats"."previous_month"
                   FROM "monthly_stats"))::"date") AND ("appointments"."appointment_date" < (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date"))) AS "previous_month_appointments",
            "count"(DISTINCT "appointments"."contact_id") FILTER (WHERE ("appointments"."appointment_date" >= (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date")) AS "current_month_clients",
            "count"(DISTINCT "appointments"."contact_id") FILTER (WHERE (("appointments"."appointment_date" >= (( SELECT "monthly_stats"."previous_month"
                   FROM "monthly_stats"))::"date") AND ("appointments"."appointment_date" < (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date"))) AS "previous_month_clients"
           FROM "public"."appointments"
        ), "revenue" AS (
         SELECT COALESCE("sum"("s"."price_cop") FILTER (WHERE ("a_1"."appointment_date" >= (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date")), (0)::numeric) AS "current_month_revenue",
            COALESCE("sum"("s"."price_cop") FILTER (WHERE (("a_1"."appointment_date" >= (( SELECT "monthly_stats"."previous_month"
                   FROM "monthly_stats"))::"date") AND ("a_1"."appointment_date" < (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date"))), (0)::numeric) AS "previous_month_revenue"
           FROM ("public"."appointments" "a_1"
             JOIN "public"."services" "s" ON (("a_1"."service_id" = "s"."id")))
          WHERE ("a_1"."status" = 'completed'::"text")
        ), "conversion_rate" AS (
         SELECT "round"((((NULLIF("count"(*) FILTER (WHERE (("appointments"."status" = 'completed'::"text") AND ("appointments"."appointment_date" >= (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date"))), 0))::numeric / (NULLIF("count"(*) FILTER (WHERE ("appointments"."appointment_date" >= (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date")), 0))::numeric) * (100)::numeric), 1) AS "current_month_rate",
            "round"((((NULLIF("count"(*) FILTER (WHERE (("appointments"."status" = 'completed'::"text") AND ("appointments"."appointment_date" >= (( SELECT "monthly_stats"."previous_month"
                   FROM "monthly_stats"))::"date") AND ("appointments"."appointment_date" < (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date"))), 0))::numeric / (NULLIF("count"(*) FILTER (WHERE (("appointments"."appointment_date" >= (( SELECT "monthly_stats"."previous_month"
                   FROM "monthly_stats"))::"date") AND ("appointments"."appointment_date" < (( SELECT "monthly_stats"."current_month"
                   FROM "monthly_stats"))::"date"))), 0))::numeric) * (100)::numeric), 1) AS "previous_month_rate"
           FROM "public"."appointments"
        )
 SELECT "a"."current_month_clients" AS "new_clients",
    "round"((((("a"."current_month_clients" - "a"."previous_month_clients"))::numeric / (NULLIF("a"."previous_month_clients", 0))::numeric) * (100)::numeric), 1) AS "new_clients_growth",
    "a"."current_month_appointments" AS "total_appointments",
    "round"((((("a"."current_month_appointments" - "a"."previous_month_appointments"))::numeric / (NULLIF("a"."previous_month_appointments", 0))::numeric) * (100)::numeric), 1) AS "appointments_growth",
    "r"."current_month_revenue" AS "total_revenue",
    "round"(((("r"."current_month_revenue" - "r"."previous_month_revenue") / NULLIF("r"."previous_month_revenue", (0)::numeric)) * (100)::numeric), 1) AS "revenue_growth",
    "cv"."current_month_rate" AS "conversion_rate",
    ("cv"."current_month_rate" - "cv"."previous_month_rate") AS "conversion_rate_change"
   FROM (("appointments_count" "a"
     CROSS JOIN "revenue" "r")
     CROSS JOIN "conversion_rate" "cv");


ALTER TABLE "public"."dashboard_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "break_start_time" time without time zone,
    "break_end_time" time without time zone,
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "member_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."member_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "role" "public"."app_role" DEFAULT 'member'::"public"."app_role" NOT NULL,
    "token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_by" "uuid" NOT NULL,
    "invited_by_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL,
    "accepted_at" timestamp with time zone,
    CONSTRAINT "member_invitations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."member_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."member_special_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "member_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "break_start_time" time without time zone,
    "break_end_time" time without time zone,
    "is_available" boolean DEFAULT false NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."member_special_dates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."monthly_statistics" WITH ("security_invoker"='on') AS
 WITH RECURSIVE "months" AS (
         SELECT "date_trunc"('month'::"text", (CURRENT_DATE - '5 mons'::interval)) AS "month"
        UNION ALL
         SELECT "date_trunc"('month'::"text", ("months"."month" + '1 mon'::interval)) AS "date_trunc"
           FROM "months"
          WHERE ("months"."month" < "date_trunc"('month'::"text", (CURRENT_DATE)::timestamp with time zone))
        )
 SELECT "to_char"("m"."month", 'Mon'::"text") AS "name",
    "count"("a"."id") AS "citas",
    COALESCE("sum"("s"."price_cop"), (0)::numeric) AS "facturacion"
   FROM (("months" "m"
     LEFT JOIN "public"."appointments" "a" ON (("date_trunc"('month'::"text", ("a"."appointment_date")::timestamp with time zone) = "m"."month")))
     LEFT JOIN "public"."services" "s" ON (("a"."service_id" = "s"."id")))
  GROUP BY "m"."month"
  ORDER BY "m"."month";


ALTER TABLE "public"."monthly_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "break_start_time" time without time zone,
    "break_end_time" time without time zone,
    "is_available" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL,
    CONSTRAINT "organization_availability_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."organization_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organization_special_dates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "break_start_time" time without time zone,
    "break_end_time" time without time zone,
    "is_available" boolean DEFAULT false NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid" NOT NULL
);


ALTER TABLE "public"."organization_special_dates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "organization_id" "uuid",
    "role" "public"."app_role" DEFAULT 'member'::"public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "avatar_url" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "service_id" "uuid" NOT NULL,
    "member_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "uuid" NOT NULL
);


ALTER TABLE "public"."service_assignments" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."top_services" WITH ("security_invoker"='on') AS
 SELECT "s"."name",
    "count"("a"."id") AS "citas",
    COALESCE("sum"("s"."price_cop"), (0)::numeric) AS "facturacion"
   FROM ("public"."services" "s"
     LEFT JOIN "public"."appointments" "a" ON (("s"."id" = "a"."service_id")))
  WHERE ("a"."appointment_date" >= "date_trunc"('month'::"text", (CURRENT_DATE - '1 mon'::interval)))
  GROUP BY "s"."id", "s"."name"
  ORDER BY ("count"("a"."id")) DESC
 LIMIT 5;


ALTER TABLE "public"."top_services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_config" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "webhook_url" "text",
    "bot_enabled" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."whatsapp_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "phone_number" "text" NOT NULL,
    "message" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_from_admin" boolean DEFAULT false NOT NULL,
    "is_from_bot" boolean DEFAULT false NOT NULL,
    "media_url" "text",
    "media_type" "text",
    "contact_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."whatsapp_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_phone_config" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "phone_number" "text" NOT NULL,
    "contact_id" "uuid",
    "bot_enabled" boolean,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."whatsapp_phone_config" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_files"
    ADD CONSTRAINT "contact_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_availability"
    ADD CONSTRAINT "member_availability_member_id_day_of_week_start_time_end_ti_key" UNIQUE ("member_id", "day_of_week", "start_time", "end_time");



ALTER TABLE ONLY "public"."member_availability"
    ADD CONSTRAINT "member_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_invitations"
    ADD CONSTRAINT "member_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."member_invitations"
    ADD CONSTRAINT "member_invitations_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."member_special_dates"
    ADD CONSTRAINT "member_special_dates_member_id_date_start_time_end_time_key" UNIQUE ("member_id", "date", "start_time", "end_time");



ALTER TABLE ONLY "public"."member_special_dates"
    ADD CONSTRAINT "member_special_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_availability"
    ADD CONSTRAINT "organization_availability_organization_id_day_of_week_start_key" UNIQUE ("organization_id", "day_of_week", "start_time", "end_time");



ALTER TABLE ONLY "public"."organization_availability"
    ADD CONSTRAINT "organization_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_special_dates"
    ADD CONSTRAINT "organization_special_dates_organization_id_date_start_time__key" UNIQUE ("organization_id", "date", "start_time", "end_time");



ALTER TABLE ONLY "public"."organization_special_dates"
    ADD CONSTRAINT "organization_special_dates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_assignments"
    ADD CONSTRAINT "service_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."service_assignments"
    ADD CONSTRAINT "service_assignments_service_id_member_id_key" UNIQUE ("service_id", "member_id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_config"
    ADD CONSTRAINT "whatsapp_config_organization_unique" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."whatsapp_config"
    ADD CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_phone_config"
    ADD CONSTRAINT "whatsapp_phone_config_org_phone_unique" UNIQUE ("organization_id", "phone_number");



ALTER TABLE ONLY "public"."whatsapp_phone_config"
    ADD CONSTRAINT "whatsapp_phone_config_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_appointments_contact_id" ON "public"."appointments" USING "btree" ("contact_id");



CREATE INDEX "idx_appointments_date" ON "public"."appointments" USING "btree" ("appointment_date");



CREATE INDEX "idx_appointments_organization_id" ON "public"."appointments" USING "btree" ("organization_id");



CREATE INDEX "idx_contact_files_contact_id" ON "public"."contact_files" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_notes_contact_id" ON "public"."contact_notes" USING "btree" ("contact_id");



CREATE INDEX "idx_contacts_organization_id" ON "public"."contacts" USING "btree" ("organization_id");



CREATE INDEX "idx_contacts_phone" ON "public"."contacts" USING "btree" ("phone");



CREATE INDEX "idx_member_availability_member_day" ON "public"."member_availability" USING "btree" ("member_id", "day_of_week");



CREATE INDEX "idx_member_invitations_email" ON "public"."member_invitations" USING "btree" ("email");



CREATE INDEX "idx_member_invitations_status" ON "public"."member_invitations" USING "btree" ("status");



CREATE INDEX "idx_member_invitations_token" ON "public"."member_invitations" USING "btree" ("token");



CREATE INDEX "idx_member_special_dates_member_date" ON "public"."member_special_dates" USING "btree" ("member_id", "date");



CREATE INDEX "idx_organization_availability_org_day" ON "public"."organization_availability" USING "btree" ("organization_id", "day_of_week");



CREATE INDEX "idx_organization_special_dates_org_date" ON "public"."organization_special_dates" USING "btree" ("organization_id", "date");



CREATE INDEX "idx_service_assignments_member_id" ON "public"."service_assignments" USING "btree" ("member_id");



CREATE INDEX "idx_service_assignments_service_id" ON "public"."service_assignments" USING "btree" ("service_id");



CREATE INDEX "idx_services_organization_id" ON "public"."services" USING "btree" ("organization_id");



CREATE INDEX "whatsapp_messages_organization_id_idx" ON "public"."whatsapp_messages" USING "btree" ("organization_id");



CREATE INDEX "whatsapp_messages_phone_number_idx" ON "public"."whatsapp_messages" USING "btree" ("phone_number");



CREATE INDEX "whatsapp_messages_timestamp_idx" ON "public"."whatsapp_messages" USING "btree" ("timestamp");



CREATE INDEX "whatsapp_phone_config_organization_id_idx" ON "public"."whatsapp_phone_config" USING "btree" ("organization_id");



CREATE INDEX "whatsapp_phone_config_phone_number_idx" ON "public"."whatsapp_phone_config" USING "btree" ("phone_number");



CREATE OR REPLACE TRIGGER "set_whatsapp_config_updated_at" BEFORE UPDATE ON "public"."whatsapp_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "set_whatsapp_phone_config_updated_at" BEFORE UPDATE ON "public"."whatsapp_phone_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id");



ALTER TABLE ONLY "public"."contact_files"
    ADD CONSTRAINT "contact_files_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_files"
    ADD CONSTRAINT "contact_files_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_availability"
    ADD CONSTRAINT "member_availability_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."member_availability"
    ADD CONSTRAINT "member_availability_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_availability"
    ADD CONSTRAINT "member_availability_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."member_invitations"
    ADD CONSTRAINT "member_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_invitations"
    ADD CONSTRAINT "member_invitations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_special_dates"
    ADD CONSTRAINT "member_special_dates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."member_special_dates"
    ADD CONSTRAINT "member_special_dates_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."member_special_dates"
    ADD CONSTRAINT "member_special_dates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."organization_availability"
    ADD CONSTRAINT "organization_availability_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."organization_availability"
    ADD CONSTRAINT "organization_availability_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organization_special_dates"
    ADD CONSTRAINT "organization_special_dates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."organization_special_dates"
    ADD CONSTRAINT "organization_special_dates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_assignments"
    ADD CONSTRAINT "service_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."service_assignments"
    ADD CONSTRAINT "service_assignments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."service_assignments"
    ADD CONSTRAINT "service_assignments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_config"
    ADD CONSTRAINT "whatsapp_config_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."whatsapp_messages"
    ADD CONSTRAINT "whatsapp_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."whatsapp_phone_config"
    ADD CONSTRAINT "whatsapp_phone_config_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."whatsapp_phone_config"
    ADD CONSTRAINT "whatsapp_phone_config_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create invitations" ON "public"."member_invitations" FOR INSERT WITH CHECK ((("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"])) AND ("organization_id" = "public"."get_current_user_organization"())));



CREATE POLICY "Admins can create service assignments" ON "public"."service_assignments" FOR INSERT WITH CHECK ((("service_id" IN ( SELECT "services"."id"
   FROM "public"."services"
  WHERE ("services"."organization_id" = ( SELECT "profiles"."organization_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can create services" ON "public"."services" FOR INSERT WITH CHECK ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can delete invitations from their organization" ON "public"."member_invitations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "admin_profile"
  WHERE (("admin_profile"."id" = "auth"."uid"()) AND ("admin_profile"."role" = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"])) AND ("admin_profile"."organization_id" = "member_invitations"."organization_id")))));



CREATE POLICY "Admins can delete members from their organization" ON "public"."profiles" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "admin_profile"
  WHERE (("admin_profile"."id" = "auth"."uid"()) AND ("admin_profile"."role" = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"])) AND ("admin_profile"."organization_id" = "profiles"."organization_id")))));



CREATE POLICY "Admins can delete service assignments" ON "public"."service_assignments" FOR DELETE USING ((("service_id" IN ( SELECT "services"."id"
   FROM "public"."services"
  WHERE ("services"."organization_id" = ( SELECT "profiles"."organization_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can delete services" ON "public"."services" FOR DELETE USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can insert member profiles in their organization" ON "public"."profiles" FOR INSERT WITH CHECK ((("organization_id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("role" = 'member'::"public"."app_role")));



CREATE POLICY "Admins can insert whatsapp_config" ON "public"."whatsapp_config" FOR INSERT WITH CHECK (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can insert whatsapp_messages" ON "public"."whatsapp_messages" FOR INSERT WITH CHECK (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can insert whatsapp_phone_config" ON "public"."whatsapp_phone_config" FOR INSERT WITH CHECK (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can manage all member availability" ON "public"."member_availability" USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can manage all member special dates" ON "public"."member_special_dates" USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can manage organization availability" ON "public"."organization_availability" USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can manage organization special dates" ON "public"."organization_special_dates" USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can update invitations from their organization" ON "public"."member_invitations" FOR UPDATE USING ((("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"])) AND ("organization_id" = "public"."get_current_user_organization"())));



CREATE POLICY "Admins can update member profiles in their organization" ON "public"."profiles" FOR UPDATE USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("role" = 'member'::"public"."app_role")));



CREATE POLICY "Admins can update organization profiles" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR (("public"."get_current_user_role"() = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"])) AND ("organization_id" = "public"."get_current_user_organization"()))));



CREATE POLICY "Admins can update services" ON "public"."services" FOR UPDATE USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"public"."app_role", 'superadmin'::"public"."app_role"]))));



CREATE POLICY "Admins can update their organization" ON "public"."organizations" FOR UPDATE USING ((("id" = "public"."get_current_user_organization"()) AND ("public"."get_current_user_role"() = 'admin'::"public"."app_role")));



CREATE POLICY "Admins can update whatsapp_config" ON "public"."whatsapp_config" FOR UPDATE USING (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can update whatsapp_messages" ON "public"."whatsapp_messages" FOR UPDATE USING (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can update whatsapp_phone_config" ON "public"."whatsapp_phone_config" FOR UPDATE USING (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can view whatsapp_config" ON "public"."whatsapp_config" FOR SELECT USING (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can view whatsapp_messages" ON "public"."whatsapp_messages" FOR SELECT USING (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Admins can view whatsapp_phone_config" ON "public"."whatsapp_phone_config" FOR SELECT USING (((("public"."get_current_user_role"() = 'admin'::"public"."app_role") AND ("organization_id" = "public"."get_current_user_organization"())) OR ("public"."get_current_user_role"() = 'superadmin'::"public"."app_role")));



CREATE POLICY "Members can manage their own availability" ON "public"."member_availability" USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("member_id" = "auth"."uid"())));



CREATE POLICY "Members can manage their own special dates" ON "public"."member_special_dates" USING ((("organization_id" = "public"."get_current_user_organization"()) AND ("member_id" = "auth"."uid"())));



CREATE POLICY "Members can view availability in their organization" ON "public"."member_availability" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Members can view special dates in their organization" ON "public"."member_special_dates" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Organization members can view organization availability" ON "public"."organization_availability" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Organization members can view organization special dates" ON "public"."organization_special_dates" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Superadmins can update all organizations" ON "public"."organizations" FOR UPDATE USING (("public"."get_current_user_role"() = 'superadmin'::"public"."app_role"));



CREATE POLICY "Superadmins can update all profiles" ON "public"."profiles" FOR UPDATE USING (("public"."get_current_user_role"() = 'superadmin'::"public"."app_role"));



CREATE POLICY "Superadmins can view all organizations" ON "public"."organizations" FOR SELECT USING (("public"."get_current_user_role"() = 'superadmin'::"public"."app_role"));



CREATE POLICY "Superadmins can view all profiles" ON "public"."profiles" FOR SELECT USING (("public"."get_current_user_role"() = 'superadmin'::"public"."app_role"));



CREATE POLICY "Users can create appointments in their organization" ON "public"."appointments" FOR INSERT WITH CHECK (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can create contact files in their organization" ON "public"."contact_files" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_files"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can create contact notes in their organization" ON "public"."contact_notes" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_notes"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can create contacts in their organization" ON "public"."contacts" FOR INSERT WITH CHECK (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can delete appointments in their organization" ON "public"."appointments" FOR DELETE USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can delete contact files in their organization" ON "public"."contact_files" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_files"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can delete contact notes in their organization" ON "public"."contact_notes" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_notes"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can delete contacts in their organization" ON "public"."contacts" FOR DELETE USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can update appointments in their organization" ON "public"."appointments" FOR UPDATE USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can update contact notes in their organization" ON "public"."contact_notes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_notes"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can update contacts in their organization" ON "public"."contacts" FOR UPDATE USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view appointments from their organization" ON "public"."appointments" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can view contact files from their organization" ON "public"."contact_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_files"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can view contact notes from their organization" ON "public"."contact_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."contacts"
  WHERE (("contacts"."id" = "contact_notes"."contact_id") AND ("contacts"."organization_id" = "public"."get_current_user_organization"())))));



CREATE POLICY "Users can view contacts from their organization" ON "public"."contacts" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can view invitations from their organization" ON "public"."member_invitations" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can view organization profiles" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() = "id") OR (("organization_id" IS NOT NULL) AND ("organization_id" = "public"."get_current_user_organization"()))));



CREATE POLICY "Users can view profiles in their organization" ON "public"."profiles" FOR SELECT USING (("organization_id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can view service assignments from their organization" ON "public"."service_assignments" FOR SELECT USING (("service_id" IN ( SELECT "services"."id"
   FROM "public"."services"
  WHERE ("services"."organization_id" = ( SELECT "profiles"."organization_id"
           FROM "public"."profiles"
          WHERE ("profiles"."id" = "auth"."uid"()))))));



CREATE POLICY "Users can view services from their organization" ON "public"."services" FOR SELECT USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own organization" ON "public"."organizations" FOR SELECT USING (("id" = "public"."get_current_user_organization"()));



CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."appointments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."member_special_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_special_dates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."service_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_phone_config" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."clean_expired_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."clean_expired_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."clean_expired_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_organization"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_organization"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_organization"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_user_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_phone_config"("org_id" "uuid", "phone_num" "text", "contact_id" "uuid", "bot_enabled_val" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_phone_config"("org_id" "uuid", "phone_num" "text", "contact_id" "uuid", "bot_enabled_val" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_phone_config"("org_id" "uuid", "phone_num" "text", "contact_id" "uuid", "bot_enabled_val" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_organization_contacts"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_organization_contacts"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_organization_contacts"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_whatsapp_chats"("org_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_whatsapp_chats"("org_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_whatsapp_chats"("org_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."contact_files" TO "anon";
GRANT ALL ON TABLE "public"."contact_files" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_files" TO "service_role";



GRANT ALL ON TABLE "public"."contact_notes" TO "anon";
GRANT ALL ON TABLE "public"."contact_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_notes" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_metrics" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."member_availability" TO "anon";
GRANT ALL ON TABLE "public"."member_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."member_availability" TO "service_role";



GRANT ALL ON TABLE "public"."member_invitations" TO "anon";
GRANT ALL ON TABLE "public"."member_invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."member_invitations" TO "service_role";



GRANT ALL ON TABLE "public"."member_special_dates" TO "anon";
GRANT ALL ON TABLE "public"."member_special_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."member_special_dates" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_statistics" TO "anon";
GRANT ALL ON TABLE "public"."monthly_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."organization_availability" TO "anon";
GRANT ALL ON TABLE "public"."organization_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_availability" TO "service_role";



GRANT ALL ON TABLE "public"."organization_special_dates" TO "anon";
GRANT ALL ON TABLE "public"."organization_special_dates" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_special_dates" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."service_assignments" TO "anon";
GRANT ALL ON TABLE "public"."service_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."service_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."top_services" TO "anon";
GRANT ALL ON TABLE "public"."top_services" TO "authenticated";
GRANT ALL ON TABLE "public"."top_services" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_config" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_config" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_config" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_messages" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_messages" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_phone_config" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_phone_config" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_phone_config" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
