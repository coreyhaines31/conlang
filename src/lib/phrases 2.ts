export interface Phrase {
  id: string
  english: string
  gloss: string[] // Array of glosses to look up, e.g., ["I", "love", "you"]
  category: string
}

export interface PhrasePack {
  id: string
  name: string
  description: string
  phrases: Phrase[]
}

export const PHRASE_PACKS: PhrasePack[] = [
  {
    id: 'everyday',
    name: 'Everyday',
    description: 'Common greetings and daily expressions',
    phrases: [
      { id: 'e1', english: 'Hello', gloss: ['hello'], category: 'greeting' },
      { id: 'e2', english: 'Goodbye', gloss: ['goodbye'], category: 'greeting' },
      { id: 'e3', english: 'Thank you', gloss: ['thank', 'you'], category: 'greeting' },
      { id: 'e4', english: 'Yes', gloss: ['yes'], category: 'response' },
      { id: 'e5', english: 'No', gloss: ['no'], category: 'response' },
      { id: 'e6', english: 'Please', gloss: ['please'], category: 'request' },
      { id: 'e7', english: 'I am hungry', gloss: ['I', 'be', 'hungry'], category: 'state' },
      { id: 'e8', english: 'I am tired', gloss: ['I', 'be', 'tired'], category: 'state' },
      { id: 'e9', english: 'Water', gloss: ['water'], category: 'noun' },
      { id: 'e10', english: 'Food', gloss: ['food'], category: 'noun' },
      { id: 'e11', english: 'Good morning', gloss: ['good', 'morning'], category: 'greeting' },
      { id: 'e12', english: 'Good night', gloss: ['good', 'night'], category: 'greeting' },
      { id: 'e13', english: 'How are you?', gloss: ['how', 'be', 'you'], category: 'question' },
      { id: 'e14', english: 'I am fine', gloss: ['I', 'be', 'fine'], category: 'response' },
      { id: 'e15', english: 'What is your name?', gloss: ['what', 'be', 'your', 'name'], category: 'question' },
      { id: 'e16', english: 'My name is...', gloss: ['my', 'name', 'be'], category: 'response' },
      { id: 'e17', english: 'Friend', gloss: ['friend'], category: 'noun' },
      { id: 'e18', english: 'Family', gloss: ['family'], category: 'noun' },
      { id: 'e19', english: 'Love', gloss: ['love'], category: 'noun' },
      { id: 'e20', english: 'Home', gloss: ['home'], category: 'noun' },
    ],
  },
  {
    id: 'fantasy',
    name: 'Fantasy Dialogue',
    description: 'Phrases for fantasy worldbuilding and storytelling',
    phrases: [
      { id: 'f1', english: 'The prophecy speaks', gloss: ['the', 'prophecy', 'speak'], category: 'mystical' },
      { id: 'f2', english: 'By the ancient gods', gloss: ['by', 'the', 'ancient', 'god'], category: 'oath' },
      { id: 'f3', english: 'You shall not pass', gloss: ['you', 'shall', 'not', 'pass'], category: 'command' },
      { id: 'f4', english: 'The darkness comes', gloss: ['the', 'darkness', 'come'], category: 'warning' },
      { id: 'f5', english: 'Light will prevail', gloss: ['light', 'will', 'prevail'], category: 'hope' },
      { id: 'f6', english: 'Summon the council', gloss: ['summon', 'the', 'council'], category: 'command' },
      { id: 'f7', english: 'The kingdom is lost', gloss: ['the', 'kingdom', 'be', 'lost'], category: 'lament' },
      { id: 'f8', english: 'Rise, chosen one', gloss: ['rise', 'chosen', 'one'], category: 'command' },
      { id: 'f9', english: 'Magic flows within', gloss: ['magic', 'flow', 'within'], category: 'mystical' },
      { id: 'f10', english: 'The dragon awakens', gloss: ['the', 'dragon', 'awaken'], category: 'event' },
      { id: 'f11', english: 'Warrior', gloss: ['warrior'], category: 'noun' },
      { id: 'f12', english: 'Sword', gloss: ['sword'], category: 'noun' },
      { id: 'f13', english: 'Shield', gloss: ['shield'], category: 'noun' },
      { id: 'f14', english: 'Castle', gloss: ['castle'], category: 'noun' },
      { id: 'f15', english: 'Forest', gloss: ['forest'], category: 'noun' },
      { id: 'f16', english: 'Mountain', gloss: ['mountain'], category: 'noun' },
      { id: 'f17', english: 'River', gloss: ['river'], category: 'noun' },
      { id: 'f18', english: 'Fire', gloss: ['fire'], category: 'noun' },
      { id: 'f19', english: 'Ice', gloss: ['ice'], category: 'noun' },
      { id: 'f20', english: 'Death', gloss: ['death'], category: 'noun' },
    ],
  },
  {
    id: 'scifi',
    name: 'Sci-Fi Ops',
    description: 'Military and space operations terminology',
    phrases: [
      { id: 's1', english: 'Engage hyperdrive', gloss: ['engage', 'hyperdrive'], category: 'command' },
      { id: 's2', english: 'Shields up', gloss: ['shield', 'up'], category: 'command' },
      { id: 's3', english: 'All systems nominal', gloss: ['all', 'system', 'nominal'], category: 'status' },
      { id: 's4', english: 'Enemy detected', gloss: ['enemy', 'detect'], category: 'alert' },
      { id: 's5', english: 'Prepare for jump', gloss: ['prepare', 'for', 'jump'], category: 'command' },
      { id: 's6', english: 'Mission complete', gloss: ['mission', 'complete'], category: 'status' },
      { id: 's7', english: 'Coordinates locked', gloss: ['coordinate', 'lock'], category: 'status' },
      { id: 's8', english: 'Initiating scan', gloss: ['initiate', 'scan'], category: 'action' },
      { id: 's9', english: 'Hull breach', gloss: ['hull', 'breach'], category: 'alert' },
      { id: 's10', english: 'Life support stable', gloss: ['life', 'support', 'stable'], category: 'status' },
      { id: 's11', english: 'Ship', gloss: ['ship'], category: 'noun' },
      { id: 's12', english: 'Star', gloss: ['star'], category: 'noun' },
      { id: 's13', english: 'Planet', gloss: ['planet'], category: 'noun' },
      { id: 's14', english: 'Moon', gloss: ['moon'], category: 'noun' },
      { id: 's15', english: 'Crew', gloss: ['crew'], category: 'noun' },
      { id: 's16', english: 'Captain', gloss: ['captain'], category: 'noun' },
      { id: 's17', english: 'Weapon', gloss: ['weapon'], category: 'noun' },
      { id: 's18', english: 'Engine', gloss: ['engine'], category: 'noun' },
      { id: 's19', english: 'Fuel', gloss: ['fuel'], category: 'noun' },
      { id: 's20', english: 'Alien', gloss: ['alien'], category: 'noun' },
    ],
  },
]

export interface RenderedWord {
  gloss: string
  phonemic: string | null
  orthographic: string | null
  isGenerated: boolean // true if word was auto-generated (not from lexicon)
  grammaticalInfo?: {
    role?: 'subject' | 'verb' | 'object' | 'adjective' | 'adverb' | 'other'
    affixesApplied?: string[]
  }
}

export interface RenderedPhrase {
  phrase: Phrase
  words: RenderedWord[]
  missingGlosses: string[]
}

// Enhanced phrase pack with grammatical structure
export interface GrammaticalPhrase {
  id: string
  english: string
  structure: Array<{
    gloss: string
    role: 'S' | 'V' | 'O' | 'ADJ' | 'ADV' | 'DET' | 'PREP' | 'OTHER'
    tense?: 'past' | 'present' | 'future'
    number?: 'singular' | 'plural'
    person?: '1st' | '2nd' | '3rd'
    case?: 'nominative' | 'accusative' | 'dative' | 'genitive'
  }>
  category: string
}

// Sample grammatical phrases for testing morphology
export const GRAMMATICAL_PHRASES: GrammaticalPhrase[] = [
  {
    id: 'g1',
    english: 'The cat sees the dog',
    structure: [
      { gloss: 'the', role: 'DET' },
      { gloss: 'cat', role: 'S', number: 'singular', case: 'nominative' },
      { gloss: 'see', role: 'V', tense: 'present', person: '3rd', number: 'singular' },
      { gloss: 'the', role: 'DET' },
      { gloss: 'dog', role: 'O', number: 'singular', case: 'accusative' },
    ],
    category: 'basic'
  },
  {
    id: 'g2',
    english: 'I ate the food',
    structure: [
      { gloss: 'I', role: 'S', person: '1st', number: 'singular', case: 'nominative' },
      { gloss: 'eat', role: 'V', tense: 'past', person: '1st', number: 'singular' },
      { gloss: 'the', role: 'DET' },
      { gloss: 'food', role: 'O', number: 'singular', case: 'accusative' },
    ],
    category: 'basic'
  },
  {
    id: 'g3',
    english: 'The warriors will fight',
    structure: [
      { gloss: 'the', role: 'DET' },
      { gloss: 'warrior', role: 'S', number: 'plural', case: 'nominative' },
      { gloss: 'fight', role: 'V', tense: 'future', person: '3rd', number: 'plural' },
    ],
    category: 'fantasy'
  },
  {
    id: 'g4',
    english: 'You speak to the king',
    structure: [
      { gloss: 'you', role: 'S', person: '2nd', number: 'singular', case: 'nominative' },
      { gloss: 'speak', role: 'V', tense: 'present', person: '2nd', number: 'singular' },
      { gloss: 'to', role: 'PREP' },
      { gloss: 'the', role: 'DET' },
      { gloss: 'king', role: 'O', number: 'singular', case: 'dative' },
    ],
    category: 'formal'
  },
  {
    id: 'g5',
    english: 'The big house stands',
    structure: [
      { gloss: 'the', role: 'DET' },
      { gloss: 'big', role: 'ADJ' },
      { gloss: 'house', role: 'S', number: 'singular', case: 'nominative' },
      { gloss: 'stand', role: 'V', tense: 'present', person: '3rd', number: 'singular' },
    ],
    category: 'descriptive'
  }
]

