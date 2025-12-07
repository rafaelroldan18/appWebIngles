/**
 * GAMIFICATION CONTENT TEMPLATES
 * Pedagogical content templates for English curriculum units 13-16
 */

import {
  ActivityType,
  DifficultyLevel,
  MissionType,
} from '@/types/gamification.types';

export interface ActivityTemplate {
  type: ActivityType;
  title: string;
  prompt: string;
  content_data: any;
  points_value: number;
  time_limit_seconds?: number;
  feedback: {
    correct: string;
    incorrect: string;
  };
}

export interface MissionTemplate {
  unit: number;
  topic: string;
  title: string;
  description: string;
  learning_objective: string;
  difficulty_level: DifficultyLevel;
  mission_type: MissionType;
  base_points: number;
  estimated_duration_minutes: number;
  activities: ActivityTemplate[];
}

/**
 * Content templates organized by unit
 * Unit 13: Places in town
 * Unit 14: Transport and movement
 * Unit 15: Clothes and appearance
 * Unit 16: Shopping and money
 */
export const CONTENT_TEMPLATES: Record<number, MissionTemplate[]> = {
  13: [
    {
      unit: 13,
      topic: 'Places in town',
      title: 'Exploring the City Center',
      description: 'Learn about different places in town and how to ask for directions.',
      learning_objective: 'Identify common places in town and use "there is/there are" questions',
      difficulty_level: 'facil',
      mission_type: 'vocabulary',
      base_points: 100,
      estimated_duration_minutes: 15,
      activities: [
        {
          type: 'quiz',
          title: 'Places Vocabulary',
          prompt: 'Choose the correct place for each description.',
          content_data: {
            type: 'quiz',
            questions: [
              {
                question: 'Where can you buy bread and cakes?',
                options: ['supermarket', 'bakery', 'bank', 'library'],
                correct: 1,
                explanation: 'A bakery is a shop that sells bread and cakes.'
              },
              {
                question: 'Where do you go to send letters?',
                options: ['post office', 'restaurant', 'cinema', 'park'],
                correct: 0,
                explanation: 'The post office is where you send letters and packages.'
              },
              {
                question: 'Where can you borrow books?',
                options: ['bookshop', 'museum', 'library', 'school'],
                correct: 2,
                explanation: 'A library is a place where you can borrow books for free.'
              }
            ]
          },
          points_value: 34,
          feedback: {
            correct: 'Great job! You know your places in town!',
            incorrect: 'Think about what each place is used for.'
          }
        },
        {
          type: 'match_up',
          title: 'Match Places and Activities',
          prompt: 'Match each place with what you can do there.',
          content_data: {
            type: 'match_up',
            pairs: [
              { term: 'cinema', definition: 'watch movies' },
              { term: 'park', definition: 'play and relax' },
              { term: 'supermarket', definition: 'buy food' },
              { term: 'museum', definition: 'see art and history' }
            ]
          },
          points_value: 33,
          feedback: {
            correct: 'Perfect matching!',
            incorrect: 'Think about what people do in each place.'
          }
        },
        {
          type: 'complete_sentence',
          title: 'Complete the Sentences',
          prompt: 'Fill in the blanks with the correct words.',
          content_data: {
            type: 'complete_sentence',
            sentence: 'Is there a ___ near here? I need to buy medicine.',
            blanks: [
              {
                position: 10,
                answer: 'pharmacy',
                alternatives: ['chemist', 'drugstore']
              }
            ]
          },
          points_value: 33,
          feedback: {
            correct: 'Excellent!',
            incorrect: 'Try again.'
          }
        }
      ]
    },
    {
      unit: 13,
      topic: 'Places in town',
      title: 'Around My Neighborhood',
      description: 'Practice describing your neighborhood using prepositions.',
      learning_objective: 'Use prepositions of place to describe locations',
      difficulty_level: 'medio',
      mission_type: 'grammar',
      base_points: 150,
      estimated_duration_minutes: 20,
      activities: [
        {
          type: 'quiz',
          title: 'Prepositions of Place',
          prompt: 'Choose the correct preposition.',
          content_data: {
            type: 'quiz',
            questions: [
              {
                question: 'The bank is ___ the supermarket and the post office.',
                options: ['next to', 'between', 'opposite', 'behind'],
                correct: 1,
                explanation: '"Between" is used when something is in the middle of two things.'
              },
              {
                question: 'The library is ___ the street from the park.',
                options: ['next to', 'in front of', 'opposite', 'near'],
                correct: 2,
                explanation: '"Opposite" means on the other side of the street.'
              }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Great! You know your prepositions!',
            incorrect: 'Review the prepositions and try again.'
          }
        },
        {
          type: 'match_up',
          title: 'Prepositions Practice',
          prompt: 'Match the sentences with the correct preposition.',
          content_data: {
            type: 'match_up',
            pairs: [
              { term: 'The shop is ___ the corner', definition: 'on' },
              { term: 'Walk ___ the bridge', definition: 'across' },
              { term: 'The café is ___ the bank', definition: 'opposite' }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Wonderful!',
            incorrect: 'Keep practicing prepositions.'
          }
        },
        {
          type: 'complete_sentence',
          title: 'Directions',
          prompt: 'Complete the directions.',
          content_data: {
            type: 'complete_sentence',
            sentence: 'Turn left ___ the corner and the bank is on your right.',
            blanks: [
              { position: 10, answer: 'at', alternatives: [] }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Perfect directions!',
            incorrect: 'Review direction phrases.'
          }
        }
      ]
    }
  ],
  14: [
    {
      unit: 14,
      topic: 'Transport and movement',
      title: 'Getting Around Town',
      description: 'Learn about different types of transport.',
      learning_objective: 'Identify transport vocabulary and make suggestions',
      difficulty_level: 'facil',
      mission_type: 'vocabulary',
      base_points: 100,
      estimated_duration_minutes: 15,
      activities: [
        {
          type: 'quiz',
          title: 'Transport Vocabulary',
          prompt: 'Choose the correct transport.',
          content_data: {
            type: 'quiz',
            questions: [
              {
                question: 'What travels on rails and connects cities?',
                options: ['bus', 'car', 'train', 'bicycle'],
                correct: 2,
                explanation: 'Trains travel on railway tracks.'
              },
              {
                question: 'What underground transport do big cities have?',
                options: ['tram', 'metro', 'bus', 'taxi'],
                correct: 1,
                explanation: 'The metro runs underground.'
              }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Excellent! You know transport!',
            incorrect: 'Review transport types.'
          }
        },
        {
          type: 'match_up',
          title: 'Transport and Places',
          prompt: 'Match transport with where you find it.',
          content_data: {
            type: 'match_up',
            pairs: [
              { term: 'plane', definition: 'airport' },
              { term: 'train', definition: 'station' },
              { term: 'ferry', definition: 'port' }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Perfect!',
            incorrect: 'Think about where each transport departs from.'
          }
        }
      ]
    }
  ],
  15: [
    {
      unit: 15,
      topic: 'Clothes and appearance',
      title: 'What Shall I Wear?',
      description: 'Learn clothing vocabulary.',
      learning_objective: 'Identify clothes items and describe appearance',
      difficulty_level: 'facil',
      mission_type: 'vocabulary',
      base_points: 100,
      estimated_duration_minutes: 15,
      activities: [
        {
          type: 'quiz',
          title: 'Clothes Vocabulary',
          prompt: 'Choose the correct clothing item.',
          content_data: {
            type: 'quiz',
            questions: [
              {
                question: 'What do you wear on your feet in winter?',
                options: ['sandals', 'boots', 'flip-flops', 'slippers'],
                correct: 1,
                explanation: 'Boots keep your feet warm in winter.'
              },
              {
                question: 'What do you wear to keep warm?',
                options: ['t-shirt', 'shorts', 'jacket', 'skirt'],
                correct: 2,
                explanation: 'A jacket keeps you warm.'
              }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Great! You know clothing vocabulary!',
            incorrect: 'Review clothing items.'
          }
        },
        {
          type: 'match_up',
          title: 'Clothes and Occasions',
          prompt: 'Match clothing with occasions.',
          content_data: {
            type: 'match_up',
            pairs: [
              { term: 'swimsuit', definition: 'at the beach' },
              { term: 'pyjamas', definition: 'in bed' },
              { term: 'coat', definition: 'in cold weather' }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Perfect!',
            incorrect: 'Think about when you wear different clothes.'
          }
        }
      ]
    }
  ],
  16: [
    {
      unit: 16,
      topic: 'Shopping and money',
      title: 'At the Shopping Center',
      description: 'Learn shopping vocabulary.',
      learning_objective: 'Use shopping vocabulary and express needs',
      difficulty_level: 'facil',
      mission_type: 'vocabulary',
      base_points: 100,
      estimated_duration_minutes: 15,
      activities: [
        {
          type: 'quiz',
          title: 'Shopping Vocabulary',
          prompt: 'Choose the correct word.',
          content_data: {
            type: 'quiz',
            questions: [
              {
                question: 'Where you pay for items is called the ___.',
                options: ['counter', 'checkout', 'cashier', 'till'],
                correct: 1,
                explanation: 'The checkout is where you pay.'
              },
              {
                question: 'When something costs less, it is on ___.',
                options: ['discount', 'sale', 'cheap', 'offer'],
                correct: 1,
                explanation: 'Items "on sale" have reduced prices.'
              }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Great! You know shopping vocabulary!',
            incorrect: 'Review shopping terms.'
          }
        },
        {
          type: 'match_up',
          title: 'Shops and Products',
          prompt: 'Match shops with what they sell.',
          content_data: {
            type: 'match_up',
            pairs: [
              { term: 'bookshop', definition: 'books' },
              { term: 'butcher', definition: 'meat' },
              { term: 'chemist', definition: 'medicine' }
            ]
          },
          points_value: 50,
          feedback: {
            correct: 'Perfect!',
            incorrect: 'Think about what each shop sells.'
          }
        }
      ]
    }
  ]
};

export function getMissionTemplatesForUnit(unit: number): MissionTemplate[] {
  return CONTENT_TEMPLATES[unit] || [];
}

export function getAllMissionTemplates(): MissionTemplate[] {
  return Object.values(CONTENT_TEMPLATES).flat();
}

export function getContentStatistics() {
  const allMissions = getAllMissionTemplates();
  const totalActivities = allMissions.reduce((sum, m) => sum + m.activities.length, 0);

  return {
    totalMissions: allMissions.length,
    totalActivities,
    missionsByUnit: Object.entries(CONTENT_TEMPLATES).map(([unit, missions]) => ({
      unit: Number(unit),
      missionCount: missions.length,
      activityCount: missions.reduce((sum, m) => sum + m.activities.length, 0)
    }))
  };
}
