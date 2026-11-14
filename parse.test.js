import assert from 'node:assert'
import { parseExport, prepNotes } from './parse.js'

const file = `주간 회의 - 후속 논의 - 요약
02:38 AM 2026/11/13
 KR
AI가 생성한 내용입니다.

개요
--
예산을 논의했다.


주간 회의 - 후속 논의 - 힌트 목록
02:38 AM 2026/11/13
 KR
AI가 생성한 내용입니다.

• 힌트 하나
\r
주간 회의 - 후속 논의 - 음성 기록
02:38 AM 2026/11/13
 KR
AI가 생성한 내용입니다.

[00:00:06]
안녕하세요.
`
const s = parseExport(file)
assert.equal(s.title, '주간 회의 - 후속 논의') // only the last " - " splits off the part name
assert.equal(s.date, '2026-11-13')
assert.deepEqual(s.parts.map((p) => p.name), ['요약', '힌트 목록', '음성 기록'])
assert.equal(s.parts[0].text, '개요\n--\n예산을 논의했다.') // header, language code and disclaimer dropped
assert.equal(s.parts[1].text, '• 힌트 하나')
assert.equal(s.parts[2].text, '[00:00:06]\n안녕하세요.')

const note = parseExport('그냥 적은 메모\n둘째 줄', '2026-11-14') // not an export: one free-form part
assert.deepEqual(note, { title: '그냥 적은 메모', date: '2026-11-14', parts: [{ name: '메모', text: '그냥 적은 메모\n둘째 줄' }] })

assert.equal(prepNotes('A사', [s, note], ['요약']), '# A사\n\n## 2026-11-13 주간 회의 - 후속 논의\n\n개요\n--\n예산을 논의했다.\n\n## 2026-11-14 그냥 적은 메모')
console.log('parse ok')
