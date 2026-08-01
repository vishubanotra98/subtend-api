export const PORT = process.env.PORT || 8080;
export const BASE_URL_CLIENT = process.env.BASE_URL_CLIENT;
export const ALLOWED_ORIGINS = [BASE_URL_CLIENT, "http://localhost:3000"]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.replace(/\/$/, ""));
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

export const DEFAULT_STATUSES = [
  { name: "Todo", color: "#6b7280", order: 1, isDefault: true },
  {
    name: "In Progress",
    color: "#2563eb",
    order: 2,
    isDefault: false,
  },
  {
    name: "Done",
    color: "#16a34a",
    order: 3,
    isDefault: false,
  },
  {
    name: "Canceled",
    color: "#ef4444",
    order: 4,
    isDefault: false,
  },
  {
    name: "Blocked",
    color: "#f59e0b",
    order: 5,
    isDefault: false,
  },
];

export const EMAIL_JOBS = {
  VERIFICATION: "verificationEmail",
  INVITATION: "invitationEmail",
} as const;

export const ActivityAction = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  DETAILS_UPDATED: "DETAILS_UPDATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  ASSIGNED: "ASSIGNED",
  UNASSIGNED: "UNASSIGNED",
  PRIORITY_CHANGED: "PRIORITY_CHANGED",
  DESCRIPTION_CHANGED: "DESCRIPTION_CHANGED",
  TITLE_CHANGED: "TITLE_CHANGED",
  TARGET_DATE_CHANGED: "TARGET_DATE_CHANGED",
  COMMENT_ADDED: "COMMENT_ADDED",
  COMPLETED: "COMPLETED",
  REOPENED: "REOPENED",
};
