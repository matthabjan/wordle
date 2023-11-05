export const GAME_TITLE = process.env.REACT_APP_GAME_NAME!

export const WIN_MESSAGES = [
  'Gut gemacht!',
  'Super!',
  'Geiles Gehirn, Günter!',
  'Mega',
  'Stark',
  'Voll gut ey',
  'Du scheinst kluk zu sein',
  'Weiter so',
  'Toll!',
  'Darauf eine Scheibe Vollkornbrot!',
  'So muss die Baklava schmecken',
  'Stabile Leistung',
]
export const GAME_COPIED_MESSAGE = 'Spielverlauf kopiert'
export const ABOUT_GAME_MESSAGE = 'Über Wörtchen'
export const NOT_ENOUGH_LETTERS_MESSAGE = 'Nicht genug Buchstaben'
export const WORD_NOT_FOUND_MESSAGE = 'Wort nicht gefunden'
export const HARD_MODE_ALERT_MESSAGE =
  'Der schwere Modus kann nur am Anfang eines Spiels aktiviert werden'
export const CORRECT_WORD_MESSAGE = (solution: string) =>
  `Das gesuchte Wort war ${solution}`
export const WRONG_SPOT_MESSAGE = (guess: string, position: number) =>
  `Buchstabe ${guess} muss an Position ${position} verwendet werden`
export const NOT_CONTAINED_MESSAGE = (letter: string) =>
  `Buchstabe ${letter} muss verwendet werden`
export const ENTER_TEXT = 'Eingabe'
export const DELETE_TEXT = 'Löschen'
export const STATISTICS_TITLE = 'Statistik'
export const GUESS_DISTRIBUTION_TEXT = 'Versuchsverteilung'
export const NEW_WORD_TEXT = 'Neues Wort in'
export const SHARE_TEXT = 'Spielverlauf kopieren'
export const TOTAL_TRIES_TEXT = 'Spiele gesamt'
export const SUCCESS_RATE_TEXT = 'Spiele gewonnen'
export const CURRENT_STREAK_TEXT = 'Aktuelle Gewinnserie'
export const BEST_STREAK_TEXT = 'Längste Gewinnserie'
