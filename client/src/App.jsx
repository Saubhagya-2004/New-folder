import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function DashboardChart({ tasks }) {
  const monthData = useMemo(() => {
    const now = new Date();
    const data = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: monthShort[date.getMonth()],
        total: 0,
      };
    });

    const lookup = new Map(data.map((item, index) => [item.key, index]));
    tasks.forEach((task) => {
      const created = new Date(task.createdAt);
      const key = `${created.getFullYear()}-${created.getMonth()}`;
      const target = lookup.get(key);
      if (target !== undefined) {
        data[target].total += 1;
      }
    });

    return data;
  }, [tasks]);

  const maxValue = Math.max(...monthData.map((item) => item.total), 1);
  const width = 600;
  const height = 220;
  const horizontalPadding = 36;
  const usableWidth = width - horizontalPadding * 2;
  const baseY = 180;
  const points = monthData
    .map((item, index) => {
      const x = horizontalPadding + (index * usableWidth) / (monthData.length - 1);
      const y = baseY - (item.total / maxValue) * 120;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Task Graph</h3>
        <p className="text-xs text-slate-500">Last 6 months</p>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
        <line x1="36" y1="180" x2="564" y2="180" stroke="#cbd5e1" strokeWidth="1.5" />
        <polyline fill="none" stroke="#4f46e5" strokeWidth="3" points={points} strokeLinecap="round" />
        {monthData.map((item, index) => {
          const x = horizontalPadding + (index * usableWidth) / (monthData.length - 1);
          const y = baseY - (item.total / maxValue) * 120;
          return (
            <g key={item.key}>
              <circle cx={x} cy={y} r="5" fill="#2563eb" />
              <text x={x} y="205" fontSize="12" textAnchor="middle" fill="#64748b">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function AuthCard({ mode, authForm, setAuthForm, onSubmit, message }) {
  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-lg ring-1 ring-slate-200">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">{isSignup ? "Create Account" : "Welcome Back"}</h1>
      <p className="mb-6 text-sm text-slate-500">{isSignup ? "Sign up to start managing tasks." : "Login to open your dashboard."}</p>
      {message && <p className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">{message}</p>}
      <form onSubmit={onSubmit} className="space-y-3">
        {isSignup && (
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="Name"
            value={authForm.name}
            onChange={(event) => setAuthForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
        )}
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="Email"
          type="email"
          value={authForm.email}
          onChange={(event) => setAuthForm((prev) => ({ ...prev, email: event.target.value }))}
          required
        />
        <input
          className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
          placeholder="Password"
          type="password"
          value={authForm.password}
          onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <button className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700" type="submit">
          {isSignup ? "Sign Up" : "Login"}
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-600">
        {isSignup ? "Already have an account?" : "No account yet?"}{" "}
        <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Login" : "Sign up"}
        </Link>
      </p>
    </div>
  );
}

function Dashboard({ user, tasks, message, loadingTasks, taskTitle, setTaskTitle, onCreateTask, onToggleTask, onDeleteTask, onLogout }) {
  const completedTasks = tasks.filter((task) => task.status === "Completed").length;
  const pendingTasks = tasks.length - completedTasks;

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Task Dashboard</h1>
        <button onClick={onLogout} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Logout
        </button>
      </div>

      {message && <p className="mb-5 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-200">{message}</p>}

      <section className="mb-5 grid gap-4 md:grid-cols-4">
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Task Completed</p>
          <h3 className="mt-2 text-2xl font-bold text-indigo-600">{completedTasks}</h3>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">New Tasks</p>
          <h3 className="mt-2 text-2xl font-bold text-sky-600">{tasks.length}</h3>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Pending</p>
          <h3 className="mt-2 text-2xl font-bold text-orange-500">{pendingTasks}</h3>
        </article>
        <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Profile</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-600">
              {getInitials(user?.name || "U")}
            </div>
            <div>
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="font-semibold text-slate-900">{user?.name || "User"}</p>
            </div>
          </div>
        </article>
      </section>

      <DashboardChart tasks={tasks} />

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-3 text-xl font-semibold text-slate-900">Task List</h2>
        <form onSubmit={onCreateTask} className="mb-4 flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
            placeholder="Add a task title"
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            required
          />
          <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">
            Add
          </button>
        </form>

        {loadingTasks ? (
          <p className="text-sm text-slate-600">Loading tasks...</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <div>
                  <p className={task.status === "Completed" ? "font-medium text-slate-400 line-through" : "font-medium text-slate-800"}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-500">{task.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onToggleTask(task)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">
                    Toggle
                  </button>
                  <button onClick={() => onDeleteTask(task._id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700">
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks added yet.</p>}
          </ul>
        )}
      </section>
    </main>
  );
}

function App() {
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [taskTitle, setTaskTitle] = useState("");
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }, []);

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("token", token);
    let cancelled = false;

    Promise.resolve().then(async () => {
      try {
        setLoadingTasks(true);
        const [profileData, taskData] = await Promise.all([
          request("/auth/me", { headers: authHeaders }),
          request("/tasks", { headers: authHeaders }),
        ]);
        if (cancelled) return;
        setUser(profileData.user);
        setTasks(taskData);
        if (location.pathname === "/login" || location.pathname === "/signup" || location.pathname === "/") {
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        if (cancelled) return;
        setMessage(error.message);
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
        setTasks([]);
        navigate("/login", { replace: true });
      } finally {
        if (!cancelled) {
          setLoadingTasks(false);
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token, request, authHeaders, location.pathname, navigate]);

  const handleAuth = async (mode, event) => {
    event.preventDefault();
    try {
      const endpoint = mode === "signup" ? "/auth/signup" : "/auth/login";
      const payload = mode === "signup" ? authForm : { email: authForm.email, password: authForm.password };
      const data = await request(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setToken(data.token);
      setMessage(`${mode === "signup" ? "Signup" : "Login"} successful`);
      setAuthForm({ name: "", email: "", password: "" });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    try {
      const newTask = await request("/tasks", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ title: taskTitle }),
      });
      setTasks((prev) => [newTask, ...prev]);
      setTaskTitle("");
      setMessage("Task created");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const toggleTaskStatus = async (task) => {
    const nextStatus = task.status === "Pending" ? "Completed" : "Pending";
    try {
      const updated = await request(`/tasks/${task._id}/status`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: nextStatus }),
      });
      setTasks((prev) => prev.map((item) => (item._id === task._id ? updated : item)));
    } catch (error) {
      setMessage(error.message);
    }
  };

  const deleteTask = async (id) => {
    try {
      await request(`/tasks/${id}`, { method: "DELETE", headers: authHeaders });
      setTasks((prev) => prev.filter((task) => task._id !== id));
      setMessage("Task deleted");
    } catch (error) {
      setMessage(error.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setTasks([]);
    setMessage("Logged out");
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <main className="flex min-h-screen items-center justify-center p-4">
              <AuthCard
                mode="login"
                authForm={authForm}
                setAuthForm={setAuthForm}
                onSubmit={(event) => handleAuth("login", event)}
                message={message}
              />
            </main>
          )
        }
      />
      <Route
        path="/signup"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <main className="flex min-h-screen items-center justify-center p-4">
              <AuthCard
                mode="signup"
                authForm={authForm}
                setAuthForm={setAuthForm}
                onSubmit={(event) => handleAuth("signup", event)}
                message={message}
              />
            </main>
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          token ? (
            <Dashboard
              user={user}
              tasks={tasks}
              loadingTasks={loadingTasks}
              message={message}
              taskTitle={taskTitle}
              setTaskTitle={setTaskTitle}
              onCreateTask={handleCreateTask}
              onToggleTask={toggleTaskStatus}
              onDeleteTask={deleteTask}
              onLogout={logout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
