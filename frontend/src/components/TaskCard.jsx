import { useAuth } from "../context/AuthContext";

const STATUS_STYLES = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  DONE: "bg-green-100 text-green-700",
};

const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export default function TaskCard({ task, onEdit, onDelete }) {
  const { user, isAdmin } = useAuth();

  const canModify =
    isAdmin() ||
    task.createdBy?.email === user?.email ||
    task.assignedTo?.email === user?.email;

  const canDelete = isAdmin() || task.createdBy?.email === user?.email;

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 hover:shadow-sm transition-shadow flex items-start gap-4">
      <div className="mt-1 flex-shrink-0">
        <div
          className={`w-2.5 h-2.5 rounded-full mt-1 ${
            task.status === "DONE"
              ? "bg-green-500"
              : task.status === "IN_PROGRESS"
                ? "bg-blue-500"
                : "bg-gray-400"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3
              className={`font-medium text-gray-900 truncate ${task.status === "DONE" ? "line-through text-gray-400" : ""}`}
            >
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">
                {task.description}
              </p>
            )}
          </div>
          <span
            className={`flex-shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}
          >
            {STATUS_LABELS[task.status]}
          </span>
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
          {task.assignedTo && (
            <span className="flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
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
              {task.assignedTo.name || task.assignedTo.email}
            </span>
          )}
          {task.createdBy && (
            <span>
              Created by {task.createdBy.name || task.createdBy.email}
            </span>
          )}
        </div>
      </div>

      {(canModify || canDelete) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {canModify && (
            <button
              onClick={onEdit}
              className="text-xs text-gray-500 hover:text-indigo-600 font-medium transition-colors px-2 py-1 rounded hover:bg-indigo-50"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-gray-500 hover:text-red-600 font-medium transition-colors px-2 py-1 rounded hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
