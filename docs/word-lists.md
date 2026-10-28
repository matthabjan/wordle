# Word lists

← [README](../README.md) · [Development](development.md) · [Leaderboard](leaderboard.md) · [Deployment](../DOCKER.md)

The game uses two lists in `src/constants/`:

| File | Export | Entries | Role |
|---|---|---|---|
| `wordlist.ts` | `WORDS` | 882 | Daily solutions. **The order is the calendar.** |
| `validGuesses.ts` | `VALID_GUESSES` | 2,340 | Additional words accepted as guesses (sorted alphabetically) |

A guess is valid if it appears in **either** list, so a solution doesn't need to be repeated in `VALID_GUESSES`.

## Rules

These rules apply to both lists:

1. **Exactly five letters, `a`–`z`, lowercase.** No umlauts, ß, hyphens or spaces.
2. **Umlauts and ß are written out**: `ä → ae`, `ö → oe`, `ü → ue`, `ß → ss`. For example, *Höhe* is stored as `hoehe` and *Löss* as `loess`. Because of this, `hoehe` counts as five letters even though *Höhe* has four.
3. **No plurals.** This also covers words used only in the plural (e.g. *Leute*, *Alpen*) and plural forms that look like verbs (e.g. *Waren*, *Taten*). Words whose singular and plural are spelled the same, such as *Jeans*, are allowed.
4. **Real, standard German.** That means no invented words, no regional dialect or youth slang, and no English words that aren't established in German.
5. **Nothing offensive.** No slurs and no vulgar terms.
6. **No duplicates** within a list. Most solutions also appear in `VALID_GUESSES`, which is harmless.

These additional rules apply to solutions (`WORDS`):

- Use common words that most players know.
- Prefer nouns, adjectives and verb infinitives. Avoid conjugated verb forms.

Some technical, archaic and proper-noun entries remain in `VALID_GUESSES` on purpose. They are fine as guesses, but don't add them as solutions.

## The daily calendar

`getWordOfDay()` maps each date to an index: the number of days since `GAME_EPOCH` (9 February 2026). It then returns `WORDS[index % WORDS.length]`. As a result:

- **Replace solutions in place.** Inserting or deleting an entry shifts every later day, so all future words change.
- **Avoid changing today's word.** Players who have already played today would end up with a saved game that doesn't match the new solution. Deploy such changes after midnight instead.
- **Past words don't matter much**, but the list wraps around after 882 days, so they will come back.
- **Don't change `GAME_EPOCH`.** It reshuffles the entire calendar and misaligns leaderboard dates.

To find the index for a given date:

```bash
node -e "const e=new Date(2026,1,9),d=new Date('2026-10-28T12:00');console.log(Math.floor((d-e)/864e5))"
```

## Editing the lists

1. **Solutions:** edit `wordlist.ts` by replacing an entry in place, and keep the `Total words` header correct.
2. **Guesses:** edit `validGuesses.ts`, keep it sorted, and update the `Total words` header.
3. Check the result:

   ```bash
   node -e "
   const fs=require('fs'),r=f=>[...fs.readFileSync(f,'utf8').matchAll(/^  '([^']*)',$/gm)].map(m=>m[1]);
   const w=r('src/constants/wordlist.ts'),v=r('src/constants/validGuesses.ts');
   const bad=[...w,...v].filter(x=>!/^[a-z]{5}$/.test(x));
   console.log({solutions:w.length,guesses:v.length,bad,dupW:w.length-new Set(w).size,dupV:v.length-new Set(v).size});"
   ```

   `bad` must be empty and both `dup` counts must be 0.

4. Run `npm test`.

## Changing the word length

1. Set `MAX_WORD_LENGTH` in `src/constants/settings.ts`.
2. Replace both lists with words of the new length that follow the rules above.
3. Smoke-test the grid, keyboard, share text and hard mode.
