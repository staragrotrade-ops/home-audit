-- The language a referral partner's clients mostly speak. Chinese-speaking
-- partners get the Chinese website link (/zh) and the email in Chinese.
-- Safe to run more than once.
alter table public.referrers add column if not exists language text not null default 'en';
alter table public.referrers drop constraint if exists referrers_language_check;
alter table public.referrers add constraint referrers_language_check check (language in ('en', 'zh'));
