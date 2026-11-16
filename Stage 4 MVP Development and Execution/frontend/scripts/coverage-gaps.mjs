import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('coverage')
const summaryPath = path.join(dir, 'coverage-summary.json')
const finalPath = path.join(dir, 'coverage-final.json')
if (!fs.existsSync(summaryPath) || !fs.existsSync(finalPath)) {
  console.log('ما لقيت ملفات coverage. تأكد إن الاختبارات اشتغلت.')
  process.exit(0)
}
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
const final = JSON.parse(fs.readFileSync(finalPath, 'utf8'))
const cwd = process.cwd() + path.sep

const ranges = (nums) => {
  const s = [...new Set(nums)].sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < s.length; ) {
    let j = i
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j += 1
    out.push(i === j ? `${s[i]}` : `${s[i]}-${s[j]}`)
    i = j + 1
  }
  return out.join(',')
}

const lines = []
const t = summary.total
lines.push(`TOTAL  stmts ${t.statements.pct}%  branch ${t.branches.pct}%  funcs ${t.functions.pct}%  lines ${t.lines.pct}%`)
lines.push('')

const rows = []
for (const [file, s] of Object.entries(summary)) {
  if (file === 'total') continue
  const pcts = [s.statements.pct, s.branches.pct, s.functions.pct, s.lines.pct]
  if (pcts.every((p) => p === 100)) continue
  const data = final[file]
  const stmtLines = []
  const branchLines = []
  const fnLines = []
  if (data) {
    Object.entries(data.s).forEach(([id, c]) => { if (c === 0) stmtLines.push(data.statementMap[id].start.line) })
    Object.entries(data.b).forEach(([id, arr]) => {
      arr.forEach((c) => { if (c === 0) branchLines.push(data.branchMap[id].loc.start.line) })
    })
    Object.entries(data.f).forEach(([id, c]) => { if (c === 0) fnLines.push(data.fnMap[id].loc.start.line) })
  }
  rows.push({
    file: file.replace(cwd, ''), min: Math.min(...pcts), pcts,
    stmtLines, branchLines, fnLines,
  })
}
rows.sort((a, b) => a.min - b.min)

if (!rows.length) {
  lines.push('كل الملفات 100% 🎉')
} else {
  lines.push(`${rows.length} ملف تحت 100%:`)
  lines.push('')
  for (const r of rows) {
    lines.push(`${r.file}   [stmts ${r.pcts[0]}  branch ${r.pcts[1]}  funcs ${r.pcts[2]}  lines ${r.pcts[3]}]`)
    if (r.stmtLines.length) lines.push(`    أسطر غير مغطاة : ${ranges(r.stmtLines)}`)
    if (r.branchLines.length) lines.push(`    branches ناقصة : ${ranges(r.branchLines)}`)
    if (r.fnLines.length) lines.push(`    دوال غير مستدعاة: ${ranges(r.fnLines)}`)
  }
}
const text = lines.join('\n')
fs.writeFileSync('coverage-gaps.txt', text + '\n')
console.log(text)
console.log('\nتم حفظ التقرير في coverage-gaps.txt')
