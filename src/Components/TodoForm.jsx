import { useMemo, useState } from "react";

export default function TodoForm({ addTodo }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState(""); // zorunlu

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && type.trim().length > 0;
  }, [title, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const v = title.trim();
    if (!v || !type) return;

    addTodo(v, dueDate ? dueDate : null, type);
    setTitle("");
    setDueDate("");
    setType("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a study task... (e.g., IE335 Quiz prep)"
          className="flex-1 h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-slate-100 placeholder:text-slate-400 outline-none
                     focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20"
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`h-11 px-5 rounded-xl font-semibold text-slate-100
                     border border-sky-400/30 bg-sky-500/15
                     hover:bg-sky-500/20 active:scale-[0.99]
                     focus:outline-none focus:ring-2 focus:ring-sky-400/30
                     disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-sky-500/15`}
        >
          Add
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Type (Required) */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <label className="text-xs text-slate-300">
            Type <span className="text-rose-200">*</span>
          </label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none
                       focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20
                       [color-scheme:dark]"
          >
            {/* ÖNEMLİ: option'lara açık tema veriyoruz -> açılır listede siyah yazı */}
            <option value="" disabled className="bg-white text-slate-900">
              Select...
            </option>
            <option value="quiz" className="bg-white text-slate-900">
              Quiz
            </option>
            <option value="exam" className="bg-white text-slate-900">
              Exam
            </option>
            <option value="homework" className="bg-white text-slate-900">
              Homework
            </option>
            <option value="project" className="bg-white text-slate-900">
              Project
            </option>
            <option value="other" className="bg-white text-slate-900">
              Other
            </option>
          </select>
        </div>

        {/* Due Date (Optional) */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <label className="text-xs text-slate-300">
            Due date <span className="text-slate-500">(optional)</span>
          </label>

          <input
            type="date"
            lang="en-GB"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none
                       focus:border-sky-400/40 focus:ring-2 focus:ring-sky-400/20
                       [color-scheme:dark]"
          />
        </div>
      </div>

      {!type && (
        <p className="text-xs text-slate-400">
          * Please choose a type to add the task.
        </p>
      )}
    </form>
  );
}
