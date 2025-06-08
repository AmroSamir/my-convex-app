import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function TaskManagement() {
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "in_progress" | "completed" | "overdue" | undefined>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

  const user = useQuery(api.users.getCurrentUser);
  const isAdmin = user?.profile?.role === "admin";

  const myTasks = useQuery(api.tasks.getMyTasks, {
    status: selectedStatus,
  });

  const allTasks = useQuery(
    api.tasks.getAllTasks,
    isAdmin ? { status: selectedStatus } : "skip"
  );

  const allUsers = useQuery(
    api.users.getAllUsers,
    isAdmin ? {} : "skip"
  );

  const tasks = isAdmin ? allTasks : myTasks;

  const updateTask = useMutation(api.tasks.updateTask);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const handleStatusChange = async (taskId: string, newStatus: "pending" | "in_progress" | "completed" | "overdue") => {
    try {
      await updateTask({
        taskId: taskId as any,
        status: newStatus,
      });
      toast.success("Task status updated successfully");
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleDelete = async (taskId: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteTask({ taskId: taskId as any });
        toast.success("Task deleted successfully");
      } catch (error) {
        toast.error("Failed to delete task");
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-800 bg-red-100 border-red-300";
      case "high": return "text-orange-800 bg-orange-100 border-orange-300";
      case "medium": return "text-yellow-800 bg-yellow-100 border-yellow-300";
      case "low": return "text-green-800 bg-green-100 border-green-300";
      default: return "text-gray-800 bg-gray-100 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-800 bg-green-100 border-green-300";
      case "in_progress": return "text-blue-800 bg-blue-100 border-blue-300";
      case "overdue": return "text-red-800 bg-red-100 border-red-300";
      case "pending": return "text-yellow-800 bg-yellow-100 border-yellow-300";
      default: return "text-gray-800 bg-gray-100 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isAdmin ? "Task Management" : "My Tasks"}
          </h2>
          <p className="text-gray-600">
            {isAdmin ? "Manage and assign tasks to team members" : "View and update your assigned tasks"}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus || ""}
              onChange={(e) => setSelectedStatus(e.target.value as any || undefined)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Tasks</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setSelectedStatus(undefined)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {tasks?.map((task) => (
          <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value as any)}
                  className={`text-xs px-2 py-1 rounded border focus:ring-2 focus:ring-purple-500 focus:border-transparent ${getStatusColor(task.status)}`}
                  disabled={!isAdmin && task.assignedTo !== user?._id}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              
              {isAdmin && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit task"
                  >
                    <i className="fas fa-edit text-sm"></i>
                  </button>
                  <button
                    onClick={() => handleDelete(task._id, task.title)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete task"
                  >
                    <i className="fas fa-trash text-sm"></i>
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {task.description}
            </p>

            <div className="space-y-2 text-sm text-gray-500">
              {isAdmin && (task as any).assignedToName && (
                <div className="flex items-center justify-between">
                  <span>Assigned to:</span>
                  <span className="font-medium">{(task as any).assignedToName}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Assigned by:</span>
                <span className="font-medium">{task.assignedByName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Due date:</span>
                <span className={`font-medium ${
                  new Date(task.dueDate) < new Date() && task.status !== "completed"
                    ? "text-red-600"
                    : ""
                }`}>
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <span>Completed:</span>
                  <span className="font-medium text-green-600">
                    {new Date(task.completedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-4">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {(!tasks || tasks.length === 0) && (
        <div className="text-center py-12">
          <i className="fas fa-tasks text-gray-400 text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            {selectedStatus
              ? `No ${selectedStatus.replace("_", " ")} tasks found`
              : isAdmin
              ? "Create your first task to get started"
              : "No tasks have been assigned to you yet"
            }
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateForm || editingTask) && (
        <TaskModal
          task={editingTask}
          users={allUsers || []}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}

function TaskModal({
  task,
  users,
  onClose,
}: {
  task?: any;
  users: any[];
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    assignedTo: task?.assignedTo || "",
    priority: task?.priority || "medium",
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    tags: task?.tags?.join(", ") || "",
  });

  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tags = formData.tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      const dueDate = new Date(formData.dueDate).getTime();

      if (task) {
        await updateTask({
          taskId: task._id,
          title: formData.title,
          description: formData.description,
          priority: formData.priority as any,
          dueDate,
          tags,
        });
        toast.success("Task updated successfully");
      } else {
        await createTask({
          title: formData.title,
          description: formData.description,
          assignedTo: formData.assignedTo as any,
          priority: formData.priority as any,
          dueDate,
          tags,
        });
        toast.success("Task created successfully");
      }
      onClose();
    } catch (error) {
      toast.error(`Failed to ${task ? "update" : "create"} task`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {task ? "Edit Task" : "Create Task"}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to
                </label>
                <select
                  required
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.profile.firstName} {user.profile.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="urgent, frontend, bug-fix"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
