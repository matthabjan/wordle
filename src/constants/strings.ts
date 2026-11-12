export const GAME_TITLE = import.meta.env.VITE_GAME_NAME || 'Wordle'
// Major.minor only, so patch releases don't change the edition line
export const GAME_EDITION_TEXT = `German Edition ${__APP_VERSION__
  .split('.')
  .slice(0, 2)
  .join('.')}`

const puzzleDateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: 'numeric',
  month: 'short',
})
// `isoDate` is the local YYYY-MM-DD of the puzzle
export const PUZZLE_LABEL = (solutionIndex: number, isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  return `Nr. ${solutionIndex} · ${puzzleDateFormatter.format(
    new Date(year, month - 1, day),
  )}`
}

// One list per number of guesses needed (1 to 6), from stunned to relieved.
// Kept to WIN_MESSAGE_MAX_LENGTH characters so the result headline stays on
// one line on small phones.
export const WIN_MESSAGE_MAX_LENGTH = 16
export const WIN_MESSAGES = [
  ['Volltreffer!', 'Unglaublich!', 'Hellseher?', 'Genial!'],
  ['Überragend!', 'Meisterhaft!', 'Ganz stark!', 'Mega!'],
  ['Stark!', 'Super!', 'Richtig gut!', 'Prima!'],
  ['Gut gemacht!', 'Voll gut!', 'Stabile Leistung', 'Sauber!'],
  ['Geschafft!', 'Weiter so!', 'Nicht schlecht!', 'Passt schon!'],
  ['Knapp geschafft!', 'Puh, geschafft!', 'Gerade noch!', 'Das war knapp!'],
]
// The same phrase every time a finished game is looked at again
export const WIN_MESSAGE = (solutionIndex: number, guessCount: number) => {
  const phrases =
    WIN_MESSAGES[Math.min(Math.max(guessCount, 1), WIN_MESSAGES.length) - 1]
  return phrases[solutionIndex % phrases.length]
}
export const GAME_COPIED_MESSAGE = 'Spielverlauf kopiert'
export const SHARE_FAILED_MESSAGE = 'Teilen fehlgeschlagen'
export const UPDATE_AVAILABLE_MESSAGE = 'Update verfügbar – neu laden'
export const ABOUT_GAME_MESSAGE = 'Über Wordle'
export const NOT_ENOUGH_LETTERS_MESSAGE = 'Nicht genug Buchstaben'
export const WORD_NOT_FOUND_MESSAGE = 'Wort nicht gefunden'
export const HARD_MODE_ALERT_MESSAGE =
  'Der schwere Modus kann nur am Anfang eines Spiels aktiviert werden'
export const CORRECT_WORD_INTRO = 'Das gesuchte Wort war'
export const WRONG_SPOT_MESSAGE = (guess: string, position: number) =>
  `Buchstabe ${guess} muss an Position ${position} verwendet werden`
export const NOT_CONTAINED_MESSAGE = (letter: string) =>
  `Buchstabe ${letter} muss verwendet werden`
export const ENTER_TEXT = 'Eingabe'
export const DELETE_TEXT = 'Löschen'
export const STATISTICS_TITLE = 'Statistik'
export const RESULT_TAB_TEXT = 'Ergebnis'
export const RESULT_WON_TEXT = (guessCount: number) =>
  `Gelöst in ${guessCount} ${guessCount === 1 ? 'Versuch' : 'Versuchen'}`
export const NO_STATS_TEXT = 'Noch keine Spiele gespielt.'
export const GUESS_GRID_LABEL = (guessCount: number) =>
  `Spielverlauf, ${guessCount} ${guessCount === 1 ? 'Versuch' : 'Versuche'}`
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
export const LEADERBOARD_ARCHIVE_TAB_TEXT = 'Archiv'
export const LEADERBOARD_ALL_TIME_TITLE = 'Ewige Tabelle'
export const LEADERBOARD_ARCHIVE_EMPTY_TEXT =
  'Noch keine abgeschlossenen Runden.'
export const LEADERBOARD_BACK_TEXT = 'Zurück'
export const LEADERBOARD_NEW_ROUND_TEXT = 'Neue Runde seit 1. Januar'
// `names` are the round's first three players, best first
export const LEADERBOARD_ROUND_WINNER_TEXT = (
  round: string,
  names: string[],
) => {
  const [winner, second, third] = names
  const runnersUp = [second, third].filter(Boolean).join(' und ')
  return `${round}: ${winner} gewinnt${runnersUp ? ` vor ${runnersUp}` : ''}`
}
export const LEADERBOARD_LOADING_TEXT = 'Bestenliste wird geladen'
export const LEADERBOARD_SIGNED_IN_AS = (name: string) =>
  `Angemeldet als ${name}`
export const LEADERBOARD_LEAVE_TEXT = 'Abmelden'
export const LEADERBOARD_LEAVE_CONFIRM_TEXT =
  'Name und Passwort werden auf diesem Gerät gelöscht. Deine Ergebnisse bleiben in der Bestenliste.'
export const CANCEL_TEXT = 'Abbrechen'
export const LEADERBOARD_SETUP_INTRO =
  'Vergleiche dein Ergebnis mit anderen. Wer das Passwort kennt, kann mitmachen.'
export const LEADERBOARD_NAME_LABEL = 'Dein Name'
export const LEADERBOARD_PASSPHRASE_LABEL = 'Passwort'
export const LEADERBOARD_JOIN_BUTTON = 'Verbinden'
export const LEADERBOARD_JOINING_TEXT = 'Verbinde …'
export const LEADERBOARD_WRONG_PASSPHRASE_MESSAGE = 'Passwort falsch'
export const LEADERBOARD_MISSING_FIELDS_MESSAGE =
  'Bitte Name und Passwort eingeben'
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
