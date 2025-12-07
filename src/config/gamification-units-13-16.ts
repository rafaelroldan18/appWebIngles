export const gamificationUnits13to16 = [
  // UNIDAD 13
  {
    unit: 13,
    title: "Places",
    missions: [
      {
        code: "13-1",
        title: "Places in a Town",
        objective: "Learn vocabulary about places in a town and basic adjectives.",
        difficulty: "easy",
        activities: [
          {
            type: "flashcards",
            label: "Places flashcards",
            data: {
              cards: [
                { front: "library", back: "biblioteca" },
                { front: "museum", back: "museo" },
                { front: "bakery", back: "panadería" },
                { front: "park", back: "parque" }
              ]
            }
          },
          {
            type: "matching_pairs",
            label: "Places and functions",
            data: {
              pairs: [
                { left: "hospital", right: "place for sick people" },
                { left: "park", right: "place to relax outdoors" },
                { left: "cinema", right: "place to watch films" }
              ]
            }
          },
          {
            type: "match_up",
            label: "Adjectives and places",
            data: {
              pairs: [
                { left: "quiet", right: "library" },
                { left: "crowded", right: "shopping centre" },
                { left: "beautiful", right: "park" }
              ]
            }
          },
          {
            type: "complete_sentence",
            label: "Prepositions of place",
            data: {
              items: [
                {
                  text: "The school is ___ the park.",
                  answer: "near"
                },
                {
                  text: "The museum is ___ the river.",
                  answer: "next to"
                }
              ]
            }
          }
        ]
      },
      {
        code: "13-2",
        title: "Asking About Places",
        objective:
          "Ask and answer questions about places using 'Is there...?' and 'Are there any...?' and prepositions.",
        difficulty: "medium",
        activities: [
          {
            type: "quiz",
            label: "Is there...? Are there any...?",
            data: {
              questions: [
                {
                  question: "___ a bank near here?",
                  options: ["Is there", "Are there", "There is"],
                  answer: "Is there"
                },
                {
                  question: "___ any museums in your town?",
                  options: ["Is there", "Are there", "There are"],
                  answer: "Are there"
                }
              ]
            }
          },
          {
            type: "group_sort",
            label: "Correct vs incorrect questions",
            data: {
              groups: {
                correct: [
                  "Is there a cinema near here?",
                  "Are there any shops in this street?"
                ],
                incorrect: [
                  "Is there any parks near here?",
                  "Are there a bank near here?"
                ]
              }
            }
          },
          {
            type: "spin_wheel",
            label: "Random place questions",
            data: {
              prompts: [
                "Ask about a park in your town.",
                "Ask about a cinema near your house.",
                "Ask about museums in your city."
              ]
            }
          },
          {
            type: "open_box",
            label: "Prepositions challenges",
            data: {
              boxes: [
                {
                  question: "Describe where the supermarket is in your town.",
                  type: "free"
                },
                {
                  question: "Use inside / outside / above / below in one sentence.",
                  type: "free"
                }
              ]
            }
          }
        ]
      },
      {
        code: "13-3",
        title: "My Favourite Place",
        objective: "Describe a favourite place using vocabulary and adjectives.",
        difficulty: "medium",
        activities: [
          {
            type: "speaking_cards",
            label: "Describe your favourite place",
            data: {
              cards: [
                "Describe your favourite place in your town.",
                "Describe a place you like to visit on weekends."
              ]
            }
          },
          {
            type: "open_box",
            label: "Guided questions",
            data: {
              boxes: [
                { question: "Where is it?", type: "free" },
                { question: "What can you do there?", type: "free" },
                { question: "Why do you like it?", type: "free" }
              ]
            }
          },
          {
            type: "unjumble",
            label: "Place sentences",
            data: {
              items: [
                {
                  scrambled: "beautiful / is / very / park / the",
                  answer: "The park is very beautiful."
                }
              ]
            }
          }
        ]
      }
    ]
  },

  // UNIDAD 14
  {
    unit: 14,
    title: "Out and About",
    missions: [
      {
        code: "14-1",
        title: "Transport & Going Out",
        objective:
          "Learn transport vocabulary and basic phrases for going out.",
        difficulty: "easy",
        activities: [
          {
            type: "flashcards",
            label: "Transport",
            data: {
              cards: [
                { front: "bus", back: "autobús" },
                { front: "train", back: "tren" },
                { front: "underground", back: "metro" },
                { front: "bike", back: "bicicleta" }
              ]
            }
          },
          {
            type: "match_up",
            label: "Going out phrases",
            data: {
              pairs: [
                { left: "Let's go to the cinema", right: "invitation" },
                { left: "Shall we meet at 6?", right: "making plans" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Connectors",
            data: {
              questions: [
                {
                  question: "I like buses ___ I don't like taxis.",
                  options: ["because", "but", "or"],
                  answer: "but"
                },
                {
                  question: "We can go by bus ___ by train.",
                  options: ["and", "or", "because"],
                  answer: "or"
                }
              ]
            }
          },
          {
            type: "complete_sentence",
            label: "Let's / Shall we…?",
            data: {
              items: [
                {
                  text: "___ go to the park after school.",
                  answer: "Let's"
                },
                {
                  text: "___ we go to the museum on Saturday?",
                  answer: "Shall"
                }
              ]
            }
          }
        ]
      },
      {
        code: "14-2",
        title: "Weekend Plans",
        objective:
          "Talk about weekend plans and practise informal conversations.",
        difficulty: "medium",
        activities: [
          {
            type: "matching_pairs",
            label: "Weekend activities",
            data: {
              pairs: [
                { left: "go to a party", right: "Saturday night" },
                { left: "visit grandparents", right: "Sunday afternoon" }
              ]
            }
          },
          {
            type: "group_sort",
            label: "Formal vs informal",
            data: {
              groups: {
                formal: ["Would you like to go out?", "Shall we meet at six?"],
                informal: ["Let's hang out!", "Wanna go to the mall?"]
              }
            }
          },
          {
            type: "spin_wheel",
            label: "Weekend questions",
            data: {
              prompts: [
                "What do you usually do on Saturday?",
                "What is your perfect weekend?"
              ]
            }
          },
          {
            type: "hangman",
            label: "Weekend words",
            data: {
              words: ["cinema", "football", "concert"]
            }
          }
        ]
      },
      {
        code: "14-3",
        title: "Getting Around London",
        objective:
          "Use transport vocabulary and directions in the context of a big city.",
        difficulty: "medium",
        activities: [
          {
            type: "open_box",
            label: "London facts",
            data: {
              boxes: [
                {
                  question: "Name one famous place in London.",
                  type: "free"
                },
                {
                  question: "How can you travel around London?",
                  type: "free"
                }
              ]
            }
          },
          {
            type: "speaking_cards",
            label: "Give directions",
            data: {
              cards: [
                "Explain how to go from the hotel to the museum.",
                "Explain how to go from the station to the park."
              ]
            }
          },
          {
            type: "unjumble",
            label: "Transport sentences",
            data: {
              items: [
                {
                  scrambled: "go / we / can / by / underground",
                  answer: "We can go by underground."
                }
              ]
            }
          }
        ]
      }
    ]
  },

  // UNIDAD 15
  {
    unit: 15,
    title: "What Shall I Wear?",
    missions: [
      {
        code: "15-1",
        title: "Clothes & Accessories",
        objective: "Learn clothes vocabulary and plural forms.",
        difficulty: "easy",
        activities: [
          {
            type: "flashcards",
            label: "Clothes",
            data: {
              cards: [
                { front: "T-shirt", back: "camiseta" },
                { front: "jeans", back: "pantalones" },
                { front: "dress", back: "vestido" }
              ]
            }
          },
          {
            type: "match_up",
            label: "Clothes and people",
            data: {
              pairs: [
                { left: "school uniform", right: "students" },
                { left: "suit", right: "businessman" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Plural rules",
            data: {
              questions: [
                {
                  question: "One dress → two ___",
                  options: ["dress", "dresses", "dresss"],
                  answer: "dresses"
                }
              ]
            }
          },
          {
            type: "anagram",
            label: "Clothes words",
            data: {
              words: [
                { scrambled: "AHT", answer: "HAT" },
                { scrambled: "OSEHS", answer: "SHOES" }
              ]
            }
          }
        ]
      },
      {
        code: "15-2",
        title: "Describing People",
        objective:
          "Describe people using adjectives about appearance and clothes.",
        difficulty: "medium",
        activities: [
          {
            type: "flashcards",
            label: "Adjectives",
            data: {
              cards: [
                { front: "tall", back: "alto/a" },
                { front: "short", back: "bajo/a" },
                { front: "curly hair", back: "cabello rizado" }
              ]
            }
          },
          {
            type: "matching_pairs",
            label: "Adjective and image",
            data: {
              pairs: [
                { left: "tall", right: "image_tall" },
                { left: "short", right: "image_short" }
              ]
            }
          },
          {
            type: "speaking_cards",
            label: "Describe people",
            data: {
              cards: [
                "Describe a friend from your class.",
                "Describe a person in your family."
              ]
            }
          },
          {
            type: "open_box",
            label: "Description prompts",
            data: {
              boxes: [
                { question: "What is he/she wearing?", type: "free" },
                { question: "What does he/she look like?", type: "free" }
              ]
            }
          }
        ]
      },
      {
        code: "15-3",
        title: "Carnival Clothes",
        objective: "Describe carnival or party clothes.",
        difficulty: "medium",
        activities: [
          {
            type: "complete_sentence",
            label: "Carnival sentences",
            data: {
              items: [
                {
                  text: "She is wearing a ___ dress.",
                  answer: "colourful"
                }
              ]
            }
          },
          {
            type: "group_sort",
            label: "Formal vs informal clothes",
            data: {
              groups: {
                formal: ["suit", "shirt and tie"],
                informal: ["T-shirt", "jeans"]
              }
            }
          },
          {
            type: "unjumble",
            label: "Clothes sentences",
            data: {
              items: [
                {
                  scrambled: "hat / big / a / wearing / is / he",
                  answer: "He is wearing a big hat."
                }
              ]
            }
          }
        ]
      }
    ]
  },

  // UNIDAD 16
  {
    unit: 16,
    title: "Buy It!",
    missions: [
      {
        code: "16-1",
        title: "Shopping Basics",
        objective:
          "Understand basic shopping vocabulary and simple shop conversations.",
        difficulty: "easy",
        activities: [
          {
            type: "flashcards",
            label: "Shopping words",
            data: {
              cards: [
                { front: "cashier", back: "cajero/a" },
                { front: "receipt", back: "recibo" },
                { front: "discount", back: "descuento" }
              ]
            }
          },
          {
            type: "match_up",
            label: "Shop phrases",
            data: {
              pairs: [
                { left: "Can I help you?", right: "shop assistant" },
                { left: "How much is it?", right: "customer" }
              ]
            }
          },
          {
            type: "quiz",
            label: "Prices",
            data: {
              questions: [
                {
                  question: "How do you say $15?",
                  options: ["fifteen dollars", "fifty dollars", "fifteen"],
                  answer: "fifteen dollars"
                }
              ]
            }
          },
          {
            type: "hangman",
            label: "Shopping words",
            data: {
              words: ["market", "change", "money"]
            }
          }
        ]
      },
      {
        code: "16-2",
        title: "Need, Want and Too",
        objective: "Use need, want and too in shopping contexts.",
        difficulty: "medium",
        activities: [
          {
            type: "group_sort",
            label: "Need vs want",
            data: {
              groups: {
                need: [
                  "I need new shoes for school.",
                  "We need some bread."
                ],
                want: [
                  "I want a new phone.",
                  "She wants a red dress."
                ]
              }
            }
          },
          {
            type: "complete_sentence",
            label: "Using 'too'",
            data: {
              items: [
                {
                  text: "That T-shirt is ___ expensive.",
                  answer: "too"
                },
                {
                  text: "These shoes are ___ big.",
                  answer: "too"
                }
              ]
            }
          },
          {
            type: "spin_wheel",
            label: "Shopping questions",
            data: {
              prompts: [
                "What do you need to buy this week?",
                "What do you want to buy if you have a lot of money?"
              ]
            }
          }
        ]
      },
      {
        code: "16-3",
        title: "Shopping Dialogue",
        objective: "Write and practise a basic shopping dialogue.",
        difficulty: "medium",
        activities: [
          {
            type: "open_box",
            label: "Dialogue prompts",
            data: {
              boxes: [
                {
                  question: "Customer: Ask for a T-shirt in your size.",
                  type: "free"
                },
                {
                  question: "Shop assistant: Say the price and offer a discount.",
                  type: "free"
                }
              ]
            }
          },
          {
            type: "speaking_cards",
            label: "Role-play",
            data: {
              cards: [
                "Student A is the customer, Student B is the shop assistant.",
                "Change roles and repeat the dialogue."
              ]
            }
          },
          {
            type: "unjumble",
            label: "Typical shop sentences",
            data: {
              items: [
                {
                  scrambled: "help / I / you / can?",
                  answer: "Can I help you?"
                }
              ]
            }
          }
        ]
      }
    ]
  }
];
