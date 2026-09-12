export interface ColorPalette {
  id: string
  name: string
  /** Main accent color used for buttons, active states, etc. */
  primary: string
  /** Full set of palette colors, used for category/chart colors (chart-1..6). */
  swatches: string[]
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'standard',
    name: 'Standard',
    primary: '#6d6ef6',
    swatches: ['#6d6ef6', '#4fb8c9', '#5fbf82', '#e3b23c', '#d1554a', '#a56bc9'],
  },
  {
    id: 'kuestenfelsen',
    name: 'Küstenfelsen',
    primary: '#933B5B',
    swatches: ['#933B5B', '#B5728A', '#AABAAE', '#E3D6BF', '#9F9679'],
  },
  {
    id: 'herbstflieder',
    name: 'Herbstflieder',
    primary: '#6A8CA9',
    swatches: ['#A67CA4', '#6A8CA9', '#857A9E', '#C9A9B8', '#CBD3D8'],
  },
  {
    id: 'sakura-cafe',
    name: 'Sakura-Café',
    primary: '#AA7F66',
    swatches: ['#443025', '#7F5836', '#AA7F66', '#EC9C9D', '#F6D9DA'],
  },
  {
    id: 'wunderland',
    name: 'Wunderland',
    primary: '#DD1440',
    swatches: ['#241929', '#5A4864', '#E5E6E1', '#F696B3', '#DD1440', '#840B2A'],
  },
  {
    id: 'juwelenpastell',
    name: 'Juwelenpastell',
    primary: '#3E828E',
    swatches: ['#FFEBED', '#F6B6B7', '#A6C9B6', '#3E828E', '#27153D'],
  },
  {
    id: 'kieselstrand',
    name: 'Kieselstrand',
    primary: '#42B1BB',
    swatches: ['#C1A4D4', '#F1A7AF', '#FB8244', '#F2AC39', '#AFC194', '#42B1BB'],
  },
  {
    id: 'vergissmeinnicht',
    name: 'Vergissmeinnicht',
    primary: '#478DFA',
    swatches: ['#60834D', '#FDF9B0', '#9F63C8', '#ADAFFD', '#96C4FE', '#478DFA'],
  },
  {
    id: 'heidelbeerfeld',
    name: 'Heidelbeerfeld',
    primary: '#3B4CCA',
    swatches: ['#3B4CCA', '#2B2D6E', '#6C7AE0', '#7BB662', '#FFF3E8'],
  },
  {
    id: 'libellenfluegel',
    name: 'Libellenflügel',
    primary: '#7872A5',
    swatches: ['#775B89', '#7872A5', '#9693D6', '#A3BBDB', '#B5D4C8', '#AEC891'],
  },
  {
    id: 'limonade',
    name: 'Limonade',
    primary: '#17A1CF',
    swatches: ['#17A1CF', '#81BAC2', '#F9FAFB', '#FADADA', '#E2837D', '#DD4350'],
  },
  {
    id: 'sonnenuntergang',
    name: 'Sonnenuntergang',
    primary: '#DF84BD',
    swatches: ['#34C8C5', '#DF84BD', '#FC8A8E', '#FFAE69', '#FEE09D', '#FDEEEA'],
  },
]
