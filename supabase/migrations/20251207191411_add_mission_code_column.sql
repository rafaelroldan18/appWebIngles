/*
  # Add mission code column

  1. Changes
    - Add `code` column to `gamification_missions` table
    - Make it unique to prevent duplicate mission codes
    - Add index for faster lookups by code

  2. Notes
    - Code will be used as a unique identifier for missions (e.g., "13-1", "14-2")
    - Existing missions without codes will have NULL values initially
*/

-- Add code column to missions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'gamification_missions' AND column_name = 'code'
  ) THEN
    ALTER TABLE gamification_missions ADD COLUMN code TEXT UNIQUE;
  END IF;
END $$;

-- Create index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_gamification_missions_code
ON gamification_missions(code);

-- Create index for unit_number lookups
CREATE INDEX IF NOT EXISTS idx_gamification_missions_unit
ON gamification_missions(unit_number);
