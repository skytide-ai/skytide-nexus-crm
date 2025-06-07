create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.get_whatsapp_chats(org_id uuid)
returns table (
  phone_number text,
  message text,
  is_from_admin boolean,
  is_from_bot boolean,
  media_url text,
  media_type text,
  timestamp timestamp with time zone
) as $$
begin
  return query
  select
    wm.phone_number,
    wm.message,
    wm.is_from_admin,
    wm.is_from_bot,
    wm.media_url,
    wm.media_type,
    wm.timestamp
  from public.whatsapp_messages wm
  where wm.organization_id = org_id
  order by wm.timestamp desc;
end;
$$ language plpgsql;

create or replace function public.get_or_create_phone_config(org_id uuid, phone text)
returns uuid as $$
declare
  config_id uuid;
begin
  select id into config_id
  from public.whatsapp_phone_config
  where organization_id = org_id and phone_number = phone;

  if config_id is null then
    insert into public.whatsapp_phone_config (organization_id, phone_number)
    values (org_id, phone)
    returning id into config_id;
  end if;

  return config_id;
end;
$$ language plpgsql;

create trigger update_whatsapp_config_updated_at
  before update on public.whatsapp_config
  for each row execute procedure public.update_updated_at_column();

create trigger update_whatsapp_phone_config_updated_at
  before update on public.whatsapp_phone_config
  for each row execute procedure public.update_updated_at_column();

alter table public.whatsapp_config enable row level security;

create policy "Only members of the same organization can read whatsapp_config"
on public.whatsapp_config
for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and organization_id = whatsapp_config.organization_id
  )
);

alter table public.whatsapp_messages enable row level security;

create policy "Only members of the same organization can read whatsapp_messages"
on public.whatsapp_messages
for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and organization_id = whatsapp_messages.organization_id
  )
);

alter table public.whatsapp_phone_config enable row level security;

create policy "Only members of the same organization can read whatsapp_phone_config"
on public.whatsapp_phone_config
for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and organization_id = whatsapp_phone_config.organization_id
  )
);
