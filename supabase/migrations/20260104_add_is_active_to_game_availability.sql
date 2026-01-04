-- Add is_active column to game_availability table
-- This allows teachers to create missions as drafts and activate them when ready
-- Students will only see active missions

ALTER TABLE public.game_availability 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.game_availability.is_active IS 'Controls whether this mission is visible and playable by students. Teachers can create inactive missions as drafts.';

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_game_availability_is_active 
ON public.game_availability(is_active);
