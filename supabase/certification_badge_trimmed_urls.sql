-- Run in the Supabase SQL Editor after the trimmed assets are present in certification-badges.
-- This updates only the two existing certification records that were inspected.
begin;

update public.certifications
set badge_url = 'https://ufznvtwpzdfrryeupzkt.supabase.co/storage/v1/object/public/certification-badges/certifications/aws-certified-cloud-practitioner-trimmed.png'
where id = '1a33c937-9bdc-41c4-8e20-0ec80d44e5db';

update public.certifications
set badge_url = 'https://ufznvtwpzdfrryeupzkt.supabase.co/storage/v1/object/public/certification-badges/certifications/aws-certified-solutions-architect-associate-trimmed.png'
where id = '2cbfdb17-655c-4d0c-ac1f-196e96c944f7';

commit;
