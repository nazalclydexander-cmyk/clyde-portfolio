-- Required policy change: remove anonymous/public direct inserts so all public
-- contact submissions must go through the server-side /api/contact route.
drop policy if exists "Public can submit contact messages" on public.messages;

-- Optional compatibility checks before adding tighter length constraints.
-- Run these first and confirm each returns zero rows before applying the
-- corresponding ALTER TABLE statements below.
select id from public.messages where char_length(name) not between 2 and 100;
select id from public.messages where char_length(email) > 254;
select id from public.messages where subject is not null and char_length(subject) > 150;
select id from public.messages where char_length(message) not between 10 and 5000;

-- Optional constraints to apply only after the checks above pass.
-- alter table public.messages
--   add constraint messages_name_length_check check (char_length(name) between 2 and 100),
--   add constraint messages_email_length_check check (char_length(email) <= 254),
--   add constraint messages_subject_length_check check (subject is null or char_length(subject) <= 150),
--   add constraint messages_message_length_check check (char_length(message) between 10 and 5000);
