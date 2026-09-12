import { create } from 'zustand'
import { COLOR_PALETTES, type ColorPalette } from '@/lib/palettes'

const STORAGE_KEY = 'fixly-color-palette'

const OVERRIDE_PROPS = [
  '--primary',
  '--primary-foreground',
  '--ring',
  '--accent',
  '--accent-foreground',
  '--secondary',
  '--muted',
  '--border',
  '--input',
  '--background',
  '--card',
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--chart-6',
]

function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [parseInt(c.substring(0, 2), 16), parseInt(c.substring(2, 4), 16), parseInt(c.substring(4, 6), 16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Blends `hex` toward `towardHex`; ratio is how much of `towardHex` to mix in (0-1). */
function blend(hex: string, towardHex: string, ratio: number): string {
  const [r1, g1, b1] = hexToRgb(hex)
  const [r2, g2, b2] = hexToRgb(towardHex)
  const mix = (a: number, b: number) => a * (1 - ratio) + b * ratio
  return rgbToHex(mix(r1, r2), mix(g1, g2), mix(b1, b2))
}

function hexLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastText(hex: string): string {
  return hexLuminance(hex) > 0.45 ? '#1a1a1f' : '#fafafa'
}

// Approximate the design system's neutral background/card tones so tints blend
// consistently with whichever mode (light/dark) is currently active.
const LIGHT_BG = '#f9f9fb'
const LIGHT_CARD = '#ffffff'
const DARK_BG = '#1c1c22'
const DARK_CARD = '#232329'

function applyPalette(palette: ColorPalette) {
  const root = document.documentElement

  if (palette.id === 'standard') {
    OVERRIDE_PROPS.forEach((prop) => root.style.removeProperty(prop))
    return
  }

  const isDark = root.classList.contains('dark')
  const bg = isDark ? DARK_BG : LIGHT_BG
  const card = isDark ? DARK_CARD : LIGHT_CARD

  root.style.setProperty('--primary', palette.primary)
  root.style.setProperty('--primary-foreground', contrastText(palette.primary))
  root.style.setProperty('--ring', palette.primary)

  const accent = palette.swatches[1] ?? palette.primary
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-foreground', contrastText(accent))

  // Tint backgrounds, card surfaces, and chrome (borders/inputs/muted fills)
  // so the palette reads through the whole page, not just accent buttons.
  root.style.setProperty('--background', blend(palette.primary, bg, 0.94))
  root.style.setProperty('--card', blend(palette.primary, card, 0.97))
  root.style.setProperty('--secondary', blend(palette.primary, bg, 0.86))
  root.style.setProperty('--muted', blend(palette.primary, bg, 0.88))
  root.style.setProperty('--border', blend(palette.primary, bg, 0.75))
  root.style.setProperty('--input', blend(palette.primary, bg, 0.75))

  for (let i = 0; i < 6; i++) {
    root.style.setProperty(`--chart-${i + 1}`, palette.swatches[i % palette.swatches.length])
  }
}

function getInitialPalette(): ColorPalette {
  const storedId = localStorage.getItem(STORAGE_KEY)
  return COLOR_PALETTES.find((p) => p.id === storedId) ?? COLOR_PALETTES[0]
}

interface ColorPaletteState {
  palette: ColorPalette
  setPalette: (id: string) => void
  /** Re-applies the current palette's tints — call after the dark/light mode changes. */
  reapply: () => void
}

const initialPalette = getInitialPalette()
applyPalette(initialPalette)

export const useColorPaletteStore = create<ColorPaletteState>((set, get) => ({
  palette: initialPalette,
  setPalette: (id) => {
    const palette = COLOR_PALETTES.find((p) => p.id === id) ?? COLOR_PALETTES[0]
    applyPalette(palette)
    localStorage.setItem(STORAGE_KEY, id)
    set({ palette })
  },
  reapply: () => applyPalette(get().palette),
}))
