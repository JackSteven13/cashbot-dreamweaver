
-- Table pour stocker les gains générés lorsque l'utilisateur n'est pas connecté
CREATE TABLE IF NOT EXISTS public.offline_gains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  subscription TEXT NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT amount_positive CHECK (amount > 0)
);

-- Index pour améliorer les performances des requêtes fréquentes
CREATE INDEX IF NOT EXISTS offline_gains_user_id_idx ON public.offline_gains(user_id);
CREATE INDEX IF NOT EXISTS offline_gains_created_at_idx ON public.offline_gains(created_at);
CREATE INDEX IF NOT EXISTS offline_gains_processed_idx ON public.offline_gains(processed);

-- Ajouter une politique RLS pour protéger les données
ALTER TABLE public.offline_gains ENABLE ROW LEVEL SECURITY;

-- Politique pour l'accès utilisateur: chaque utilisateur ne peut voir que ses propres gains
CREATE POLICY offline_gains_user_access ON public.offline_gains
  FOR SELECT USING (auth.uid() = user_id);

-- Politique pour l'accès admin/service-role
CREATE POLICY offline_gains_service_role ON public.offline_gains
  USING (true)
  WITH CHECK (true);
