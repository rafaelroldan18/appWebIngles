-- Sample data for Word Catcher game
-- This script populates the database with test game content

-- 1. Insert game type for Word Catcher
INSERT INTO public.game_types (name, description) 
VALUES 
  ('Word Catcher', 'Catch falling words by clicking on the correct ones'),
  ('Sentence Builder', 'Build sentences from falling words'),
  ('Vocabulary Match', 'Match words with their definitions')
ON CONFLICT (name) DO NOTHING;

-- 2. Create a sample topic (assuming you have a teacher user)
-- Replace 'YOUR_TEACHER_USER_ID' with an actual teacher user_id
INSERT INTO public.topics (title, description, level, created_by)
VALUES 
  ('Present Simple Verbs', 'Practice common verbs in present simple tense', '1ro BGU', 'YOUR_TEACHER_USER_ID'),
  ('Common Adjectives', 'Learn descriptive adjectives', '1ro BGU', 'YOUR_TEACHER_USER_ID'),
  ('Daily Routines', 'Vocabulary for daily activities', '1ro BGU', 'YOUR_TEACHER_USER_ID')
ON CONFLICT DO NOTHING;

-- 3. Insert game content for "Present Simple Verbs" topic
-- Get the topic_id first, then insert content
WITH topic AS (
  SELECT topic_id FROM public.topics WHERE title = 'Present Simple Verbs' LIMIT 1
)
INSERT INTO public.game_content (topic_id, content_type, content_text, is_correct)
SELECT 
  topic.topic_id,
  'word',
  content_text,
  is_correct
FROM topic, (VALUES
  -- Correct verbs (is_correct = true)
  ('run', true),
  ('walk', true),
  ('eat', true),
  ('drink', true),
  ('sleep', true),
  ('study', true),
  ('work', true),
  ('play', true),
  ('read', true),
  ('write', true),
  ('speak', true),
  ('listen', true),
  ('watch', true),
  ('cook', true),
  ('clean', true),
  
  -- Incorrect words (is_correct = false)
  ('running', false),
  ('walked', false),
  ('eaten', false),
  ('drank', false),
  ('sleeping', false),
  ('studied', false),
  ('worked', false),
  ('played', false),
  ('reading', false),
  ('written', false),
  ('spoke', false),
  ('listened', false),
  ('watching', false),
  ('cooked', false),
  ('cleaned', false)
) AS data(content_text, is_correct);

-- 4. Insert game content for "Common Adjectives" topic
WITH topic AS (
  SELECT topic_id FROM public.topics WHERE title = 'Common Adjectives' LIMIT 1
)
INSERT INTO public.game_content (topic_id, content_type, content_text, is_correct)
SELECT 
  topic.topic_id,
  'word',
  content_text,
  is_correct
FROM topic, (VALUES
  -- Correct adjectives
  ('happy', true),
  ('sad', true),
  ('big', true),
  ('small', true),
  ('fast', true),
  ('slow', true),
  ('hot', true),
  ('cold', true),
  ('good', true),
  ('bad', true),
  ('new', true),
  ('old', true),
  ('young', true),
  ('beautiful', true),
  ('ugly', true),
  
  -- Incorrect (nouns or verbs)
  ('happiness', false),
  ('sadness', false),
  ('run', false),
  ('walk', false),
  ('quickly', false),
  ('slowly', false),
  ('heat', false),
  ('freeze', false),
  ('goodness', false),
  ('badly', false),
  ('news', false),
  ('age', false),
  ('youth', false),
  ('beauty', false),
  ('ugliness', false)
) AS data(content_text, is_correct);

-- 5. Make games available for a parallel
-- Replace 'YOUR_PARALLEL_ID' with an actual parallel_id
-- Replace 'YOUR_GAME_TYPE_ID' with the Word Catcher game_type_id
-- Replace 'YOUR_TOPIC_ID' with the topic_id

WITH game_type AS (
  SELECT game_type_id FROM public.game_types WHERE name = 'Word Catcher' LIMIT 1
),
topic1 AS (
  SELECT topic_id FROM public.topics WHERE title = 'Present Simple Verbs' LIMIT 1
),
topic2 AS (
  SELECT topic_id FROM public.topics WHERE title = 'Common Adjectives' LIMIT 1
)
INSERT INTO public.game_availability (game_type_id, topic_id, parallel_id, available_from, available_until, max_attempts)
SELECT 
  game_type.game_type_id,
  topic.topic_id,
  'YOUR_PARALLEL_ID'::uuid,
  NOW(),
  NOW() + INTERVAL '30 days',
  5
FROM game_type, (
  SELECT topic_id FROM topic1
  UNION ALL
  SELECT topic_id FROM topic2
) AS topic(topic_id);

-- 6. Query to verify the data
SELECT 
  gt.name as game_type,
  t.title as topic,
  COUNT(gc.content_id) as total_words,
  SUM(CASE WHEN gc.is_correct THEN 1 ELSE 0 END) as correct_words,
  SUM(CASE WHEN NOT gc.is_correct THEN 1 ELSE 0 END) as incorrect_words
FROM public.game_types gt
JOIN public.topics t ON true
LEFT JOIN public.game_content gc ON gc.topic_id = t.topic_id
WHERE gt.name = 'Word Catcher'
GROUP BY gt.name, t.title
ORDER BY t.title;

-- 7. Query to check game availability
SELECT 
  ga.availability_id,
  gt.name as game_type,
  t.title as topic,
  p.name as parallel,
  ga.available_from,
  ga.available_until,
  ga.max_attempts
FROM public.game_availability ga
JOIN public.game_types gt ON ga.game_type_id = gt.game_type_id
JOIN public.topics t ON ga.topic_id = t.topic_id
JOIN public.parallels p ON ga.parallel_id = p.parallel_id
WHERE gt.name = 'Word Catcher'
ORDER BY t.title;
