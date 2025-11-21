/*
  # Seed Gamification Content - Units 13-16

  Seeds database with pedagogical content for English curriculum units 13-16.
  Total: 5 missions, 11 activities across Units 13-16.
*/

-- UNIT 13: Mission 1
DO $$
DECLARE v_mission_id UUID;
BEGIN
  INSERT INTO gamification_missions (unit_number, topic, title, description, difficulty_level, base_points, mission_type, estimated_duration_minutes, is_active, order_index, created_by)
  VALUES (13, 'Places in town', 'Exploring the City Center', 'Learn about different places in town and how to ask for directions.', 'facil', 100, 'vocabulary', 15, true, 1300, NULL)
  RETURNING id INTO v_mission_id;

  INSERT INTO gamification_activities (mission_id, title, activity_type, prompt, content_data, points_value, order_index, is_active) VALUES
  (v_mission_id, 'Places Vocabulary', 'quiz', 'Choose the correct place for each description.', '{"type":"quiz","questions":[{"question":"Where can you buy bread and cakes?","options":["supermarket","bakery","bank","library"],"correct":1,"explanation":"A bakery is a shop that sells bread and cakes."},{"question":"Where do you go to send letters?","options":["post office","restaurant","cinema","park"],"correct":0,"explanation":"The post office is where you send letters and packages."},{"question":"Where can you borrow books?","options":["bookshop","museum","library","school"],"correct":2,"explanation":"A library is a place where you can borrow books for free."}]}'::jsonb, 34, 1, true),
  (v_mission_id, 'Match Places and Activities', 'matching', 'Match each place with what you can do there.', '{"type":"matching","pairs":[{"left":"cinema","right":"watch movies"},{"left":"park","right":"play and relax"},{"left":"supermarket","right":"buy food"},{"left":"museum","right":"see art and history"}]}'::jsonb, 33, 2, true),
  (v_mission_id, 'Complete the Sentences', 'fill_in_blank', 'Fill in the blanks with the correct words.', '{"type":"fill_in_blank","sentence":"Is there a ___ near here? I need to buy medicine.","blanks":[{"position":10,"answer":"pharmacy","alternatives":["chemist","drugstore"]}]}'::jsonb, 33, 3, true);
END $$;

-- UNIT 13: Mission 2
DO $$
DECLARE v_mission_id UUID;
BEGIN
  INSERT INTO gamification_missions (unit_number, topic, title, description, difficulty_level, base_points, mission_type, estimated_duration_minutes, is_active, order_index, created_by)
  VALUES (13, 'Places in town', 'Around My Neighborhood', 'Practice describing your neighborhood using prepositions.', 'medio', 150, 'grammar', 20, true, 1301, NULL)
  RETURNING id INTO v_mission_id;

  INSERT INTO gamification_activities (mission_id, title, activity_type, prompt, content_data, points_value, order_index, is_active) VALUES
  (v_mission_id, 'Prepositions of Place', 'quiz', 'Choose the correct preposition.', '{"type":"quiz","questions":[{"question":"The bank is ___ the supermarket and the post office.","options":["next to","between","opposite","behind"],"correct":1,"explanation":"\"Between\" is used when something is in the middle of two things."},{"question":"The library is ___ the street from the park.","options":["next to","in front of","opposite","near"],"correct":2,"explanation":"\"Opposite\" means on the other side of the street."}]}'::jsonb, 50, 1, true),
  (v_mission_id, 'Prepositions Practice', 'matching', 'Match the sentences with the correct preposition.', '{"type":"matching","pairs":[{"left":"The shop is ___ the corner","right":"on"},{"left":"Walk ___ the bridge","right":"across"},{"left":"The café is ___ the bank","right":"opposite"}]}'::jsonb, 50, 2, true),
  (v_mission_id, 'Directions', 'fill_in_blank', 'Complete the directions.', '{"type":"fill_in_blank","sentence":"Turn left ___ the corner and the bank is on your right.","blanks":[{"position":10,"answer":"at","alternatives":[]}]}'::jsonb, 50, 3, true);
END $$;

-- UNIT 14
DO $$
DECLARE v_mission_id UUID;
BEGIN
  INSERT INTO gamification_missions (unit_number, topic, title, description, difficulty_level, base_points, mission_type, estimated_duration_minutes, is_active, order_index, created_by)
  VALUES (14, 'Transport and movement', 'Getting Around Town', 'Learn about different types of transport.', 'facil', 100, 'vocabulary', 15, true, 1400, NULL)
  RETURNING id INTO v_mission_id;

  INSERT INTO gamification_activities (mission_id, title, activity_type, prompt, content_data, points_value, order_index, is_active) VALUES
  (v_mission_id, 'Transport Vocabulary', 'quiz', 'Choose the correct transport.', '{"type":"quiz","questions":[{"question":"What travels on rails and connects cities?","options":["bus","car","train","bicycle"],"correct":2,"explanation":"Trains travel on railway tracks."},{"question":"What underground transport do big cities have?","options":["tram","metro","bus","taxi"],"correct":1,"explanation":"The metro runs underground."}]}'::jsonb, 50, 1, true),
  (v_mission_id, 'Transport and Places', 'matching', 'Match transport with where you find it.', '{"type":"matching","pairs":[{"left":"plane","right":"airport"},{"left":"train","right":"station"},{"left":"ferry","right":"port"}]}'::jsonb, 50, 2, true);
END $$;

-- UNIT 15
DO $$
DECLARE v_mission_id UUID;
BEGIN
  INSERT INTO gamification_missions (unit_number, topic, title, description, difficulty_level, base_points, mission_type, estimated_duration_minutes, is_active, order_index, created_by)
  VALUES (15, 'Clothes and appearance', 'What Shall I Wear?', 'Learn clothing vocabulary.', 'facil', 100, 'vocabulary', 15, true, 1500, NULL)
  RETURNING id INTO v_mission_id;

  INSERT INTO gamification_activities (mission_id, title, activity_type, prompt, content_data, points_value, order_index, is_active) VALUES
  (v_mission_id, 'Clothes Vocabulary', 'quiz', 'Choose the correct clothing item.', '{"type":"quiz","questions":[{"question":"What do you wear on your feet in winter?","options":["sandals","boots","flip-flops","slippers"],"correct":1,"explanation":"Boots keep your feet warm in winter."},{"question":"What do you wear to keep warm?","options":["t-shirt","shorts","jacket","skirt"],"correct":2,"explanation":"A jacket keeps you warm."}]}'::jsonb, 50, 1, true),
  (v_mission_id, 'Clothes and Occasions', 'matching', 'Match clothing with occasions.', '{"type":"matching","pairs":[{"left":"swimsuit","right":"at the beach"},{"left":"pyjamas","right":"in bed"},{"left":"coat","right":"in cold weather"}]}'::jsonb, 50, 2, true);
END $$;

-- UNIT 16
DO $$
DECLARE v_mission_id UUID;
BEGIN
  INSERT INTO gamification_missions (unit_number, topic, title, description, difficulty_level, base_points, mission_type, estimated_duration_minutes, is_active, order_index, created_by)
  VALUES (16, 'Shopping and money', 'At the Shopping Center', 'Learn shopping vocabulary.', 'facil', 100, 'vocabulary', 15, true, 1600, NULL)
  RETURNING id INTO v_mission_id;

  INSERT INTO gamification_activities (mission_id, title, activity_type, prompt, content_data, points_value, order_index, is_active) VALUES
  (v_mission_id, 'Shopping Vocabulary', 'quiz', 'Choose the correct word.', '{"type":"quiz","questions":[{"question":"Where you pay for items is called the ___.","options":["counter","checkout","cashier","till"],"correct":1,"explanation":"The checkout is where you pay."},{"question":"When something costs less, it is on ___.","options":["discount","sale","cheap","offer"],"correct":1,"explanation":"Items \"on sale\" have reduced prices."}]}'::jsonb, 50, 1, true),
  (v_mission_id, 'Shops and Products', 'matching', 'Match shops with what they sell.', '{"type":"matching","pairs":[{"left":"bookshop","right":"books"},{"left":"butcher","right":"meat"},{"left":"chemist","right":"medicine"}]}'::jsonb, 50, 2, true);
END $$;