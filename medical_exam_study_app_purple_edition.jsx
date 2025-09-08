import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import yaml from 'js-yaml'
import { CheckCircle2, XCircle, RefreshCcw, Play, HelpCircle, Sparkles, BookOpenCheck, Brain, Shuffle, ChevronLeft, ChevronRight, Eye, EyeOff, Info } from 'lucide-react'
// recharts removed in simplified UI

// shadcn/ui (all libs available per instructions)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
// textarea removed in simplified UI
import { Badge } from "@/components/ui/badge"

// ===================== Types =====================
/** @typedef {{
 *  id: string,
 *  number?: number,
 *  category: string,
 *  uses_image: boolean,
 *  question: string,
 *  options: string[],
 *  correct_option_index: number,
 *  more_information?: string
 * }} QA
 */

/** @typedef {{
 * perQuestion: Record<string, { correct: number; incorrect: number; last: string | null }>,
 * daily: Record<string, { studied: number; correct: number; incorrect: number }>,
 * streak: number,
 * lastStudyDate: string | null
 * }} Progress
 */

// ===================== Constants =====================
const BUNDLE_MODE = true
const DATA_KEY = 'medstudy.v1.questions'
const PROGRESS_KEY = 'medstudy.v1.progress'
const SHOW_TESTS_BY_DEFAULT = false
// Load the large YAML dataset from a separate module to keep this file lean
import { BUNDLED_YAML } from './src/data/bundled_yaml.js'
/*
The previous inline BUNDLED_YAML string has been moved to src/data/bundled_yaml.js
*/

// Removed legacy SAMPLE_YAML block (no longer used)

// ===================== Utils =====================
function todayKey() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * Normalize YAML entries and filter only uses_image === false
 * @param {any[]} raw
 * @returns {QA[]}
 */
function normalizeQuestions(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((q) => q && q.uses_image === false)
    .map((q, idx) => {
      const id = `${q.category || 'Okänd'}__${q.number ?? idx}`
      return {
        id,
        number: typeof q.number === 'number' ? q.number : idx,
        category: q.category || 'Okänd',
        uses_image: !!q.uses_image,
        question: String(q.question || ''),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correct_option_index:
          typeof q.correct_option_index === 'number' ? q.correct_option_index : 0,
        more_information: q.more_information ? String(q.more_information) : '',
      }
    })
}

/** Merge & dedupe by id */
function mergeQuestions(existing, incoming) {
  const map = new Map(existing.map((q) => [q.id, q]))
  for (const q of incoming) {
    map.set(q.id, q)
  }
  return Array.from(map.values())
}

function loadProgress() /** @returns {Progress} */ {
  const raw = localStorage.getItem(PROGRESS_KEY)
  if (!raw) return { perQuestion: {}, daily: {}, streak: 0, lastStudyDate: null }
  try {
    const parsed = JSON.parse(raw)
    return {
      perQuestion: parsed.perQuestion || {},
      daily: parsed.daily || {},
      streak: parsed.streak || 0,
      lastStudyDate: parsed.lastStudyDate || null,
    }
  } catch {
    return { perQuestion: {}, daily: {}, streak: 0, lastStudyDate: null }
  }
}

function saveProgress(p /**: Progress */) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p))
}

function loadSavedQuestions() /**: QA[] */ {
  const raw = localStorage.getItem(DATA_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveQuestions(qs /**: QA[] */) {
  localStorage.setItem(DATA_KEY, JSON.stringify(qs))
}

function formatPct(n) {
  if (!isFinite(n)) return '0%'
  return `${Math.round(n * 100)}%`
}

// Shuffle
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ===================== Tests (basic runtime checks) =====================
function runSelfTests() {
  /** @type {{name:string; pass:boolean; details?:string}[]} */
  const results = []
  try {
    const parsed = yaml.load(BUNDLED_YAML)
    results.push({ name: 'BUNDLED_YAML parses', pass: Array.isArray(parsed) })
    const normalized = normalizeQuestions(parsed || [])
    results.push({ name: 'normalize filters uses_image:false only', pass: normalized.every(q => q.uses_image === false) })
  } catch (e) {
    results.push({ name: 'BUNDLED_YAML parses', pass: false, details: String(e) })
  }

  // normalizeQuestions should ignore uses_image: true
  const dummy = [
    { number: 1, category: 'Cardio', uses_image: false, question: 'Q', options: ['A'], correct_option_index: 0 },
    { number: 2, category: 'Cardio', uses_image: true, question: 'Q2', options: ['A'], correct_option_index: 0 },
  ]
  const norm = normalizeQuestions(dummy)
  results.push({ name: 'normalize ignores uses_image:true', pass: norm.length === 1 })

  // mergeQuestions dedupes by id
  const a = [{ id: 'Cat__1', category: 'Cat', uses_image: false, question: 'x', options: ['A'], correct_option_index: 0 }]
  const b = [{ id: 'Cat__1', category: 'Cat', uses_image: false, question: 'x2', options: ['A'], correct_option_index: 0 }]
  const merged = mergeQuestions(a, b)
  results.push({ name: 'mergeQuestions dedupes', pass: merged.length === 1 })

  // formatPct rounds
  results.push({ name: 'formatPct rounds', pass: formatPct(0.333) === '33%' })

  // todayKey shape
  results.push({ name: 'todayKey format', pass: /^\d{4}-\d{2}-\d{2}$/.test(todayKey()) })

  // shuffle preserves length
  const sh = shuffle([1,2,3,4])
  results.push({ name: 'shuffle preserves length', pass: sh.length === 4 })

  return results
}

// ===================== Main App =====================
export default function MedStudyApp() {
  const [questions, setQuestions] = useState(() => loadSavedQuestions())
  const [deferredInstall, setDeferredInstall] = useState(null)
  const [progress, setProgress] = useState(() => loadProgress())
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [randomize, setRandomize] = useState(true)
  const [mode, setMode] = useState(null) // null | 'flashcards' | 'quiz'
  const [sessionSize, setSessionSize] = useState(20)
  const [showInfo, setShowInfo] = useState(true)
  const [testResults, setTestResults] = useState([])
  const [showTests, setShowTests] = useState(SHOW_TESTS_BY_DEFAULT)

  // Load bundled YAML on first run (bundle mode)
  useEffect(() => {
    if (!BUNDLE_MODE) return
    try {
      const parsed = normalizeQuestions(yaml.load(BUNDLED_YAML) || [])
      if (parsed.length && loadSavedQuestions().length === 0) {
        setQuestions(parsed)
      }
    } catch (e) {
      console.error('Failed to load bundled YAML', e)
    }
  }, [])

  // PWA install prompt capture
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferredInstall(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  // Run basic tests once (and log)
  useEffect(() => {
    const res = runSelfTests()
    setTestResults(res)
    // eslint-disable-next-line no-console
    console.groupCollapsed('MedStudy self-tests')
    res.forEach(r => console.log(`${r.pass ? '✅' : '❌'} ${r.name}`, r.details || ''))
    console.groupEnd()
  }, [])

  // Build working set according to filters
  const filtered = useMemo(() => {
    const base = questions.filter((q) => q.uses_image === false)
    const byCat = categoryFilter === 'All' ? base : base.filter((q) => q.category === categoryFilter)
    return randomize ? shuffle(byCat) : byCat
  }, [questions, categoryFilter, randomize])

  // Build a session subset
  const session = useMemo(() => filtered.slice(0, Math.max(1, sessionSize)), [filtered, sessionSize])

  // Persist questions & progress
  useEffect(() => saveQuestions(questions), [questions])
  useEffect(() => saveProgress(progress), [progress])

  const categories = useMemo(() => ['All', ...Array.from(new Set(questions.map((q) => q.category)))], [questions])

  function recordStudy(id, correct) {
    setProgress((prev) => {
      const t = todayKey()
      const daily = { ...prev.daily }
      const d = daily[t] || { studied: 0, correct: 0, incorrect: 0 }
      d.studied += 1
      if (correct) d.correct += 1
      else d.incorrect += 1
      daily[t] = d

      // streak
      let streak = prev.streak
      const last = prev.lastStudyDate
      if (last !== t) {
        const y = new Date()
        y.setDate(y.getDate() - 1)
        const yKey = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`
        if (last === yKey) streak = (streak || 0) + 1
        else streak = 1
      }

      const perQuestion = { ...prev.perQuestion }
      const pq = perQuestion[id] || { correct: 0, incorrect: 0, last: null }
      if (correct) pq.correct += 1
      else pq.incorrect += 1
      pq.last = t
      perQuestion[id] = pq

      return { perQuestion, daily, streak, lastStudyDate: t }
    })
  }

  function startSession(chosenMode) {
    setMode(chosenMode)
    window.scrollTo({ top: 0 })
  }

  function exitSession() {
    setMode(null)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-white to-purple-100 text-slate-800">
      {/* Slim header - hidden in study modes for better mobile experience */}
      {mode == null && (
        <header className="sticky top-0 z-30 bg-white/90 border-b border-purple-100">
          <div className="max-w-xl mx-auto px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-base font-semibold text-slate-900">MedStudy</h1>
            </div>
            {deferredInstall && (
              <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" onClick={async () => { await deferredInstall.prompt(); const _ = await deferredInstall.userChoice; setDeferredInstall(null) }}>
                Install
              </Button>
            )}
          </div>
        </header>
      )}

      <main className="max-w-xl mx-auto px-3 py-4">
        {/* Start screen */}
        {mode == null && (
          <div className="space-y-3">
            <Card className="border-purple-100">
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-slate-900"><BookOpenCheck className="h-5 w-5 text-purple-600"/>Start</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-500">Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="All"/></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-slate-500">Questions</Label>
                    <Input type="number" min={1} max={200} value={sessionSize} onChange={(e) => setSessionSize(Number(e.target.value))} className="w-24"/>
                    <div className="flex items-center gap-2 ml-auto">
                      <Switch id="randomize" checked={randomize} onCheckedChange={setRandomize} />
                      <Label htmlFor="randomize" className="text-xs text-slate-500 flex items-center gap-1"><Shuffle className="h-3 w-3"/>Random</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" onClick={() => startSession('flashcards')}><Brain className="h-4 w-4 mr-1"/> Flashcards</Button>
                    <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" onClick={() => startSession('quiz')}><HelpCircle className="h-4 w-4 mr-1"/> Quiz</Button>
                  </div>
                  <div className="text-xs text-slate-500">{filtered.length} questions available</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Study screen (minimal chrome) */}
        {mode != null && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <Button size="sm" variant="ghost" onClick={exitSession}>Back</Button>
              <div className="h-6" />
            </div>
            <div className="mt-0">
              {mode === 'flashcards' ? (
                <Flashcards key={`${categoryFilter}-${randomize}`} items={session} onGrade={recordStudy} showInfo={showInfo} setShowInfo={setShowInfo}/>
              ) : (
                <Quiz key={`${categoryFilter}-${randomize}-${sessionSize}`} items={session} onGrade={recordStudy} />
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-xl mx-auto px-3 pb-6 pt-2 text-center text-[11px] text-slate-500">
        Offline-ready • Progress saved on device
      </footer>
    </div>
  )
}

// ===================== Components =====================
function ModeToggle({ mode, setMode }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-xl p-1 shadow-sm">
      <Button size="sm" variant={mode === 'flashcards' ? 'default' : 'ghost'} className={mode === 'flashcards' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white' : ''} onClick={() => setMode('flashcards')}>
        <Brain className="h-4 w-4 mr-1"/> Flashcards
      </Button>
      <Button size="sm" variant={mode === 'quiz' ? 'default' : 'ghost'} className={mode === 'quiz' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white' : ''} onClick={() => setMode('quiz')}>
        <HelpCircle className="h-4 w-4 mr-1"/> Quiz
      </Button>
    </div>
  )
}

function Flashcards({ items, onGrade, showInfo, setShowInfo }) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const current = items[index]

  useEffect(() => {
    setIndex(0)
    setRevealed(false)
  }, [items])

  function next() {
    setRevealed(false)
    setIndex((i) => Math.min(items.length - 1, i + 1))
  }
  function prev() {
    setRevealed(false)
    setIndex((i) => Math.max(0, i - 1))
  }

  if (!current) return <EmptyState />

  const displayId = current?.number != null
    ? `#${current.number}`
    : (current?.id ? `#${(current.id.split('__')[1] || current.id)}` : '')

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border border-purple-200">{current.category}</Badge>
          <span>Card {index + 1} / {items.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch id="info" checked={showInfo} onCheckedChange={setShowInfo} />
            <Label htmlFor="info" className="text-xs text-slate-500 flex items-center gap-1"><Info className="h-3 w-3"/>Show explanation</Label>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={prev} disabled={index === 0}><ChevronLeft className="h-4 w-4"/></Button>
            <Button size="icon" variant="ghost" onClick={next} disabled={index === items.length - 1}><ChevronRight className="h-4 w-4"/></Button>
          </div>
        </div>
      </div>

      <motion.div
        key={current.id + String(revealed)}
        initial={{ rotateY: 180, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
        className="bg-white border border-purple-200 rounded-2xl p-5 shadow-sm"
        style={{ position: 'relative' }}
      >
        {!!displayId && (
          <span
            style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: '#64748b' }}
            aria-label="Question ID"
          >
            {displayId}
          </span>
        )}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-medium text-slate-900 leading-snug">{current.question}</h3>
          <Button size="sm" variant="ghost" className="text-purple-700" onClick={() => setRevealed((r) => !r)}>
            {revealed ? <><EyeOff className="h-4 w-4 mr-1"/>Hide</> : <><Eye className="h-4 w-4 mr-1"/>Reveal</>}
          </Button>
        </div>

        {/* Display all options as small outlined boxes so you can think before reveal */}
        {Array.isArray(current.options) && current.options.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correct_option_index
              const baseCls = 'rounded-xl border px-3 py-1.5 text-sm bg-white'
              const stateCls = revealed && isCorrect ? ' border-emerald-300 bg-emerald-50' : ' border-slate-200'
              return (
                <div key={i} className={baseCls + stateCls}>
                  <span className="text-slate-700">
                    {String.fromCharCode(65 + i)}. {opt}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <AnimatePresence initial={false}>
          {revealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4"
            >
              <div className="mb-3">
                <div className="text-sm text-slate-700">Correct answer:</div>
                <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4"/>
                  <span className="text-sm font-medium">{current.options[current.correct_option_index]}</span>
                </div>
              </div>
              {current.more_information && showInfo && (
                <div className="text-sm text-slate-600 leading-relaxed bg-purple-50/70 border border-purple-100 rounded-xl p-3">
                  {current.more_information}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white gap-2" onClick={() => { onGrade(current.id, true); next() }}>
            <CheckCircle2 className="h-4 w-4"/> Got it
          </Button>
          <Button variant="secondary" className="gap-2 border-rose-200 text-rose-700" onClick={() => { onGrade(current.id, false); next() }}>
            <XCircle className="h-4 w-4"/> Needs review
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

function Quiz({ items, onGrade }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const current = items[index]

  useEffect(() => {
    setIndex(0)
    setSelected(null)
    setAnswered(false)
    setScore(0)
  }, [items])

  if (!current) return <EmptyState />

  function submit() {
    if (answered || selected == null) return
    const ok = selected === current.correct_option_index
    if (ok) setScore((s) => s + 1)
    onGrade(current.id, ok)
    setAnswered(true)
  }

  function next() {
    setIndex((i) => Math.min(items.length - 1, i + 1))
    setSelected(null)
    setAnswered(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-700 border border-purple-200">{current.category}</Badge>
          <span>Question {index + 1} / {items.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-600">Score: <strong>{score}</strong></span>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}><ChevronLeft className="h-4 w-4"/></Button>
            <Button size="icon" variant="ghost" onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))} disabled={index === items.length - 1}><ChevronRight className="h-4 w-4"/></Button>
          </div>
        </div>
      </div>

      <Card className="border-purple-200">
        <CardContent className="pt-5">
          <h3 className="text-lg font-medium text-slate-900 leading-snug">{current.question}</h3>
          <div className="mt-4 grid gap-2">
            {current.options.map((opt, i) => {
              const isCorrect = i === current.correct_option_index
              const isSelected = selected === i
              const showState = answered
              return (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={[
                    'text-left w-full rounded-xl border p-3 transition-all',
                    'hover:shadow-sm',
                    isSelected ? 'border-purple-400 ring-2 ring-purple-200 bg-purple-50' : 'border-slate-200',
                    showState && isCorrect ? 'border-emerald-300 bg-emerald-50' : '',
                    showState && isSelected && !isCorrect ? 'border-rose-300 bg-rose-50' : '',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border flex items-center justify-center text-xs">
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span>{opt}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {!answered ? (
              <Button className="gap-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" onClick={submit}><Play className="h-4 w-4"/>Submit</Button>
            ) : (
              <>
                <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  {selected === current.correct_option_index ? <CheckCircle2 className="h-3 w-3"/> : <XCircle className="h-3 w-3"/>}
                  {selected === current.correct_option_index ? 'Correct' : 'Incorrect'}
                </Badge>
                <Button variant="secondary" className="gap-2" onClick={next}><RefreshCcw className="h-4 w-4"/>Next</Button>
              </>
            )}
          </div>

          {answered && current.more_information && (
            <div className="mt-3 text-sm text-slate-600 leading-relaxed bg-purple-50/70 border border-purple-100 rounded-xl p-3">
              {current.more_information}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-purple-200 p-6 text-center text-slate-600 bg-white">
      <p>No questions loaded yet. Upload YAML, paste it, or load the sample.</p>
    </div>
  )
}

function ProgressPanel({ progress, questions }) {
  const stats = useMemo(() => {
    const totalStudied = Object.values(progress.daily).reduce((a, b) => a + (b.studied || 0), 0)
    const totalCorrect = Object.values(progress.daily).reduce((a, b) => a + (b.correct || 0), 0)
    const accuracy = totalStudied ? totalCorrect / totalStudied : 0

    // last 30 days timeline
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const e = progress.daily[k] || { studied: 0, correct: 0, incorrect: 0 }
      days.push({ day: k.slice(5), Studied: e.studied, Correct: e.correct })
    }

    // weak areas (by lowest accuracy, min 3 attempts)
    const per = Object.entries(progress.perQuestion)
      .map(([id, v]) => {
        const meta = questions.find((q) => q.id === id)
        const tries = v.correct + v.incorrect
        const acc = tries ? v.correct / tries : 0
        return { id, category: meta?.category || 'Other', tries, acc }
      })
      .filter((x) => x.tries >= 3)
      .sort((a, b) => a.acc - b.acc)
      .slice(0, 3)

    return { totalStudied, totalCorrect, accuracy, days, per }
  }, [progress, questions])

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Studied" value={String(stats.totalStudied)} />
        <Stat label="Accuracy" value={formatPct(stats.accuracy)} />
        <Stat label="Streak" value={String(progress.streak || 0)} />
      </div>
      <div className="mt-4 h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={stats.days} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} width={24} tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Studied" stroke="#7c3aed" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Correct" stroke="#a21caf" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {stats.per.length > 0 && (
        <div className="mt-4">
          <div className="text-xs text-slate-500 mb-1">Challenging areas (min 3 attempts)</div>
          <div className="flex flex-col gap-2">
            {stats.per.map((x) => (
              <div key={x.id} className="flex items-center justify-between text-sm bg-white border border-purple-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700 border border-purple-200">{x.category}</Badge>
                  <span className="text-slate-700">{x.id.split('__')[0]} #{x.id.split('__')[1]}</span>
                </div>
                <div className="text-slate-600">{formatPct(x.acc)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-white border border-purple-200 p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function TipsCard() {
  return (
    <Card className="shadow-sm border-purple-100">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-slate-900"><Settings className="h-5 w-5 text-purple-600"/>Tips & Tricks</CardTitle></CardHeader>
      <CardContent>
        <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
          <li>Upload one or more <code>.yaml</code>/<code>.yml</code> files. Only items with <code>uses_image: false</code> are imported.</li>
          <li>Use <strong>Flashcards</strong> to learn, then switch to <strong>Quiz</strong> to test yourself.</li>
          <li>Progress is saved locally in your browser. Export it anytime.</li>
          <li>Filter by category and search to focus on what matters today.</li>
          <li>Keep a streak going — a little practice every day ✨</li>
        </ul>
      </CardContent>
    </Card>
  )
}

function Uploader({ onAdd }) {
  const [paste, setPaste] = useState('')
  const inputRef = useRef(null)
  const [loading, setLoading] = useState(false)

  async function handleFiles(files) {
    setLoading(true)
    try {
      /** @type {QA[]} */
      let all = []
      for (const file of files) {
        const text = await file.text()
        let data
        try {
          if (file.name.endsWith('.json')) data = JSON.parse(text)
          else data = yaml.load(text)
        } catch (e) {
          alert(`Failed parsing ${file.name}: ${e}`)
          continue
        }
        const parsed = normalizeQuestions(Array.isArray(data) ? data : [])
        all = all.concat(parsed)
      }
      if (!all.length) {
        alert('No importable questions found (uses_image: false).')
        return
      }
      onAdd(all)
    } finally {
      setLoading(false)
    }
  }

  function handlePasteImport() {
    try {
      const data = yaml.load(paste)
      const parsed = normalizeQuestions(Array.isArray(data) ? data : [])
      if (!parsed.length) return alert('No importable questions found (uses_image: false).')
      onAdd(parsed)
      setPaste('')
    } catch (e) {
      alert('Paste import failed: ' + e)
    }
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files) }}
        className="rounded-2xl border border-dashed border-purple-300 bg-white p-6 text-center text-slate-600 hover:bg-purple-50/40 transition-colors"
      >
        <Upload className="h-6 w-6 mx-auto text-purple-600"/>
        <div className="mt-2 text-sm">Drag & drop YAML here</div>
        <div className="text-xs text-slate-500">or</div>
        <div className="mt-2">
          <Button variant="secondary" className="gap-2" onClick={() => inputRef.current?.click()} disabled={loading}><ClipboardList className="h-4 w-4"/>Choose files</Button>
          <input ref={inputRef} type="file" accept=".yaml,.yml,.json" multiple onChange={(e) => e.target.files && handleFiles(e.target.files)} className="hidden"/>
        </div>
        {loading && <div className="mt-2 text-xs text-slate-500">Importing…</div>}
      </div>

      <div className="mt-3">
        <Label className="text-xs text-slate-500">Or paste YAML below</Label>
        <Textarea value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"- number: 1\n  category: …\n  uses_image: false\n  question: …"} className="mt-1 h-28"/>
        <div className="mt-2 flex items-center gap-2">
          <Button onClick={handlePasteImport} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white" disabled={!paste.trim()}>Import pasted YAML</Button>
          <Button variant="ghost" onClick={() => setPaste('')}>Clear</Button>
        </div>
      </div>
    </div>
  )
}

function TestsPanel({ results, show, onToggle }) {
  const passed = results.filter(r => r.pass).length
  const total = results.length
  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Bug className="h-5 w-5 text-purple-600" /> Diagnostics & Self-tests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-600">{passed}/{total} tests passing</div>
          <Button variant="secondary" size="sm" onClick={onToggle}>{show ? 'Hide' : 'Show'}</Button>
        </div>
        {show && (
          <div className="mt-3 space-y-1">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm bg-white">
                <div className="text-slate-700">{r.name}</div>
                <div className={r.pass ? 'text-emerald-700' : 'text-rose-700'}>{r.pass ? 'PASS' : 'FAIL'}</div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">These app-level checks help catch common issues like malformed YAML or filtering mistakes.</p>
      </CardContent>
    </Card>
  )
}
