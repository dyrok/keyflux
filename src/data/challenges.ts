export interface Challenge {
  id: string
  title: string
  category: 'prose' | 'quote' | 'code' | 'pangram' | 'numbers' | 'punctuation'
  text: string
}

// Curated sample texts. Kept punctuation-light where appropriate so QWERTY-OS
// users can also type Dvorak/Colemak comfortably in simulate mode.
export const CHALLENGES: Challenge[] = [
  {
    id: 'pangram-fox',
    title: 'The Quick Fox',
    category: 'pangram',
    text: 'the quick brown fox jumps over the lazy dog while five wizards vex the calm jury at dawn',
  },
  {
    id: 'prose-signal',
    title: 'Signal & Noise',
    category: 'prose',
    text: 'precision is a habit built one keystroke at a time you do not rise to the level of your goals you fall to the level of your systems so make the system quiet calm and exact',
  },
  {
    id: 'prose-craft',
    title: 'On Craft',
    category: 'prose',
    text: 'good tools disappear in the hand the moment you notice the tool the work has already stopped a keyboard should feel like an extension of thought fast certain and forgettable',
  },
  {
    id: 'quote-feynman',
    title: 'Feynman',
    category: 'quote',
    text: 'the first principle is that you must not fool yourself and you are the easiest person to fool',
  },
  {
    id: 'quote-saint-exupery',
    title: 'Perfection',
    category: 'quote',
    text: 'perfection is achieved not when there is nothing more to add but when there is nothing left to take away',
  },
  {
    id: 'code-react',
    title: 'React Hook',
    category: 'code',
    text: 'const [count, setCount] = useState(0); useEffect(() => { document.title = `count: ${count}`; }, [count]);',
  },
  {
    id: 'code-ts',
    title: 'TypeScript',
    category: 'code',
    text: 'export function clamp(x: number, lo = 0, hi = 1): number { return x < lo ? lo : x > hi ? hi : x; }',
  },
  {
    id: 'numbers-grid',
    title: 'Number Drill',
    category: 'numbers',
    text: '4827 1930 5648 2071 9304 6815 7259 0473 3186 5920 8461 2738 1095 6402 7843 5176',
  },
  {
    id: 'punct-symbols',
    title: 'Symbol Run',
    category: 'punctuation',
    text: 'why? because @ 3:45 it cost $50 (plus 8% tax) — a fair deal, right? {yes}; [done] = true!',
  },
  {
    id: 'prose-rhythm',
    title: 'Rhythm',
    category: 'prose',
    text: 'find the rhythm not the rush smooth is fast and fast is smooth let the words flow like water over stone steady even and unhurried until the page is done',
  },
]

export const DEFAULT_CHALLENGE_ID = 'pangram-fox'

/** A small word pool for the timed / word-count test modes. */
export const WORD_POOL =
  'the of and a to in is you that it he was for on are as with his they at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part over new sound take only little work know place year live me back give most very after thing our just name good sentence man think say great where help through much before line right too mean old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home us move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should world'
    .split(' ')

export function buildWordChallenge(count: number, seed = 1): string {
  // deterministic pseudo-random selection (no Date/Math.random reliance for reproducibility)
  const pool = WORD_POOL
  let s = seed * 2654435761
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(pool[Math.floor(next() * pool.length)])
  return out.join(' ')
}
