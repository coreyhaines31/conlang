import { Phonology, SyllableTemplate } from './generator'

export interface PhonologyPreset {
  name: string
  description: string
  phonology: Phonology
  phonotactics: {
    syllableTemplates: SyllableTemplate[]
    forbiddenSequences: string[]
  }
}

export const PHONOLOGY_PRESETS: PhonologyPreset[] = [
  {
    name: 'Balanced',
    description: 'A balanced mix of sounds, similar to many natural languages',
    phonology: {
      consonants: ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'l', 'r'],
      vowels: ['a', 'e', 'i', 'o', 'u'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CV', weight: 3 },
        { template: 'CVC', weight: 2 },
        { template: 'V', weight: 1 },
      ],
      forbiddenSequences: [],
    },
  },
  {
    name: 'Airy',
    description: 'Soft, flowing sounds with lots of vowels and liquids',
    phonology: {
      consonants: ['l', 'r', 'n', 'm', 'w', 'y', 'h', 's', 'f', 'v'],
      vowels: ['a', 'e', 'i', 'o', 'u', 'ai', 'ei', 'ao'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'V', weight: 2 },
        { template: 'CV', weight: 3 },
        { template: 'CVV', weight: 2 },
        { template: 'VCV', weight: 1 },
      ],
      forbiddenSequences: ['ss', 'ff'],
    },
  },
  {
    name: 'Harsh',
    description: 'Hard consonants and sharp sounds, guttural feel',
    phonology: {
      consonants: ['k', 'g', 'x', 'q', 't', 'd', 'r', 'z', 'sh', 'ch', 'kr', 'gr'],
      vowels: ['a', 'o', 'u', 'e'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CVC', weight: 3 },
        { template: 'CVCC', weight: 2 },
        { template: 'CCVC', weight: 2 },
      ],
      forbiddenSequences: ['ii', 'ee'],
    },
  },
  {
    name: 'Alien',
    description: 'Unusual combinations, clicks and glottal sounds',
    phonology: {
      consonants: ["'", 'x', 'q', 'kh', 'zh', 'tl', 'ts', 'ng', 'th', 'dh'],
      vowels: ['a', 'i', 'u', 'aa', 'ii', 'uu'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CV', weight: 2 },
        { template: 'CVC', weight: 2 },
        { template: 'VCV', weight: 1 },
        { template: 'CVCV', weight: 1 },
      ],
      forbiddenSequences: ["''", 'khkh'],
    },
  },
  {
    name: 'Elvish',
    description: 'Melodic and elegant, inspired by Tolkien',
    phonology: {
      consonants: ['l', 'r', 'n', 'm', 'th', 'dh', 's', 'nd', 'ng', 'v', 'f', 'w'],
      vowels: ['a', 'e', 'i', 'o', 'u', 'ae', 'ai', 'au'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CV', weight: 3 },
        { template: 'CVC', weight: 2 },
        { template: 'V', weight: 2 },
        { template: 'VC', weight: 1 },
      ],
      forbiddenSequences: ['ss', 'thth'],
    },
  },
  {
    name: 'Orcish',
    description: 'Brutal and guttural, warlike feel',
    phonology: {
      consonants: ['g', 'k', 'r', 'z', 'sh', 'gh', 'kh', 'b', 'd', 'gr', 'kr', 'zg'],
      vowels: ['a', 'o', 'u', 'oo'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CVC', weight: 3 },
        { template: 'CVCC', weight: 2 },
        { template: 'CCVC', weight: 2 },
        { template: 'CCV', weight: 1 },
      ],
      forbiddenSequences: ['ee', 'ii'],
    },
  },
  {
    name: 'Japanese-like',
    description: 'Simple CV structure, no consonant clusters',
    phonology: {
      consonants: ['k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w', 'sh', 'ch', 'ts'],
      vowels: ['a', 'i', 'u', 'e', 'o'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CV', weight: 4 },
        { template: 'V', weight: 1 },
      ],
      forbiddenSequences: ['ti', 'tu', 'si', 'hu'],
    },
  },
  {
    name: 'Arabic-like',
    description: 'Emphatic consonants and rich vowel system',
    phonology: {
      consonants: ['b', 't', 'th', 'j', 'h', 'kh', 'd', 'dh', 'r', 'z', 's', 'sh', 'q', 'k', 'l', 'm', 'n', 'w', 'y'],
      vowels: ['a', 'i', 'u', 'aa', 'ii', 'uu'],
    },
    phonotactics: {
      syllableTemplates: [
        { template: 'CV', weight: 2 },
        { template: 'CVC', weight: 3 },
        { template: 'CVVC', weight: 1 },
        { template: 'CVCC', weight: 1 },
      ],
      forbiddenSequences: [],
    },
  },
]

export const SYLLABLE_TEMPLATE_PRESETS = [
  { template: 'V', description: 'Vowel only (a, e, i)' },
  { template: 'CV', description: 'Consonant + Vowel (ka, te, mo)' },
  { template: 'VC', description: 'Vowel + Consonant (an, el, is)' },
  { template: 'CVC', description: 'Consonant + Vowel + Consonant (kan, tel, mos)' },
  { template: 'CVV', description: 'Consonant + two Vowels (kae, tei, moa)' },
  { template: 'CCV', description: 'Consonant cluster + Vowel (sta, kri, bla)' },
  { template: 'CVCC', description: 'Consonant + Vowel + cluster (kant, telp, most)' },
  { template: 'CCVC', description: 'Cluster + Vowel + Consonant (stan, kril, blan)' },
]
