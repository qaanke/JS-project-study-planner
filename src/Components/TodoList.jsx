import { useEffect, useMemo, useRef, useState } from "react";

const TYPE_OPTIONS = [
  { value: "quiz", label: "Quiz" },
  { value: "exam", label: "Exam" },
  { value: "homework", label: "Homework" },
  { value: "project", label: "Project" },
  { value: "other", label: "Other" },
];

function formatDue(dueDate) {
  if (!dueDate) return "";
  const [y, m, d] = dueDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

function titleCaseType(type) {
  if (!type) return "Other";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

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

function isUrgent(todo) {
  if (!todo?.dueDate) return false;
  if (todo.isCompleted) return false;
  const d = daysUntil(todo.dueDate);
  return d === 0 || d === 1; // Today / Tomorrow
}

function dueStatus(todo) {
  if (!todo?.dueDate) return null;
  if (todo.isCompleted) return null;

  const d = daysUntil(todo.dueDate);
  if (d == null) return null;

  if (d < 0) return { label: "Overdue", tone: "overdue" };
  if (d === 0) return { label: "Today", tone: "today" };
  if (d === 1) return { label: "Tomorrow", tone: "tomorrow" };

  return null;
}

export default function TodoList({ todos, deleteTodo, toggleTodo, updateTodo }) {
  const [editingId, setEditingId] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("other");
  const [editDueDate, setEditDueDate] = useState(""); // "" | "YYYY-MM-DD"

  const editTitleRef = useRef(null);

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title || "");
    setEditType(todo.type || "other");
    setEditDueDate(todo.dueDate || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditType("other");
    setEditDueDate("");
  };

  const saveEdit = () => {
    const title = editTitle.trim();
    if (!title) return;

    const type = (editType || "other").trim();
    const dueDate = editDueDate ? editDueDate : null;

    // ✅ update 3 alan birden
    updateTodo(editingId, { title, type, dueDate });

    cancelEdit();
  };

  useEffect(() => {
    if (editingId && editTitleRef.current) {
      editTitleRef.current.focus();
      editTitleRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const onKey = (e) => {
      if (editingId == null) return;
      if (e.key === "Enter") saveEdit();
      if (e.key === "Escape") cancelEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, editTitle, editType, editDueDate]);

  const empty = useMemo(() => todos.length === 0, [todos]);

  if (empty) {
    return (
      <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-slate-300">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-9 w-9 rounded-xl border border-white/10 bg-white/5 grid place-items-center">
            📚
          </div>
          <div>
            <p className="font-semibold text-slate-100">No study tasks yet</p>
            <p className="text-sm text-slate-300 mt-1">
              Add your next quiz, exam, homework or project task above.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {todos.map((todo) => {
        const editing = editingId === todo.id;
        const due = formatDue(todo.dueDate);
        const typeLabel = titleCaseType(todo.type);

        const urgent = isUrgent(todo);
        const status = dueStatus(todo);
        const overdue = status?.tone === "overdue";

        return (
          <li
            key={todo.id}
            className={[
              "rounded-2xl border bg-white/5 px-4 py-4 transition",
              "shadow-[0_10px_30px_-18px_rgba(0,0,0,0.65)] hover:bg-white/7",
              overdue
                ? "border-rose-500/55 bg-rose-500/10"
                : urgent
                ? "border-amber-400/35 bg-amber-500/10"
                : "border-white/10",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              {/* Checkbox */}
              <label className="shrink-0 flex items-center gap-2 select-none">
                <input
                  type="checkbox"
                  checked={!!todo.isCompleted}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-4 w-4 accent-sky-400"
                  aria-label="Toggle completed"
                  disabled={editing}
                />
              </label>

              {/* Middle */}
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="space-y-3">
                    {/* Title */}
                    <input
                      ref={editTitleRef}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-slate-100 outline-none
                                 focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20"
                      placeholder="Task title..."
                    />

                    {/* Type + Due date */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={editType}
                        onChange={(e) => setEditType(e.target.value)}
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none
                                   focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20
                                   [color-scheme:dark]"
                        title="Type"
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

                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none
                                   focus:border-emerald-400/40 focus:ring-2 focus:ring-emerald-400/20
                                   [color-scheme:dark]"
                        title="Due date"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Type badge */}
                      <span
                        className={[
                          "text-xs px-2 py-0.5 rounded-lg border bg-white/5 shrink-0",
                          overdue
                            ? "border-rose-500/40 text-rose-100 bg-rose-500/15"
                            : urgent
                            ? "border-amber-400/30 text-amber-100 bg-amber-500/10"
                            : "border-white/10 text-slate-200",
                        ].join(" ")}
                        title="Type"
                      >
                        {typeLabel}
                      </span>

                      {/* Due status badge */}
                      {status && (
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded-lg border bg-white/5 shrink-0",
                            status.tone === "overdue"
                              ? "border-rose-500/40 text-rose-100 bg-rose-500/15"
                              : "border-amber-400/30 text-amber-100 bg-amber-500/10",
                          ].join(" ")}
                          title="Due status"
                        >
                          {status.tone === "overdue" ? "⛔" : "⏳"}{" "}
                          {status.label}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleTodo(todo.id)}
                        className={`text-left w-full select-none truncate ${
                          todo.isCompleted
                            ? "text-slate-400 line-through"
                            : "text-slate-100"
                        }`}
                        title="Click to toggle complete"
                      >
                        {todo.title}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {due ? (
                        <span
                          className={[
                            "text-xs px-2 py-0.5 rounded-lg border bg-white/5",
                            overdue
                              ? "border-rose-500/40 text-rose-100 bg-rose-500/15"
                              : urgent
                              ? "border-amber-400/30 text-amber-100 bg-amber-500/10"
                              : "border-white/10 text-slate-300",
                            todo.isCompleted ? "opacity-60" : "",
                          ].join(" ")}
                          title="Due date"
                        >
                          Due: {due}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">
                          No due date
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right buttons */}
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="h-10 px-4 rounded-xl font-semibold
                                 border border-emerald-400/30 bg-emerald-500/15
                                 hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/25"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="h-10 px-4 rounded-xl font-semibold
                                 border border-white/10 bg-white/5
                                 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/15"
                      title="Esc"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(todo)}
                      className="h-10 px-4 rounded-xl font-semibold
                                 border border-white/10 bg-white/5
                                 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/15"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTodo(todo.id)}
                      className="h-10 px-4 rounded-xl font-semibold text-rose-100
                                 border border-rose-500/30 bg-rose-500/10
                                 hover:bg-rose-500/15 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
