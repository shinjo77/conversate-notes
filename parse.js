const STAMP = /^\d\d:\d\d [AP]M (\d{4})\/(\d\d)\/(\d\d)$/

// A Conversate export holds several parts in one file (요약, 힌트 목록, 음성 기록), each starting with
// "<title> - <part name>" followed by a timestamp line. Anything else is kept as one free-form note.
export function parseExport(text, today = new Date().toLocaleDateString('sv')) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const starts = lines.flatMap((l, i) => (i > 0 && STAMP.test(l.trim()) ? [i - 1] : []))
  if (!starts.length) {
    const body = text.trim()
    return { title: body.split('\n')[0].slice(0, 60), date: today, parts: [{ name: '메모', text: body }] }
  }
  const head = (i) => {
    const cut = lines[i].lastIndexOf(' - ')
    return cut < 0 ? [lines[i].trim(), '내용'] : [lines[i].slice(0, cut).trim(), lines[i].slice(cut + 3).trim()]
  }
  const [, y, m, d] = lines[starts[0] + 1].trim().match(STAMP)
  const parts = starts.map((s, n) => {
    const end = starts[n + 1] ?? lines.length
    let body = s + 2
    while (body < end && lines[body].trim()) body++ // skip the language code and AI disclaimer, up to the first blank line
    return { name: head(s)[1], text: lines.slice(body, end).join('\n').trim() }
  })
  return { title: head(starts[0])[0], date: `${y}-${m}-${d}`, parts }
}

// One document for Conversate's Prep Notes: the chosen parts of each conversation, oldest first.
export const prepNotes = (groupName, sessions, partNames) =>
  [`# ${groupName}`, ...sessions.map((s) =>
    [`## ${s.date} ${s.title}`, ...s.parts.filter((p) => partNames.includes(p.name) && p.text).map((p) => p.text)].join('\n\n'),
  )].join('\n\n')

export const LIMIT = 5000 // Conversate's Prep Notes maximum, in characters

// System prompt that turns several conversation summaries into one prep note that fits the limit.
export const condensePrompt = (groupName, max) => `You maintain the running prep note for a recurring conversation group called "${groupName}".
The input is either summaries of its past conversations (oldest first) or an earlier version of this note that came out too long.
Write ONE prep note that an AI conversation assistant will read before the next conversation in this group.
Merge, do not concatenate: state each fact once, and when conversations disagree the later one wins.
Hard limit: ${max} characters including spaces and line breaks. Stay under it even if that means dropping minor details.
Write in the language of the input, as plain text with short headings and "•" bullets (no markdown tables, no code blocks).
Sections, in this order, skipping any that would be empty:
1. Core context so far: what this group talks about and where things stand now.
2. People: facts, preferences and opinions worth remembering, per person as far as the input tells them apart.
3. Open items: unanswered questions, promises, and things to follow up on next time.
4. One line per conversation: date and what it was about.
Give recent conversations more detail than old ones. Drop small talk and timestamps like [00:01:26].
Use only what is in the input; never add outside facts.`
