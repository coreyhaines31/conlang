import { Phonology, Phonotactics } from './generator'

export interface PhonologyPreset {
  name: string
  description: string
  phonology: Phonology
  phonotactics: Phonotactics
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
      syllableTemplates: ['CV', 'CVC', 'V'],
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
      syllableTemplates: ['V', 'CV', 'CVV', 'VCV'],
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
      syllableTemplates: ['CVC', 'CVCC', 'CCVC'],
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
      syllableTemplates: ['CV', 'CVC', 'VCV', 'CVCV'],
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
      syllableTemplates: ['CV', 'CVC', 'V', 'VC'],
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
      syllableTemplates: ['CVC', 'CVCC', 'CCVC', 'CCV'],
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
      syllableTemplates: ['CV', 'V'],
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
      syllableTemplates: ['CV', 'CVC', 'CVVC', 'CVCC'],
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

