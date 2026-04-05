"use client";

import { useState, useEffect, useRef } from "react";
import { getAuth } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface Step {
  step: number;
  action: string;
  result: string;
  status: string;
}

interface AgentTask {
  id: number;
  title: string;
  instruction: string;
  status: string;
  steps: Step[];
  result: string | null;
  model_id: string;
  total_steps: number;
  total_cost_usd: number;
  created_at: string | null;
  completed_at: string | null;
}

export default function AgentPage() {
  const [instruction, setInstruction] = useState("");
  const [maxSteps, setMaxSteps] = useState(5);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeTask, setActiveTask] = useState<AgentTask | null>(null);
  const [running, setRunning] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const auth = getAuth();

  const fetchTasks = async () => {
    if (!auth) return;
    const res = await fetch(`${API_URL}/api/agent/tasks`, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) { const d = await res.json(); setTasks(d.tasks); }
  };

  useEffect(() => { fetchTasks(); }, []);

  const pollTask = (taskId: number) => {
    if (pollRef.current) clearTimeout(pollRef.current);
    let delay = 1500;
    const poll = async () => {
      if (!auth) return;
      try {
        const res = await fetch(`${API_URL}/api/agent/tasks/${taskId}`, { headers: { Authorization: `Bearer ${auth.token}` } });
        if (res.ok) {
          const task = await res.json();
          setActiveTask(task);
          if (task.status !== "running") {
            setRunning(false);
            fetchTasks();
            return;
          }
        }
      } catch {}
      delay = Math.min(delay * 1.3, 8000); // exponential backoff up to 8s
      pollRef.current = setTimeout(poll, delay);
    };
    pollRef.current = setTimeout(poll, delay);
  };

  useEffect(() => { return () => { if (pollRef.current) clearTimeout(pollRef.current); }; }, []);

  const runAgent = async () => {
    if (!auth || !instruction.trim() || running) return;
    setRunning(true);
    try {
      const res = await fetch(`${API_URL}/api/agent/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, max_steps: maxSteps }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveTask({ id: data.id, title: instruction.slice(0, 100), instruction, status: "running", steps: [], result: null, model_id: "gpt-4o-mini", total_steps: 0, total_cost_usd: 0, created_at: new Date().toISOString(), completed_at: null });
        setInstruction("");
        pollTask(data.id);
      } else {
        const err = await res.json();
        alert(err.detail || "Ошибка");
        setRunning(false);
      }
    } catch { setRunning(false); }
  };

  const loadTask = async (taskId: number) => {
    if (!auth) return;
    const res = await fetch(`${API_URL}/api/agent/tasks/${taskId}`, { headers: { Authorization: `Bearer ${auth.token}` } });
    if (res.ok) {
      const task = await res.json();
      setActiveTask(task);
      if (task.status === "running") pollTask(taskId);
    }
  };

  if (!auth) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <p className="text-text/40">Войдите чтобы использовать AI-агента</p>
      <a href="/profile" className="text-accent font-bold hover:underline mt-2 inline-block">Войти</a>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">AI-Агент</h1>
          <p className="text-sm text-text/40 mt-1">Автономное выполнение сложных задач по шагам</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-text/5 p-5 mb-6">
          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Опишите задачу, которую должен выполнить агент...

Примеры:
- Проанализируй рынок AI-сервисов в России и составь отчёт
- Напиши бизнес-план для онлайн-школы
- Составь контент-план на месяц для Telegram-канала"
            rows={4}
            className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <label className="text-xs text-text/40">Шагов:</label>
              <select value={maxSteps} onChange={e => setMaxSteps(Number(e.target.value))}
                className="bg-bg border border-text/10 rounded-lg px-2 py-1 text-sm">
                {[3, 5, 7, 10].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-[10px] text-text/25">~{(maxSteps * 0.5).toFixed(0)}₽</span>
            </div>
            <button
              onClick={runAgent}
              disabled={running || !instruction.trim()}
              className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {running ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Выполняется...
                </>
              ) : "Запустить агента"}
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Active task */}
          <div className="flex-1 min-w-0">
            {activeTask ? (
              <div className="bg-white rounded-2xl border border-text/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-text truncate">{activeTask.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTask.status === "completed" ? "bg-teal/10 text-teal"
                    : activeTask.status === "running" ? "bg-amber-500/10 text-amber-500"
                    : "bg-red-500/10 text-red-500"
                  }`}>
                    {activeTask.status === "completed" ? "Готово" : activeTask.status === "running" ? "Выполняется..." : "Ошибка"}
                  </span>
                </div>

                {/* Steps */}
                <div className="space-y-3">
                  {activeTask.steps.map((step, i) => (
                    <div key={i} className="relative pl-6">
                      <div className={`absolute left-0 top-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        step.status === "completed" ? "bg-teal/10 text-teal" : "bg-red-500/10 text-red-500"
                      }`}>
                        {step.step}
                      </div>
                      {i < activeTask.steps.length - 1 && <div className="absolute left-[7px] top-5 bottom-0 w-px bg-text/10" />}
                      <div className="pb-2">
                        <p className="text-xs font-semibold text-text/60 mb-1">{step.action}</p>
                        <p className="text-xs text-text/50 whitespace-pre-wrap leading-relaxed">{step.result}</p>
                      </div>
                    </div>
                  ))}
                  {activeTask.status === "running" && (
                    <div className="pl-6 flex items-center gap-2 text-xs text-accent">
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Шаг {(activeTask.steps.length || 0) + 1}...
                    </div>
                  )}
                </div>

                {/* Error detail */}
                {activeTask.status === "failed" && activeTask.result && (
                  <div className="mt-3 p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                    <p className="text-[11px] font-semibold text-red-500 mb-1">Причина ошибки:</p>
                    <p className="text-xs text-text/50">{activeTask.result}</p>
                  </div>
                )}

                {/* Final result for completed */}
                {activeTask.status === "completed" && activeTask.result && activeTask.steps.length > 1 && (
                  <div className="mt-3 p-3 bg-teal/5 border border-teal/10 rounded-xl">
                    <p className="text-[11px] font-semibold text-teal mb-1">Итог:</p>
                    <p className="text-xs text-text/60 whitespace-pre-wrap">{activeTask.result}</p>
                  </div>
                )}

                {activeTask.total_cost_usd > 0 && (
                  <p className="text-[10px] text-text/20 mt-4 pt-3 border-t border-text/5">
                    {activeTask.total_steps} шагов · {Math.round(activeTask.total_cost_usd * 95)}₽
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3 opacity-15">🤖</div>
                <p className="text-text/25 text-sm">Опишите задачу и запустите агента</p>
              </div>
            )}
          </div>

          {/* History sidebar */}
          {tasks.length > 0 && (
            <div className="hidden lg:block w-64 shrink-0">
              <h4 className="text-[10px] font-bold text-text/30 uppercase tracking-wider mb-3">История</h4>
              <div className="space-y-1.5">
                {tasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => loadTask(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors ${
                      activeTask?.id === t.id ? "bg-accent/10 text-accent" : "text-text/50 hover:bg-text/[0.04]"
                    }`}
                  >
                    <p className="font-medium truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        t.status === "completed" ? "bg-teal" : t.status === "running" ? "bg-amber-500 animate-pulse" : "bg-red-400"
                      }`} />
                      <span className="text-text/25">{t.total_steps} шагов</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
