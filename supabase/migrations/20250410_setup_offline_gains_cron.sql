
-- Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurer un job cron pour générer des gains hors-ligne toutes les 30 minutes
SELECT cron.schedule(
  'generate-offline-gains-every-30min',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://' || (SELECT value FROM public.secrets WHERE name = 'PROJECT_REF') || '.functions.supabase.co/generate-offline-gains',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || (SELECT value FROM public.secrets WHERE name = 'CRON_SECRET_KEY') || '"}'::jsonb,
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Table pour stocker les secrets nécessaires au cron job
-- Note: Cette table doit être remplie manuellement avec les bonnes valeurs
CREATE TABLE IF NOT EXISTS public.secrets (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Protéger cette table avec RLS
ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

-- Seuls les rôles admin peuvent accéder à cette table
CREATE POLICY admin_only ON public.secrets
  USING (false)
  WITH CHECK (auth.jwt()->>'role' = 'service_role');
