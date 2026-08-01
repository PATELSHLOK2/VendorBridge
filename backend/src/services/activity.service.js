import { ActivityLog } from "../models/ActivityLog.js";

export async function logActivity(input) {
  try {
    await ActivityLog.create({
      userId:   input.userId,
      action:   input.action,
      module:   input.module,
      entityId: input.entityId,
      metadata: input.metadata,
    });
  } catch (error) {
    // Activity logging should never break the main flow
    console.error("[logActivity] Failed to log activity:", error);
  }
}

export async function getActivityLogs(moduleFilter, page = 1, pageSize = 20) {
  const filter = moduleFilter ? { module: moduleFilter } : {};

  const [logs, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate("userId", "id firstName lastName email role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    ActivityLog.countDocuments(filter),
  ]);

  // Rename populated userId → user for API compatibility
  const logsJson = logs.map((log) => {
    const obj = log.toJSON();
    obj.user = obj.userId;
    delete obj.userId;
    return obj;
  });

  return { logs: logsJson, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
