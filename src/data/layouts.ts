import type { Finger, Hand, KeyDef, KeyboardLayout, LayoutId } from '../types'

// ============================================================================
// Physical keyboard model (ANSI). Keys are addressed by event.code, which is
// layout-independent — so finger/hand/geometry are defined ONCE here. Dvorak and
// Colemak only remap the produced glyphs (base/shifted) per code.
// ============================================================================

interface PhysKey {
  code: string
  w?: number // cap width in units (1 = standard)
  finger: Finger
  isModifier?: boolean
  noType?: boolean
  label?: string // explicit non-glyph label (modifiers, space, etc.)
}

const handOf = (f: Finger): Hand => (f.startsWith('r-') ? 'right' : f === 'thumb' ? 'left' : 'left')

// Logical rows. Row 0 = number row … row 4 = spacebar row.
const PHYSICAL_ROWS: { label: string; keys: PhysKey[] }[] = [
  {
    label: 'R0',
    keys: [
      { code: 'Backquote', finger: 'l-pinky' },
      { code: 'Digit1', finger: 'l-pinky' },
      { code: 'Digit2', finger: 'l-ring' },
      { code: 'Digit3', finger: 'l-middle' },
      { code: 'Digit4', finger: 'l-index' },
      { code: 'Digit5', finger: 'l-index' },
      { code: 'Digit6', finger: 'r-index' },
      { code: 'Digit7', finger: 'r-index' },
      { code: 'Digit8', finger: 'r-middle' },
      { code: 'Digit9', finger: 'r-ring' },
      { code: 'Digit0', finger: 'r-pinky' },
      { code: 'Minus', finger: 'r-pinky' },
      { code: 'Equal', finger: 'r-pinky' },
      { code: 'Backspace', w: 2, finger: 'r-pinky', noType: true, label: '⌫' },
    ],
  },
  {
    label: 'R1',
    keys: [
      { code: 'Tab', w: 1.5, finger: 'l-pinky', noType: true, label: 'tab' },
      { code: 'KeyQ', finger: 'l-pinky' },
      { code: 'KeyW', finger: 'l-ring' },
      { code: 'KeyE', finger: 'l-middle' },
      { code: 'KeyR', finger: 'l-index' },
      { code: 'KeyT', finger: 'l-index' },
      { code: 'KeyY', finger: 'r-index' },
      { code: 'KeyU', finger: 'r-index' },
      { code: 'KeyI', finger: 'r-middle' },
      { code: 'KeyO', finger: 'r-ring' },
      { code: 'KeyP', finger: 'r-pinky' },
      { code: 'BracketLeft', finger: 'r-pinky' },
      { code: 'BracketRight', finger: 'r-pinky' },
      { code: 'Backslash', w: 1.5, finger: 'r-pinky' },
    ],
  },
  {
    label: 'R2',
    keys: [
      { code: 'CapsLock', w: 1.75, finger: 'l-pinky', noType: true, isModifier: true, label: 'caps' },
      { code: 'KeyA', finger: 'l-pinky' },
      { code: 'KeyS', finger: 'l-ring' },
      { code: 'KeyD', finger: 'l-middle' },
      { code: 'KeyF', finger: 'l-index' },
      { code: 'KeyG', finger: 'l-index' },
      { code: 'KeyH', finger: 'r-index' },
      { code: 'KeyJ', finger: 'r-index' },
      { code: 'KeyK', finger: 'r-middle' },
      { code: 'KeyL', finger: 'r-ring' },
      { code: 'Semicolon', finger: 'r-pinky' },
      { code: 'Quote', finger: 'r-pinky' },
      { code: 'Enter', w: 2.25, finger: 'r-pinky', noType: true, label: '⏎' },
    ],
  },
  {
    label: 'R3',
    keys: [
      { code: 'ShiftLeft', w: 2.25, finger: 'l-pinky', noType: true, isModifier: true, label: 'shift' },
      { code: 'KeyZ', finger: 'l-pinky' },
      { code: 'KeyX', finger: 'l-ring' },
      { code: 'KeyC', finger: 'l-middle' },
      { code: 'KeyV', finger: 'l-index' },
      { code: 'KeyB', finger: 'l-index' },
      { code: 'KeyN', finger: 'r-index' },
      { code: 'KeyM', finger: 'r-index' },
      { code: 'Comma', finger: 'r-middle' },
      { code: 'Period', finger: 'r-ring' },
      { code: 'Slash', finger: 'r-pinky' },
      { code: 'ShiftRight', w: 2.75, finger: 'r-pinky', noType: true, isModifier: true, label: 'shift' },
    ],
  },
  {
    label: 'R4',
    keys: [
      { code: 'ControlLeft', w: 1.5, finger: 'l-pinky', noType: true, isModifier: true, label: 'ctrl' },
      { code: 'AltLeft', w: 1.25, finger: 'thumb', noType: true, isModifier: true, label: 'alt' },
      { code: 'MetaLeft', w: 1.25, finger: 'thumb', noType: true, isModifier: true, label: '⌘' },
      { code: 'Space', w: 7, finger: 'thumb', label: 'space' },
      { code: 'MetaRight', w: 1.25, finger: 'thumb', noType: true, isModifier: true, label: '⌘' },
      { code: 'AltRight', w: 1.25, finger: 'thumb', noType: true, isModifier: true, label: 'alt' },
      { code: 'ControlRight', w: 1.5, finger: 'r-pinky', noType: true, isModifier: true, label: 'ctrl' },
    ],
  },
]

// ----------------------------------------------------------------------------
// Glyph maps: code -> [base, shifted]
// ----------------------------------------------------------------------------
type GlyphMap = Record<string, [string, string]>

const QWERTY_GLYPHS: GlyphMap = {
  Backquote: ['`', '~'],
  Digit1: ['1', '!'],
  Digit2: ['2', '@'],
  Digit3: ['3', '#'],
  Digit4: ['4', '$'],
  Digit5: ['5', '%'],
  Digit6: ['6', '^'],
  Digit7: ['7', '&'],
  Digit8: ['8', '*'],
  Digit9: ['9', '('],
  Digit0: ['0', ')'],
  Minus: ['-', '_'],
  Equal: ['=', '+'],
  KeyQ: ['q', 'Q'],
  KeyW: ['w', 'W'],
  KeyE: ['e', 'E'],
  KeyR: ['r', 'R'],
  KeyT: ['t', 'T'],
  KeyY: ['y', 'Y'],
  KeyU: ['u', 'U'],
  KeyI: ['i', 'I'],
  KeyO: ['o', 'O'],
  KeyP: ['p', 'P'],
  BracketLeft: ['[', '{'],
  BracketRight: [']', '}'],
  Backslash: ['\\', '|'],
  KeyA: ['a', 'A'],
  KeyS: ['s', 'S'],
  KeyD: ['d', 'D'],
  KeyF: ['f', 'F'],
  KeyG: ['g', 'G'],
  KeyH: ['h', 'H'],
  KeyJ: ['j', 'J'],
  KeyK: ['k', 'K'],
  KeyL: ['l', 'L'],
  Semicolon: [';', ':'],
  Quote: ["'", '"'],
  KeyZ: ['z', 'Z'],
  KeyX: ['x', 'X'],
  KeyC: ['c', 'C'],
  KeyV: ['v', 'V'],
  KeyB: ['b', 'B'],
  KeyN: ['n', 'N'],
  KeyM: ['m', 'M'],
  Comma: [',', '<'],
  Period: ['.', '>'],
  Slash: ['/', '?'],
  Space: [' ', ' '],
}

// Dvorak: remap alpha/punct positions; digits stay, brackets move.
const DVORAK_OVERRIDES: GlyphMap = {
  Minus: ['[', '{'],
  Equal: [']', '}'],
  KeyQ: ["'", '"'],
  KeyW: [',', '<'],
  KeyE: ['.', '>'],
  KeyR: ['p', 'P'],
  KeyT: ['y', 'Y'],
  KeyY: ['f', 'F'],
  KeyU: ['g', 'G'],
  KeyI: ['c', 'C'],
  KeyO: ['r', 'R'],
  KeyP: ['l', 'L'],
  BracketLeft: ['/', '?'],
  BracketRight: ['=', '+'],
  KeyA: ['a', 'A'],
  KeyS: ['o', 'O'],
  KeyD: ['e', 'E'],
  KeyF: ['u', 'U'],
  KeyG: ['i', 'I'],
  KeyH: ['d', 'D'],
  KeyJ: ['h', 'H'],
  KeyK: ['t', 'T'],
  KeyL: ['n', 'N'],
  Semicolon: ['s', 'S'],
  Quote: ['-', '_'],
  KeyZ: [';', ':'],
  KeyX: ['q', 'Q'],
  KeyC: ['j', 'J'],
  KeyV: ['k', 'K'],
  KeyB: ['x', 'X'],
  KeyN: ['b', 'B'],
  KeyM: ['m', 'M'],
  Comma: ['w', 'W'],
  Period: ['v', 'V'],
  Slash: ['z', 'Z'],
}

// Colemak: remap alpha positions; punctuation mostly unchanged.
const COLEMAK_OVERRIDES: GlyphMap = {
  KeyE: ['f', 'F'],
  KeyR: ['p', 'P'],
  KeyT: ['g', 'G'],
  KeyY: ['j', 'J'],
  KeyU: ['l', 'L'],
  KeyI: ['u', 'U'],
  KeyO: ['y', 'Y'],
  KeyP: [';', ':'],
  KeyS: ['r', 'R'],
  KeyD: ['s', 'S'],
  KeyF: ['t', 'T'],
  KeyG: ['d', 'D'],
  KeyJ: ['n', 'N'],
  KeyK: ['e', 'E'],
  KeyL: ['i', 'I'],
  Semicolon: ['o', 'O'],
  KeyN: ['k', 'K'],
}

function buildLayout(id: LayoutId, name: string, overrides: GlyphMap): KeyboardLayout {
  const glyphs: GlyphMap = { ...QWERTY_GLYPHS, ...overrides }
  return {
    id,
    name,
    rows: PHYSICAL_ROWS.map((row) => ({
      label: row.label,
      keys: row.keys.map<KeyDef>((pk) => {
        const g = glyphs[pk.code]
        const base = g?.[0] ?? ''
        const shifted = g?.[1] ?? ''
        return {
          code: pk.code,
          base,
          shifted,
          label: pk.label,
          w: pk.w ?? 1,
          isModifier: pk.isModifier,
          noType: pk.noType,
          finger: pk.finger,
          hand: handOf(pk.finger),
          row: PHYSICAL_ROWS.indexOf(row),
        }
      }),
    })),
  }
}

export const LAYOUTS: Record<LayoutId, KeyboardLayout> = {
  qwerty: buildLayout('qwerty', 'QWERTY', {}),
  dvorak: buildLayout('dvorak', 'Dvorak', DVORAK_OVERRIDES),
  colemak: buildLayout('colemak', 'Colemak', COLEMAK_OVERRIDES),
}

export const LAYOUT_IDS: LayoutId[] = ['qwerty', 'dvorak', 'colemak']

/** Flat code -> KeyDef index for the active layout (press lookup, simulate). */
export function indexLayout(layout: KeyboardLayout): Map<string, KeyDef> {
  const m = new Map<string, KeyDef>()
  for (const row of layout.rows) for (const k of row.keys) m.set(k.code, k)
  return m
}

/**
 * Resolve the character a key produces under a given layout.
 * Used by simulate mode: maps physical event.code -> layout glyph (shift-aware).
 */
export function glyphFor(code: string, layout: KeyboardLayout, shift: boolean): string | null {
  for (const row of layout.rows) {
    for (const k of row.keys) {
      if (k.code === code) {
        if (k.noType) return code === 'Space' ? ' ' : null
        return shift ? k.shifted : k.base
      }
    }
  }
  return null
}
