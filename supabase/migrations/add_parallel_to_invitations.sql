-- Add parallel_id column to invitations table
-- This allows storing the parallel assignment when creating an invitation

ALTER TABLE public.invitations
ADD COLUMN parallel_id uuid;

-- Add foreign key constraint
ALTER TABLE public.invitations
ADD CONSTRAINT invitations_parallel_id_fkey 
FOREIGN KEY (parallel_id) 
REFERENCES public.parallels(parallel_id);

-- Add index for performance
CREATE INDEX idx_invitations_parallel ON public.invitations(parallel_id);

-- Comment
COMMENT ON COLUMN public.invitations.parallel_id IS 'Parallel assigned to the student (for estudiante role only)';
