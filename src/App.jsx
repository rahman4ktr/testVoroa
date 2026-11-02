import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock3,
  ExternalLink,
  FolderOpen,
  Globe2,
  Hash,
  Inbox,
  LayoutGrid,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'

const STORAGE_KEY = 'voroa-tasks-v1'
const categories = ['Work', 'Personal', 'Ideas']
const priorityOptions = ['High', 'Medium', 'Low']

function localDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysFromToday(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

function createStarterTasks() {
  return [
    { id: 'welcome-1', title: 'Review the brand direction', category: 'Work', priority: 'High', dueDate: localDateString(), completed: false },
    { id: 'welcome-2', title: 'Send the first project update', category: 'Work', priority: 'Medium', dueDate: localDateString(), completed: false },
    { id: 'welcome-3', title: 'Pick up something fresh for dinner', category: 'Personal', priority: 'Low', dueDate: localDateString(), completed: false },
    { id: 'welcome-4', title: 'Sketch ideas for the weekend', category: 'Ideas', priority: 'Medium', dueDate: daysFromToday(1), completed: false },
    { id: 'welcome-5', title: 'Tidy up your workspace', category: 'Personal', priority: 'Low', dueDate: daysFromToday(2), completed: false },
    { id: 'welcome-6', title: 'Set up your new space', category: 'Work', priority: 'Medium', dueDate: localDateString(), completed: true },
  ]
}

function isTaskList(value) {
  return Array.isArray(value) && value.every((task) =>
    task &&
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.category === 'string' &&
    typeof task.priority === 'string' &&
    typeof task.dueDate === 'string' &&
    typeof task.completed === 'boolean',
  )
}

function readTasks() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === null) return { tasks: createStarterTasks(), error: false }
    const parsed = JSON.parse(saved)
    if (isTaskList(parsed)) return { tasks: parsed, error: false }
    return { tasks: createStarterTasks(), error: true }
  } catch {
    return { tasks: createStarterTasks(), error: true }
  }
}

function formatDueDate(value) {
  if (!value) return 'No date'
  const date = new Date(`${value}T12:00:00`)
  if (value === localDateString()) return 'Today'
  if (value === daysFromToday(1)) return 'Tomorrow'
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date)
}

function App() {
  const [initialState] = useState(readTasks)
  const [tasks, setTasks] = useState(initialState.tasks)
  const [storageError, setStorageError] = useState(initialState.error)
  const [activeView, setActiveView] = useState('Today')
  const [activeCategory, setActiveCategory] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isIntroOpen, setIsIntroOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftCategory, setDraftCategory] = useState('Work')
  const [draftPriority, setDraftPriority] = useState('Medium')
  const [draftDate, setDraftDate] = useState(localDateString())

  function updateTasks(updater) {
    const updatedTasks = updater(tasks)
    setTasks(updatedTasks)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTasks))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }

  const today = localDateString()
  const openTasks = tasks.filter((task) => !task.completed)
  const todaysTasks = tasks.filter((task) => task.dueDate === today)
  const openTodayTasks = todaysTasks.filter((task) => !task.completed)
  const completedTasks = tasks.filter((task) => task.completed)
  const completion = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  const visibleTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return tasks
      .filter((task) => {
        if (activeView === 'Completed') return task.completed
        if (task.completed) return false
        if (activeView === 'Today' && task.dueDate !== today) return false
        if (activeView === 'Upcoming' && (!task.dueDate || task.dueDate <= today)) return false
        if (activeCategory && task.category !== activeCategory) return false
        return true
      })
      .filter((task) => !query || task.title.toLowerCase().includes(query))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  }, [activeCategory, activeView, searchQuery, tasks, today])

  function chooseView(view) {
    setActiveView(view)
    setActiveCategory(null)
  }

  function addTask(event) {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title) return
    updateTasks((current) => [
      {
        id: crypto.randomUUID(),
        title,
        category: draftCategory,
        priority: draftPriority,
        dueDate: draftDate,
        completed: false,
      },
      ...current,
    ])
    setDraftTitle('')
    setDraftCategory('Work')
    setDraftPriority('Medium')
    setDraftDate(localDateString())
    setIsAdding(false)
  }

  function toggleTask(id) {
    updateTasks((current) => current.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    ))
  }

  function deleteTask(id) {
    updateTasks((current) => current.filter((task) => task.id !== id))
  }

  const currentDate = new Intl.DateTimeFormat('en', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const navItems = [
    { name: 'Today', icon: LayoutGrid, count: openTodayTasks.length },
    { name: 'Upcoming', icon: CalendarDays },
    { name: 'All tasks', icon: ListTodo, count: openTasks.length },
    { name: 'Completed', icon: CheckCircle2, count: completedTasks.length },
  ]

  return (
    <div className="app-shell min-h-screen bg-[#f7f7f5] text-[#20211f]">
      {isIntroOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#171815]/50 p-4 backdrop-blur-sm"
          onClick={(event) => { if (event.target === event.currentTarget) setIsIntroOpen(false) }}
          onKeyDown={(event) => { if (event.key === 'Escape') setIsIntroOpen(false) }}
        >
          <section aria-labelledby="intro-title" aria-modal="true" className="w-full max-w-[460px] overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-2xl" role="dialog">
            <div className="relative overflow-hidden bg-[#dcebc5] px-7 pb-7 pt-6">
              <div className="absolute -right-10 -top-20 h-56 w-56 rounded-full border border-[#728957]/15" />
              <div className="absolute -right-1 -top-11 h-36 w-36 rounded-full border border-[#728957]/15" />
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-2 rounded-full border border-[#758b55]/20 bg-white/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[1.3px] text-[#5f7049]">
                  <Sparkles size={12} /> A note about this project
                </span>
                <button aria-label="Close welcome popup" autoFocus className="flex h-8 w-8 items-center justify-center rounded-full bg-white/45 text-[#5f7049] transition hover:bg-white/75" onClick={() => setIsIntroOpen(false)} type="button">
                  <X size={15} />
                </button>
              </div>
              <div className="relative mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#20211f] text-[#c4f06a] shadow-sm">
                <Globe2 size={22} />
              </div>
              <h2 className="relative mt-4 text-[24px] font-semibold leading-tight tracking-[-1px] text-[#2e3923]" id="intro-title">A little Voroa hosting test.</h2>
              <p className="relative mt-2 max-w-[360px] text-[13px] leading-relaxed text-[#5f6b51]">
                This project is being used to try out the Voroa hosting service and see how it works.
              </p>
            </div>
            <div className="p-7">
              <div className="flex items-center gap-3 rounded-2xl border border-[#eeefeb] bg-[#fafaf8] p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8d9cb] text-[#69584a]">
                  <UserRound size={19} />
                </div>
                <div className="min-w-0">
                <a href="https://github.com/rahman4ktr/">
                  <div className="text-[13px] font-semibold text-[#393a34]">M Rahman</div>
                  <div className="mt-0.5 text-[11px] text-[#92938c]">@rahman4ktr</div>
                  </a>
                </div>
                <span className="ml-auto rounded-full bg-[#edf3e5] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.8px] text-[#738956]">Testing Voroa</span>
              </div>
              <p className="mt-4 text-[12px] leading-relaxed text-[#85867f]">
                Thanks for stopping by. The app is a hands-on test of hosting at{' '}
                <a className="font-medium text-[#687e4d] underline decoration-[#b4c39e] underline-offset-2 hover:text-[#465a2d]" href="https://getvoroa.com/" rel="noreferrer" target="_blank">
                  getvoroa.com
                </a>.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button className="flex items-center justify-center gap-2 rounded-xl border border-[#e9e9e5] px-4 py-2.5 text-[11px] font-medium text-[#666760] transition hover:bg-[#f7f7f4]" onClick={() => setIsIntroOpen(false)} type="button">
                  Continue to the app
                </button>
                <a className="flex items-center justify-center gap-2 rounded-xl bg-[#20211f] px-4 py-2.5 text-[11px] font-medium text-white transition hover:bg-[#353630]" href="https://getvoroa.com/" rel="noreferrer" target="_blank">
                  Visit Voroa <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      <aside className="sidebar fixed inset-y-0 left-0 z-20 flex w-[248px] flex-col bg-[#20211f] px-5 py-6 text-white">
        <a className="mb-12 flex items-center gap-3 px-2" href="#" aria-label="Voroa home">
          <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-xl bg-[#c4f06a] text-[#20211f]">
            <CheckCheck size={20} strokeWidth={2.6} />
          </span>
          <span className="text-[20px] font-semibold tracking-[-0.7px]">voroa<span className="text-[#c4f06a]">.</span></span>
        </a>

        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-white/35">Workspace</div>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(({ name, icon: Icon, count }) => {
            const selected = activeView === name && !activeCategory
            return (
              <button
                className={`nav-item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${selected ? 'bg-white/10 font-medium text-white' : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'}`}
                key={name}
                onClick={() => chooseView(name)}
                type="button"
              >
                <Icon size={17} strokeWidth={1.8} className={selected ? 'text-[#c4f06a]' : ''} />
                <span className="flex-1">{name}</span>
                {count !== undefined && <span className={`text-[11px] ${selected ? 'text-white/75' : 'text-white/35'}`}>{count}</span>}
              </button>
            )
          })}
        </nav>

        <div className="mb-3 mt-10 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-[1.8px] text-white/35">
          <span>Collections</span>
        </div>
        <div className="space-y-1">
          {categories.map((category, index) => {
            const count = openTasks.filter((task) => task.category === category).length
            const selected = activeCategory === category
            const dotColors = ['bg-[#b9a2ff]', 'bg-[#ffb686]', 'bg-[#82d5d0]']
            return (
              <button
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${selected ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[0.06] hover:text-white/90'}`}
                key={category}
                onClick={() => { setActiveCategory(category); setActiveView('All tasks') }}
                type="button"
              >
                <span className={`h-2 w-2 rounded-full ${dotColors[index]}`} />
                <span className="flex-1">{category}</span>
                <span className="text-[11px] text-white/35">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.045] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-white/75">A little progress</span>
              <Sparkles size={14} className="text-[#c4f06a]" />
            </div>
            <div className="mb-2 flex items-end justify-between">
              <span className="text-2xl font-semibold tracking-tight">{completion}<span className="text-sm text-white/40">%</span></span>
              <span className="pb-1 text-[10px] text-white/35">all-time done</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#c4f06a] transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-white/[0.08] px-1 pt-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dacfff] text-xs font-semibold text-[#453c65]">R</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-white/90">Your workspace</div>
              <div className="mt-0.5 text-[10px] text-white/40">A fresh start, every day</div>
            </div>
            <ChevronDown size={14} className="text-white/35" />
          </div>
        </div>
      </aside>

      <main className="main-content ml-[248px] min-h-screen px-10 pb-16 pt-8">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-[#92938e]">
            <span>My workspace</span><span className="text-[#c8c9c4]">/</span>
            <span className="font-medium text-[#555650]">{activeCategory || activeView}</span>
          </div>
          <div className="flex items-center gap-3">
            <label className="search-field flex h-10 w-[220px] items-center gap-2 rounded-xl border border-[#e9e9e5] bg-white px-3 text-[#a2a39d] transition focus-within:border-[#c5c6bf]">
              <Search size={15} />
              <input aria-label="Search tasks" className="w-full bg-transparent text-xs text-[#33342f] outline-none placeholder:text-[#b6b7b1]" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search anything..." value={searchQuery} />
            </label>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#e8d9cb] text-xs font-semibold text-[#69584a] shadow-sm">R</div>
          </div>
        </header>

        {storageError && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800" role="status">
            <Circle size={14} /> Your browser could not access saved tasks. Changes may not persist in this session.
          </div>
        )}

        <section className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[1.6px] text-[#a1a29b]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#9fcd4c]" />{currentDate}
            </div>
            <h1 className="text-[32px] font-semibold leading-tight tracking-[-1.4px] text-[#22231f]">
              {activeCategory ? activeCategory : activeView === 'Today' ? 'Today, with intention.' : activeView === 'Upcoming' ? 'Coming up.' : activeView === 'Completed' ? 'Look at you go.' : 'All your tasks.'}
            </h1>
            <p className="mt-2 text-[13px] text-[#92938e]">
              {activeView === 'Today' ? `${openTodayTasks.length} things on your plate. You’ve got this.` : activeView === 'Completed' ? 'Every little thing adds up.' : 'A clear mind starts with a clear list.'}
            </p>
          </div>
          <button onClick={() => setIsAdding(true)} className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-[#20211f] px-4 text-[12px] font-medium text-white shadow-sm transition hover:bg-[#353630] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#849e4a]" type="button">
            <Plus size={16} /> <span className="hidden sm:inline">New task</span><span className="sm:hidden">Add</span>
          </button>
        </section>

        <section className="hero-card relative mb-8 flex min-h-[178px] items-center justify-between overflow-hidden rounded-[20px] bg-[#dcebc5] px-8 py-6">
          <div className="hero-orb hero-orb-one" />
          <div className="hero-orb hero-orb-two" />
          <div className="relative z-10 max-w-[410px]">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#758b55]/20 bg-white/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[1.2px] text-[#5f7049]">
              <Sparkles size={11} /> Your daily reset
            </div>
            <h2 className="text-[21px] font-semibold leading-tight tracking-[-0.7px] text-[#2e3923]">Make room for what matters.</h2>
            <p className="mt-2 max-w-[340px] text-[12px] leading-relaxed text-[#5f6b51]">Small steps, done with care, take you somewhere wonderful.</p>
          </div>
          <div className="relative z-10 mr-2 hidden h-[112px] w-[112px] shrink-0 items-center justify-center rounded-full border border-[#728957]/20 bg-white/25 sm:flex">
            <div className="absolute inset-[8px] rounded-full border-[5px] border-[#728957]/15" />
            <div className="absolute inset-[8px] rounded-full border-[5px] border-[#71894f] border-r-transparent border-b-transparent -rotate-45" />
            <div className="text-center">
              <div className="text-[25px] font-semibold leading-none tracking-[-1px] text-[#35432a]">{todaysTasks.filter((task) => task.completed).length}<span className="text-[#899a70]">/{todaysTasks.length}</span></div>
              <div className="mt-1.5 text-[9px] font-medium uppercase tracking-[1px] text-[#657451]">today</div>
            </div>
          </div>
          <ArrowUpRight className="absolute -bottom-7 right-[130px] h-28 w-28 rotate-12 text-[#7e9463]/[0.14]" strokeWidth={1} />
        </section>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-[#eeefeb] p-1">
            {['Today', 'Upcoming', 'All tasks', 'Completed'].map((view) => (
              <button
                className={`rounded-lg px-3 py-2 text-[11px] transition ${activeView === view && !activeCategory ? 'bg-white font-medium text-[#33342f] shadow-sm' : 'text-[#8f9089] hover:text-[#4c4d47]'}`}
                key={view}
                onClick={() => chooseView(view)}
                type="button"
              >{view}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#9a9b95]">
            <span className="hidden sm:inline">Sort by</span>            <span className="flex items-center gap-1 font-medium text-[#62635d]">Due date <ChevronDown size={13} /></span>
          </div>
        </div>

        <section className="task-panel overflow-hidden rounded-2xl border border-[#eaeae6] bg-white">
          <div className="flex items-center justify-between border-b border-[#f0f0ed] px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f3f5ef] text-[#728956]"><FolderOpen size={14} /></span>
              <span className="text-[12px] font-semibold text-[#44453f]">{activeCategory || activeView}</span>
              <span className="rounded-md bg-[#f4f4f1] px-1.5 py-0.5 text-[10px] text-[#969790]">{visibleTasks.length}</span>
            </div>
            <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#898a83] transition hover:bg-[#f5f6f2] hover:text-[#42433d]" type="button"><Plus size={14} /> Add task</button>
          </div>
          {visibleTasks.length ? (
            <ul className="divide-y divide-[#f3f3f0]">
              {visibleTasks.map((task) => (
                <li className="task-row group flex min-h-[63px] items-center gap-3 px-5 py-3 transition hover:bg-[#fcfcfa]" key={task.id}>
                  <button
                    aria-label={task.completed ? `Mark ${task.title} as incomplete` : `Complete ${task.title}`}
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition ${task.completed ? 'border-[#a9cf72] bg-[#a9cf72] text-white' : 'border-[#d9dad4] text-transparent hover:border-[#9dbb72] hover:text-[#9dbb72]'}`}
                    onClick={() => toggleTask(task.id)}
                    type="button"
                  ><Check size={11} strokeWidth={3} /></button>
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-[12px] font-medium ${task.completed ? 'text-[#a5a69f] line-through' : 'text-[#41423d]'}`}>{task.title}</div>
                    <div className="mt-1.5 flex items-center gap-2.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-medium ${task.category === 'Work' ? 'bg-[#f0edff] text-[#8174bc]' : task.category === 'Personal' ? 'bg-[#fff1e7] text-[#c1855c]' : 'bg-[#e9f5f3] text-[#5e9d96]'}`}>{task.category}</span>
                      <span className="flex items-center gap-1 text-[10px] text-[#a5a69f]"><Clock3 size={11} />{formatDueDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <span className={`priority-chip hidden items-center gap-1 text-[10px] sm:flex ${task.priority === 'High' ? 'text-[#d47c71]' : task.priority === 'Medium' ? 'text-[#d0a45f]' : 'text-[#a4a59e]'}`}>
                    {task.priority === 'High' ? <ArrowUp size={12} /> : task.priority === 'Medium' ? <Hash size={12} /> : <ArrowDown size={12} />}{task.priority}
                  </span>
                  <button aria-label={`Delete ${task.title}`} className="delete-task flex h-7 w-7 items-center justify-center rounded-lg text-[#b8b9b2] opacity-0 transition hover:bg-[#fff0ee] hover:text-[#c96f64] focus:opacity-100 group-hover:opacity-100" onClick={() => deleteTask(task.id)} type="button"><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4f6ef] text-[#8ba56d]">{activeView === 'Completed' ? <CheckCircle2 size={20} /> : <Inbox size={20} />}</div>
              <h3 className="text-[13px] font-semibold text-[#55564f]">{searchQuery ? 'No matching tasks' : activeView === 'Completed' ? 'Nothing checked off just yet' : 'A little breathing room'}</h3>
              <p className="mt-1.5 max-w-[260px] text-[11px] leading-relaxed text-[#a1a29b]">{searchQuery ? 'Try another search, or add this as a new task.' : 'You’re all caught up. Add a task whenever something comes to mind.'}</p>
              {!searchQuery && activeView !== 'Completed' && <button className="mt-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium text-[#6d8055] transition hover:bg-[#f1f4ec]" onClick={() => setIsAdding(true)} type="button"><Plus size={14} /> Add a task</button>}
            </div>
          )}
          {activeView !== 'Completed' && (
            <button className="flex w-full items-center gap-2 border-t border-[#f3f3f0] px-5 py-3.5 text-left text-[11px] text-[#afb0aa] transition hover:bg-[#fcfcfa] hover:text-[#797a73]" onClick={() => setIsAdding(true)} type="button"><Plus size={14} /> Add a task</button>
          )}
        </section>

        <footer className="mt-5 flex items-center justify-between px-1 text-[10px] text-[#b4b5ae]">
          <span className="flex items-center gap-1.5"><Sparkles size={12} /> Keep showing up. That’s the whole thing.</span>
          <span>{openTasks.length} tasks left</span>
        </footer>
      </main>

      {isAdding && (
        <div className="modal-backdrop fixed inset-0 z-40 flex items-center justify-center bg-[#171815]/40 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAdding(false) }}>
          <form className="w-full max-w-[440px] rounded-[20px] border border-white/60 bg-white p-6 shadow-2xl" onSubmit={addTask}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[1.5px] text-[#91a772]"><Sparkles size={12} /> Make it happen</div>
                <h2 className="text-[20px] font-semibold tracking-[-0.7px] text-[#262722]">Add a new task</h2>
              </div>
              <button aria-label="Close dialog" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#92938c] transition hover:bg-[#f3f3f0] hover:text-[#4b4c46]" onClick={() => setIsAdding(false)} type="button"><X size={16} /></button>
            </div>
            <label className="mb-4 block text-[11px] font-medium text-[#6f7069]">
              What’s on your mind?
              <input autoFocus className="mt-2 h-11 w-full rounded-xl border border-[#e9e9e5] px-3 text-[13px] text-[#30312c] outline-none transition placeholder:text-[#b6b7b1] focus:border-[#a3ba80] focus:ring-2 focus:ring-[#eaf0e1]" onChange={(event) => setDraftTitle(event.target.value)} placeholder="e.g. Plan the team offsite" value={draftTitle} />
            </label>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <label className="text-[11px] font-medium text-[#6f7069]">
                Collection
                <select className="mt-2 h-10 w-full rounded-xl border border-[#e9e9e5] bg-white px-3 text-[12px] text-[#4c4d47] outline-none focus:border-[#a3ba80]" onChange={(event) => setDraftCategory(event.target.value)} value={draftCategory}>
                  {categories.map((category) => <option key={category}>{category}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-medium text-[#6f7069]">
                Priority
                <select className="mt-2 h-10 w-full rounded-xl border border-[#e9e9e5] bg-white px-3 text-[12px] text-[#4c4d47] outline-none focus:border-[#a3ba80]" onChange={(event) => setDraftPriority(event.target.value)} value={draftPriority}>
                  {priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}
                </select>
              </label>
            </div>
            <label className="mb-6 block text-[11px] font-medium text-[#6f7069]">
              Due date
              <input className="mt-2 h-10 w-full rounded-xl border border-[#e9e9e5] bg-white px-3 text-[12px] text-[#4c4d47] outline-none focus:border-[#a3ba80]" onChange={(event) => setDraftDate(event.target.value)} type="date" value={draftDate} />
            </label>
            <div className="flex justify-end gap-2 border-t border-[#f1f1ee] pt-4">
              <button className="rounded-xl px-4 py-2.5 text-[12px] font-medium text-[#777871] transition hover:bg-[#f5f5f2]" onClick={() => setIsAdding(false)} type="button">Cancel</button>
              <button className="flex items-center gap-1.5 rounded-xl bg-[#20211f] px-4 py-2.5 text-[12px] font-medium text-white transition hover:bg-[#353630] disabled:cursor-not-allowed disabled:opacity-40" disabled={!draftTitle.trim()} type="submit"><Plus size={14} /> Create task</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
