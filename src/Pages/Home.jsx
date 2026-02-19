import { useMemo, useState } from "react";
import TodoForm from "../Components/TodoForm";
import TodoList from "../Components/TodoList";
import { createTodo } from "../Interfaces/todo";
import { useTodos } from "../hooks/useTodos";

const STORAGE_KEY = "study_planner_v1";

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "homework", label: "Homework" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dueToDayDate(dueDate) {
  if (!dueDate) return null;
  const [y, m, d] = dueDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function daysUntil(dueDate) {
  const due = dueToDayDate(dueDate);
  if (!due) return null;
  const today = startOfDay(new Date());
  const dueDay = startOfDay(due);
  const diffMs = dueDay.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

// ✅ Sort priority: Overdue -> Today -> Tomorrow -> Upcoming -> Completed -> No due date -> createdAt
function sortRank(todo) {
  if (!todo?.dueDate) return { group: 6, dueDays: Number.POSITIVE_INFINITY }; // No due date

  // Completed goes after upcoming
  if (todo.isCompleted) return { group: 5, dueDays: Number.POSITIVE_INFINITY };

  const d = daysUntil(todo.dueDate);
  if (d == null) return { group: 6, dueDays: Number.POSITIVE_INFINITY };

  if (d < 0) return { group: 0, dueDays: d }; // Overdue (top)
  if (d === 0) return { group: 1, dueDays: d }; // Today
  if (d === 1) return { group: 2, dueDays: d }; // Tomorrow
  return { group: 3, dueDays: d }; // Upcoming
}

// ✅ Default seed list (matches your screenshots)
function getDefaultSeed() {
  // Overdue / Today / Tomorrow examples
  const t1 = createTodo("Teaching Assistant (quizzes)", "2026-02-19", "other"); // Today
  const t2 = createTodo("Minitab Kurulumu", "2026-02-20", "other"); // Tomorrow
  const t3 = createTodo("SAP Kurulumu", "2026-02-17", "other"); // Overdue
  const t4 = createTodo("Lojistikte Planlama ve Modelleme II", "2026-02-19", "other");
  t4.isCompleted = true;
  const t5 = createTodo("Mühendislik İstatistiği II", "2026-02-20", "project");
  t5.isCompleted = true;
  const t6 = createTodo("Numerik Analiz II", "2026-02-24", "homework");
  t6.isCompleted = true;
  const t7 = createTodo("Otomasyon", "2026-02-23", "quiz");
  const t8 = createTodo("SAP ile Kurumsal Kaynak Planlaması", "2026-02-24", "exam");
  const t9 = createTodo("Simülasyon (AREN temelleri - ilk lab)", "2026-02-24", "homework");
  const t10 = createTodo("Simülasyon", "2026-03-03", "quiz");

  return [t1, t2, t3, t4, t5, t7, t6, t8, t9, t10];
}

export default function Home() {
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [typeFilter, setTypeFilter] = useState("all"); // all | quiz | exam | homework | project | other
  const [query, setQuery] = useState("");

  // ✅ keep seed stable
  const seedTodos = useMemo(() => getDefaultSeed(), []);

  // ✅ todos state + CRUD from hook
  const {
    todos,
    addTodo,
    deleteTodo,
    toggleTodo,
    updateTodo,
    markAllCompleted,
    clearCompleted,
    undo,
    undoDelete,
  } = useTodos({ storageKey: STORAGE_KEY, seedTodos });

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.isCompleted).length;
    return { total, completed };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const q = query.trim().toLowerCase();

    const base = todos
      .filter((t) => {
        if (filter === "active") return !t.isCompleted;
        if (filter === "completed") return t.isCompleted;
        return true;
      })
      .filter((t) => {
        if (typeFilter === "all") return true;
        return (t.type || "other") === typeFilter;
      })
      .filter((t) => {
        if (!q) return true;
        return (t.title || "").toLowerCase().includes(q);
      });

    const sorted = [...base].sort((a, b) => {
      const ra = sortRank(a);
      const rb = sortRank(b);

      if (ra.group !== rb.group) return ra.group - rb.group;

      // within Overdue/Today/Tomorrow/Upcoming: closest first
      if (ra.group <= 3) {
        if (ra.dueDays !== rb.dueDays) return ra.dueDays - rb.dueDays;

        const aDue = dueToDayDate(a.dueDate);
        const bDue = dueToDayDate(b.dueDate);
        if (aDue && bDue) {
          const diff = aDue.getTime() - bDue.getTime();
          if (diff !== 0) return diff;
        }
      }

      // stable by createdAt
      const aC = new Date(a.createdAt || 0).getTime();
      const bC = new Date(b.createdAt || 0).getTime();
      return aC - bC;
    });

    return sorted;
  }, [todos, filter, typeFilter, query]);

  const FilterButton = ({ value, children }) => {
    const active = filter === value;
    return (
      <button
        type="button"
        onClick={() => setFilter(value)}
        className={`h-9 px-3 rounded-xl text-sm font-semibold border transition
          ${
            active
              ? "border-sky-400/40 bg-sky-500/15 text-slate-100"
              : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
          }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute bottom-[-220px] left-[-180px] h-[520px] w-[520px] rounded-full bg-indigo-500/15 blur-[120px]" />
        <div className="absolute bottom-[-240px] right-[-180px] h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-[120px]" />
      </div>

      <main className="relative min-h-screen grid place-items-center px-4 py-10">
        <section className="w-full max-w-[620px] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_-20px_rgba(0,0,0,0.65)]">
          <div className="p-7 sm:p-9">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
              Study Planner
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              {stats.total} tasks • {stats.completed} completed
            </p>

            {/* Search + Filters */}
            <div className="mt-5 space-y-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search study tasks..."
                className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-slate-100 placeholder:text-slate-400 outline-none
                           focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
              />

              <div className="flex flex-wrap items-center gap-2">
                <FilterButton value="all">All</FilterButton>
                <FilterButton value="active">Active</FilterButton>
                <FilterButton value="completed">Completed</FilterButton>

                {/* Type Filter */}
                <div className="ml-0 sm:ml-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none
                               focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20
                               [color-scheme:dark]"
                    title="Filter by type"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-white text-slate-900"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={markAllCompleted}
                  disabled={todos.length === 0 || stats.completed === stats.total}
                  className="h-9 px-3 rounded-xl text-sm font-semibold
                             border border-white/10 bg-white/5 text-slate-300
                             hover:bg-white/10 transition
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white/5"
                >
                  Mark all
                </button>

                <button
                  type="button"
                  onClick={clearCompleted}
                  disabled={stats.completed === 0}
                  className="h-9 px-3 rounded-xl text-sm font-semibold
                             border border-rose-500/30 bg-rose-500/10 text-rose-100
                             hover:bg-rose-500/15 transition
                             disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-500/10"
                >
                  Clear completed
                </button>
              </div>
            </div>

            <div className="mt-6">
              <TodoForm addTodo={addTodo} />
            </div>

            <div className="mt-6">
              <TodoList
                todos={filteredTodos}
                deleteTodo={deleteTodo}
                toggleTodo={toggleTodo}
                updateTodo={updateTodo}
              />

              <p className="mt-3 text-xs text-slate-400">
                Showing {filteredTodos.length} of {todos.length}
              </p>
            </div>
          </div>
        </section>

        {/* Undo Toast */}
        {undo?.todo && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl px-4 py-3 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.75)] flex items-center gap-3">
              <span className="text-sm text-slate-200">
                Deleted: <span className="font-semibold">{undo.todo.title}</span>
              </span>

              <button
                type="button"
                onClick={undoDelete}
                className="h-9 px-3 rounded-xl text-sm font-semibold
                           border border-emerald-400/30 bg-emerald-500/15
                           hover:bg-emerald-500/20 transition"
              >
                Undo
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
