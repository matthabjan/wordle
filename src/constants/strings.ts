export const GAME_TITLE = import.meta.env.VITE_GAME_NAME || 'Wordle'

export const WIN_MESSAGES = [
  'Gut gemacht!',
  'Super!',
  'Mega',
  'Stark',
  'Voll gut',
  'Du scheinst klug zu sein',
  'Weiter so',
  'Toll!',
  'Darauf eine Scheibe Vollkornbrot!',
  'Gar nicht schlecht, Herr Specht',
  'Stabile Leistung',
  'Prima, ein Experte!',
]
export const GAME_COPIED_MESSAGE = 'Spielverlauf kopiert'
export const SHARE_FAILED_MESSAGE = 'Teilen fehlgeschlagen'
export const UPDATE_AVAILABLE_MESSAGE = 'Update verfügbar – neu laden'
export const ABOUT_GAME_MESSAGE = 'Über Wordle'
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
export const SHARE_TEXT = 'Teilen'
export const SHARE_SPOILER_TEXT = 'Mit Spoilern kopieren'
export const TOTAL_TRIES_TEXT = 'Spiele'
export const SUCCESS_RATE_TEXT = 'Gewonnen'
export const CURRENT_STREAK_TEXT = 'Serie'
export const BEST_STREAK_TEXT = 'Rekord'
export const EDIT_LETTER_LABEL = (position: number) =>
  `Buchstabe ${position} bearbeiten`
export const STATUS_CORRECT = 'richtig'
export const STATUS_PRESENT = 'an falscher Stelle'
export const STATUS_ABSENT = 'nicht enthalten'

export const LEADERBOARD_TITLE = 'Bestenliste'
export const LEADERBOARD_DAILY_TAB_TEXT = 'Heute'
export const LEADERBOARD_OVERALL_TAB_TEXT = 'Gesamt'
export const LEADERBOARD_SETUP_INTRO =
  'Vergleiche dein Ergebnis mit anderen. Wer das Passwort kennt, kann mitmachen.'
export const LEADERBOARD_NAME_LABEL = 'Dein Name'
export const LEADERBOARD_PASSPHRASE_LABEL = 'Passwort'
export const LEADERBOARD_JOIN_BUTTON = 'Verbinden'
export const LEADERBOARD_JOINING_TEXT = 'Verbinde …'
export const LEADERBOARD_WRONG_PASSPHRASE_MESSAGE = 'Passwort falsch'
export const LEADERBOARD_MISSING_FIELDS_MESSAGE =
  'Bitte Name und Passwort eingeben'
export const LEADERBOARD_CHANGE_IDENTITY_TEXT = 'Namen ändern'
export const LEADERBOARD_YOU_SUFFIX = '(Du)'
export const LEADERBOARD_LOST_LABEL = 'X/6'
export const LEADERBOARD_EMPTY_TEXT = 'Noch niemand hat heute gespielt.'
export const LEADERBOARD_OVERALL_EMPTY_TEXT =
  'Noch keine Gesamtergebnisse vorhanden.'
export const LEADERBOARD_POINTS_LABEL = 'Pkt.'
export const LEADERBOARD_GAMES_LABEL = 'Spiele'
export const LEADERBOARD_WINS_LABEL = 'Siege'
export const LEADERBOARD_AVERAGE_LABEL = 'Ø Versuche'
export const LEADERBOARD_UNAVAILABLE_TEXT =
  'Bestenliste derzeit nicht verfügbar.'
