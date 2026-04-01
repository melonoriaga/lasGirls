export type AdminRole = "superadmin" | "admin" | "editor" | "viewer";

export type AdminPermissions = {
  canViewDashboard: boolean;
  canManageLeads: boolean;
  canEditLeads: boolean;
  canConvertLeads: boolean;
  canManageClients: boolean;
  canEditClients: boolean;
  canManageBlog: boolean;
  canUploadMedia: boolean;
  canManageUsers: boolean;
  canViewStats: boolean;
  canManageSettings: boolean;
};

export type AdminUser = {
  uid: string;
  email: string;
  fullName: string;
  role: AdminRole;
  permissions: AdminPermissions;
  invitedBy?: string;
  createdAt: string;
  isActive: boolean;
  lastLoginAt?: string;
};

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type Invitation = {
  id: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  token: string;
  invitedBy: string;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
};
