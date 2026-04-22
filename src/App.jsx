import { useState, useEffect, useRef, useCallback } from "react";

// ── CLAUDE API ──────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, userMessage) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

const AI_SYSTEM = `Você é um assistente de produtividade. Responda APENAS em JSON válido, sem markdown, sem explicações.`;

async function analyzeTask(title) {
  const prompt = `Analise esta tarefa: "${title}"

Retorne JSON com exatamente este formato:
{
  "subtasks": ["subtarefa 1", "subtarefa 2", "subtarefa 3"],
  "estimatedMinutes": 30,
  "priority": "alta",
  "priorityReason": "motivo curto em 1 frase",
  "pomodoroCount": 2
}

Regras:
- subtasks: 2-4 itens, acionáveis, em português
- estimatedMinutes: número inteiro realista
- priority: "alta", "média" ou "baixa"
- pomodoroCount: quantos pomodoros de 25min serão necessários`;

  try {
    const raw = await callClaude(AI_SYSTEM, prompt);
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

// ── POMODORO HOOK ────────────────────────────────────────────────────────────
function usePomodoro() {
  const [phase, setPhase] = useState("idle"); // idle | work | break
  const [seconds, setSeconds] = useState(25 * 60);
  const [cycles, setCycles] = useState(0);
  const intervalRef = useRef(null);

  const start = useCallback((workMin = 25) => {
    setPhase("work");
    setSeconds(workMin * 60);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setCycles((c) => c + 1);
          setPhase("break");
          setSeconds(5 * 60);
          setTimeout(() => {
            setPhase("idle");
            setSeconds(workMin * 60);
          }, 5 * 60 * 1000);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    clearInterval(intervalRef.current);
    setPhase("idle");
    setSeconds(25 * 60);
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return { phase, timer: `${mins}:${secs}`, cycles, start, stop };
}

// ── PRIORITY CONFIG ──────────────────────────────────────────────────────────
const PRIORITY_META = {
  alta: { color: "#ff4444", bg: "rgba(255,68,68,0.12)", label: "ALTA" },
  média: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "MÉDIA" },
  baixa: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", label: "BAIXA" },
};

// ── STYLES ────────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;700;800&display=swap');`;

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0f; }

  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a26;
    --border: rgba(255,255,255,0.07);
    --accent: #7c6aff;
    --accent2: #c084fc;
    --text: #e8e8f0;
    --muted: rgba(232,232,240,0.45);
    --radius: 12px;
  }

  .app {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    padding: 32px 20px 80px;
    max-width: 780px;
    margin: 0 auto;
    position: relative;
  }

  .app::before {
    content: '';
    position: fixed;
    top: -200px; left: 50%; transform: translateX(-50%);
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(124,106,255,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* HEADER */
  .header { margin-bottom: 36px; }
  .header h1 {
    font-size: 2rem; font-weight: 800; letter-spacing: -0.03em;
    background: linear-gradient(135deg, #fff 30%, var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    line-height: 1;
  }
  .header p { color: var(--muted); font-size: 0.85rem; margin-top: 6px; font-family: 'Space Mono', monospace; }

  /* POMODORO */
  .pomo-bar {
    display: flex; align-items: center; gap: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 12px 18px;
    margin-bottom: 24px;
  }
  .pomo-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--muted);
    transition: background 0.3s;
  }
  .pomo-dot.work { background: var(--accent); box-shadow: 0 0 8px var(--accent); animation: pulse 1s infinite; }
  .pomo-dot.break { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  .pomo-timer { font-family: 'Space Mono', monospace; font-size: 1.3rem; font-weight: 700; color: var(--text); }
  .pomo-label { font-size: 0.75rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; flex: 1; }
  .pomo-cycles { font-family: 'Space Mono', monospace; font-size: 0.75rem; color: var(--accent2); }
  .btn-pomo {
    background: var(--accent); color: #fff; border: none; border-radius: 8px;
    padding: 6px 14px; font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700;
    cursor: pointer; transition: opacity 0.2s;
  }
  .btn-pomo:hover { opacity: 0.85; }
  .btn-pomo.stop { background: rgba(255,68,68,0.25); color: #ff6b6b; }

  /* INPUT */
  .input-row {
    display: flex; gap: 10px; margin-bottom: 12px;
  }
  .input-task {
    flex: 1; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 13px 16px;
    color: var(--text); font-family: 'Syne', sans-serif; font-size: 0.95rem;
    outline: none; transition: border-color 0.2s;
  }
  .input-task:focus { border-color: var(--accent); }
  .input-task::placeholder { color: var(--muted); }
  .btn-add {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    border: none; border-radius: var(--radius);
    color: #fff; font-family: 'Syne', sans-serif; font-size: 0.9rem; font-weight: 700;
    padding: 0 22px; cursor: pointer; white-space: nowrap;
    transition: opacity 0.2s, transform 0.1s;
  }
  .btn-add:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-add:disabled { opacity: 0.4; transform: none; cursor: not-allowed; }

  /* FILTER */
  .filter-row {
    display: flex; gap: 8px; margin-bottom: 24px;
  }
  .filter-btn {
    background: transparent; border: 1px solid var(--border);
    border-radius: 20px; padding: 5px 14px;
    color: var(--muted); font-family: 'Syne', sans-serif; font-size: 0.78rem;
    cursor: pointer; transition: all 0.2s;
  }
  .filter-btn.active {
    background: var(--accent); border-color: var(--accent);
    color: #fff;
  }
  .search-input {
    flex: 1; background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 5px 14px;
    color: var(--text); font-family: 'Syne', sans-serif; font-size: 0.78rem;
    outline: none;
  }
  .search-input::placeholder { color: var(--muted); }

  /* STATS */
  .stats { display: flex; gap: 16px; margin-bottom: 20px; }
  .stat {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px 16px; flex: 1; text-align: center;
  }
  .stat-n { font-family: 'Space Mono', monospace; font-size: 1.4rem; font-weight: 700; color: var(--text); }
  .stat-l { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

  /* TASK CARD */
  .task-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 10px;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.15s;
  }
  .task-card:hover { border-color: rgba(124,106,255,0.3); transform: translateY(-1px); }
  .task-card.done { opacity: 0.5; }
  .task-card.active-pomo { border-color: var(--accent); }

  .task-main {
    display: flex; align-items: center; gap: 12px; padding: 14px 16px;
    cursor: pointer;
  }
  .task-check {
    width: 20px; height: 20px; border-radius: 6px;
    border: 2px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; cursor: pointer;
    background: transparent;
  }
  .task-check.checked { background: var(--accent); border-color: var(--accent); }
  .task-check svg { width: 12px; height: 12px; stroke: #fff; stroke-width: 2.5; fill: none; }

  .task-title {
    flex: 1; font-size: 0.95rem; font-weight: 600; line-height: 1.3;
    transition: color 0.2s;
  }
  .task-card.done .task-title { text-decoration: line-through; color: var(--muted); }

  .task-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .tag-priority {
    font-size: 0.65rem; font-family: 'Space Mono', monospace; font-weight: 700;
    padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em;
  }
  .task-mins { font-size: 0.72rem; color: var(--muted); font-family: 'Space Mono', monospace; }

  .btn-icon {
    background: transparent; border: none; color: var(--muted);
    cursor: pointer; padding: 4px; border-radius: 6px; line-height: 1;
    font-size: 0.85rem; transition: color 0.2s, background 0.2s;
  }
  .btn-icon:hover { color: var(--text); background: var(--surface2); }
  .btn-icon.danger:hover { color: #ff4444; }

  /* AI ANALYSIS */
  .ai-loading {
    padding: 12px 16px; background: var(--surface2);
    border-top: 1px solid var(--border);
    font-size: 0.78rem; color: var(--accent);
    font-family: 'Space Mono', monospace;
    display: flex; align-items: center; gap: 8px;
  }
  .spinner {
    width: 14px; height: 14px; border: 2px solid rgba(124,106,255,0.3);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .ai-panel {
    background: var(--surface2); border-top: 1px solid var(--border);
    padding: 14px 16px;
  }
  .ai-reason {
    font-size: 0.75rem; color: var(--muted); margin-bottom: 10px;
    font-style: italic; line-height: 1.5;
  }
  .subtasks-label {
    font-size: 0.65rem; color: var(--accent2);
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-bottom: 8px; font-family: 'Space Mono', monospace;
  }
  .subtask-item {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 0; font-size: 0.82rem; color: var(--text);
    cursor: pointer; border-radius: 6px; padding: 5px 6px;
    transition: background 0.15s;
  }
  .subtask-item:hover { background: rgba(255,255,255,0.04); }
  .subtask-check {
    width: 14px; height: 14px; border-radius: 4px;
    border: 1.5px solid var(--border); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
  }
  .subtask-check.done { background: var(--accent); border-color: var(--accent); }
  .subtask-check svg { width: 9px; height: 9px; stroke: #fff; stroke-width: 3; fill: none; }
  .subtask-text { flex: 1; }
  .subtask-text.done { text-decoration: line-through; color: var(--muted); }

  .pomo-hint {
    margin-top: 10px; padding: 8px 10px;
    background: rgba(124,106,255,0.08); border-radius: 8px;
    border: 1px solid rgba(124,106,255,0.15);
    font-size: 0.75rem; color: var(--accent2);
    display: flex; align-items: center; justify-content: space-between;
  }
  .btn-start-pomo {
    background: var(--accent); color: #fff; border: none; border-radius: 6px;
    padding: 4px 10px; font-size: 0.72rem; font-family: 'Syne', sans-serif;
    font-weight: 700; cursor: pointer;
  }

  .empty {
    text-align: center; padding: 60px 20px;
    color: var(--muted); font-size: 0.9rem;
  }
  .empty span { display: block; font-size: 2.5rem; margin-bottom: 12px; }

  .clear-btn {
    background: transparent; border: 1px solid rgba(255,68,68,0.25);
    color: rgba(255,68,68,0.7); border-radius: 8px; padding: 6px 14px;
    font-size: 0.75rem; cursor: pointer; font-family: 'Syne', sans-serif;
    transition: all 0.2s; margin-top: 4px;
  }
  .clear-btn:hover { background: rgba(255,68,68,0.1); color: #ff4444; }

  .progress-bar {
    height: 3px; background: var(--border); border-radius: 2px; margin-bottom: 24px;
  }
  .progress-fill {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transition: width 0.4s ease;
  }
`;

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function App() {
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ai-todo-tasks") || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [activeTaskId, setActiveTaskId] = useState(null);
  const pomo = usePomodoro();
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ai-todo-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const addTask = async () => {
    const title = input.trim();
    if (!title) return;
    const id = crypto.randomUUID();
    const newTask = {
      id, title, completed: false,
      createdAt: new Date().toISOString(),
      ai: null, aiLoading: true, expanded: true,
      subtasksDone: [],
    };
    setTasks((t) => [newTask, ...t]);
    setInput("");
    setLoading(true);
    inputRef.current?.focus();

    const analysis = await analyzeTask(title);
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ai: analysis, aiLoading: false } : t
      )
    );
    setLoading(false);
  };

  const toggleTask = (id) => {
    setTasks((t) =>
      t.map((x) => x.id === id ? { ...x, completed: !x.completed } : x)
    );
  };

  const deleteTask = (id) => {
    setTasks((t) => t.filter((x) => x.id !== id));
    if (activeTaskId === id) { pomo.stop(); setActiveTaskId(null); }
  };

  const toggleExpand = (id) => {
    setTasks((t) =>
      t.map((x) => x.id === id ? { ...x, expanded: !x.expanded } : x)
    );
  };

  const toggleSubtask = (taskId, sub) => {
    setTasks((t) =>
      t.map((x) => {
        if (x.id !== taskId) return x;
        const done = x.subtasksDone || [];
        return {
          ...x,
          subtasksDone: done.includes(sub)
            ? done.filter((s) => s !== sub)
            : [...done, sub],
        };
      })
    );
  };

  const startPomo = (taskId, mins = 25) => {
    setActiveTaskId(taskId);
    pomo.start(mins);
  };

  const clearCompleted = () => {
    setTasks((t) => t.filter((x) => !x.completed));
  };

  // Filtered
  const visible = tasks.filter((t) => {
    if (filter === "active" && t.completed) return false;
    if (filter === "done" && !t.completed) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalDone = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? (totalDone / tasks.length) * 100 : 0;

  return (
    <>
      <style>{FONTS}{css}</style>
      <div className="app">
        {/* HEADER */}
        <div className="header">
          <h1>FlowTask AI</h1>
          <p>// produtividade com inteligência real</p>
        </div>

        {/* POMODORO BAR */}
        <div className="pomo-bar">
          <div className={`pomo-dot ${pomo.phase}`} />
          <div className="pomo-timer">{pomo.timer}</div>
          <div className="pomo-label">
            {pomo.phase === "idle" && "pronto para focar"}
            {pomo.phase === "work" && "focando…"}
            {pomo.phase === "break" && "pausa 🌿"}
          </div>
          <div className="pomo-cycles">🍅 ×{pomo.cycles}</div>
          {pomo.phase !== "idle" ? (
            <button className="btn-pomo stop" onClick={pomo.stop}>■ parar</button>
          ) : (
            <button className="btn-pomo" onClick={() => pomo.start(25)}>▶ 25 min</button>
          )}
        </div>

        {/* INPUT */}
        <div className="input-row">
          <input
            ref={inputRef}
            className="input-task"
            placeholder="O que você precisa fazer?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && addTask()}
          />
          <button className="btn-add" onClick={addTask} disabled={loading || !input.trim()}>
            {loading ? "analisando…" : "+ Adicionar"}
          </button>
        </div>

        {/* STATS */}
        <div className="stats">
          <div className="stat">
            <div className="stat-n">{tasks.length}</div>
            <div className="stat-l">Total</div>
          </div>
          <div className="stat">
            <div className="stat-n">{tasks.length - totalDone}</div>
            <div className="stat-l">Pendentes</div>
          </div>
          <div className="stat">
            <div className="stat-n">{totalDone}</div>
            <div className="stat-l">Concluídas</div>
          </div>
          <div className="stat">
            <div className="stat-n">{pomo.cycles}</div>
            <div className="stat-l">Pomodoros</div>
          </div>
        </div>

        {/* PROGRESS */}
        {tasks.length > 0 && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* FILTERS */}
        <div className="filter-row">
          {["all","active","done"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todas" : f === "active" ? "Ativas" : "Concluídas"}
            </button>
          ))}
          <input
            className="search-input"
            placeholder="🔎 buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {totalDone > 0 && (
            <button className="clear-btn" onClick={clearCompleted}>
              limpar concluídas
            </button>
          )}
        </div>

        {/* TASK LIST */}
        {visible.length === 0 ? (
          <div className="empty">
            <span>✦</span>
            {tasks.length === 0
              ? "Nenhuma tarefa ainda. Adicione acima."
              : "Nenhuma tarefa neste filtro."}
          </div>
        ) : (
          visible.map((task) => {
            const pm = task.ai ? PRIORITY_META[task.ai.priority] || PRIORITY_META["média"] : null;
            const isActivePomo = activeTaskId === task.id && pomo.phase === "work";
            return (
              <div
                key={task.id}
                className={`task-card ${task.completed ? "done" : ""} ${isActivePomo ? "active-pomo" : ""}`}
              >
                <div className="task-main" onClick={() => toggleExpand(task.id)}>
                  <div
                    className={`task-check ${task.completed ? "checked" : ""}`}
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  >
                    {task.completed && (
                      <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" /></svg>
                    )}
                  </div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    {pm && (
                      <span
                        className="tag-priority"
                        style={{ color: pm.color, background: pm.bg }}
                      >{pm.label}</span>
                    )}
                    {task.ai?.estimatedMinutes && (
                      <span className="task-mins">{task.ai.estimatedMinutes}min</span>
                    )}
                    <button
                      className="btn-icon danger"
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      title="Remover"
                    >✕</button>
                  </div>
                </div>

                {/* AI LOADING */}
                {task.aiLoading && (
                  <div className="ai-loading">
                    <div className="spinner" />
                    IA analisando tarefa…
                  </div>
                )}

                {/* AI PANEL */}
                {task.ai && task.expanded && (
                  <div className="ai-panel">
                    {task.ai.priorityReason && (
                      <div className="ai-reason">"{task.ai.priorityReason}"</div>
                    )}
                    <div className="subtasks-label">subtarefas sugeridas</div>
                    {task.ai.subtasks?.map((sub, i) => {
                      const isDone = (task.subtasksDone || []).includes(sub);
                      return (
                        <div
                          key={i}
                          className="subtask-item"
                          onClick={() => toggleSubtask(task.id, sub)}
                        >
                          <div className={`subtask-check ${isDone ? "done" : ""}`}>
                            {isDone && <svg viewBox="0 0 9 9"><polyline points="1.5,4.5 3.5,6.5 7.5,2.5" /></svg>}
                          </div>
                          <span className={`subtask-text ${isDone ? "done" : ""}`}>{sub}</span>
                        </div>
                      );
                    })}
                    {task.ai.pomodoroCount && (
                      <div className="pomo-hint">
                        <span>🍅 {task.ai.pomodoroCount} pomodoro{task.ai.pomodoroCount > 1 ? "s" : ""} estimado{task.ai.pomodoroCount > 1 ? "s" : ""}</span>
                        {pomo.phase === "idle" && (
                          <button
                            className="btn-start-pomo"
                            onClick={() => startPomo(task.id)}
                          >▶ iniciar foco</button>
                        )}
                        {isActivePomo && (
                          <span style={{ color: "#7c6aff", fontSize: "0.72rem" }}>⚡ focando agora</span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}