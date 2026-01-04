-- Add show_theory column to game_availability table
-- This allows teachers to control whether students can access theory content for each mission

ALTER TABLE public.game_availability 
ADD COLUMN IF NOT EXISTS show_theory boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.game_availability.show_theory IS 'Controls whether students can access theory content for this mission. Set by teacher when creating/editing the mission.';
