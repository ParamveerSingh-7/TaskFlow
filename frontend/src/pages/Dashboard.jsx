import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getTasks,
  filterByStatus,
  filterByUser,
  deleteTask,
  getUsers,
} from "../api";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";

const STATUS_OPTIONS = ["ALL", "TODO", "IN_PROGRESS", "DONE"];

const STATUS_LABELS = {
  ALL: "All",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userFilter, setUserFilter] = useState("ALL");
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let res;
      if (statusFilter !== "ALL") {
        res = await filterByStatus(statusFilter);
      } else if (userFilter !== "ALL") {
        res = await filterByUser(userFilter);
      } else {
        res = await getTasks();
      }
      setTasks(res.data);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, userFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (isAdmin()) {
      getUsers()
        .then((res) => setUsers(res.data))
        .catch(() => {});
    }
  }, [isAdmin]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.response?.data || "Could not delete task.");
    }
  };

  const counts = {
    ALL: tasks.length,
    TODO: tasks.filter((t) => t.status === "TODO").length,
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    DONE: tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <button
            onClick={() => navigate("/tasks/new")}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New task
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setUserFilter("ALL");
              }}
              className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-sm
                ${
                  statusFilter === s
                    ? "border-indigo-400 ring-1 ring-indigo-400"
                    : "border-gray-200"
                }`}
            >
              <div className="text-2xl font-bold text-gray-900">
                {counts[s]}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">
                {STATUS_LABELS[s]}
              </div>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 010 2H4a1 1 0 01-1-1zM6 10h12M9 16h6"
              />
            </svg>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setUserFilter("ALL");
              }}
              className="text-sm text-gray-700 bg-transparent focus:outline-none"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {isAdmin() && users.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <select
                value={userFilter}
                onChange={(e) => {
                  setUserFilter(e.target.value);
                  setStatusFilter("ALL");
                }}
                className="text-sm text-gray-700 bg-transparent focus:outline-none"
              >
                <option value="ALL">All users</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(statusFilter !== "ALL" || userFilter !== "ALL") && (
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setUserFilter("ALL");
              }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700 text-sm">
            {error}
            <button
              onClick={fetchTasks}
              className="block mx-auto mt-2 text-red-600 font-medium underline"
            >
              Retry
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title="No tasks found"
            description={
              statusFilter !== "ALL"
                ? "No tasks match this filter."
                : "Create your first task to get started."
            }
            action={
              statusFilter === "ALL"
                ? { label: "New task", onClick: () => navigate("/tasks/new") }
                : null
            }
          />
        ) : (
          <div className="grid gap-3">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => navigate(`/tasks/${task.id}/edit`)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
