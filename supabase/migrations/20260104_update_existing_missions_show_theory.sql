-- Update existing missions to have show_theory = true
-- This ensures backward compatibility for missions created before this feature

UPDATE public.game_availability 
SET show_theory = true 
WHERE show_theory IS NULL;
