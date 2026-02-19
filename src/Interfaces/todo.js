export const TASK_TYPES = ["quiz", "exam", "homework", "project", "other"];

export const createTodo = (title, dueDate = null, type = "other") => {
  const id =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());

  return {
    id,
    title,
    type, // quiz | exam | homework | project | other
    isCompleted: false,
    createdAt: new Date().toISOString(),
    dueDate: dueDate || null, // "YYYY-MM-DD" veya null
  };
};
