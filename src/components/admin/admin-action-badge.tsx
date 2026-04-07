"use client";

import type { RemixiconComponentType } from "@remixicon/react";
import {
  RiArticleLine,
  RiArrowRightCircleLine,
  RiBillLine,
  RiChat3Line,
  RiDeleteBinLine,
  RiEdit2Line,
  RiFileEditLine,
  RiPauseCircleLine,
  RiPlayCircleLine,
  RiFileList3Line,
  RiImageAddLine,
  RiLinksLine,
  RiLoginCircleLine,
  RiLogoutCircleLine,
  RiMailSendLine,
  RiMoneyDollarCircleLine,
  RiProfileLine,
  RiQuestionLine,
  RiRefreshLine,
  RiStickyNoteLine,
  RiToggleLine,
  RiUserAddLine,
  RiUserSettingsLine,
  RiUserStarLine,
} from "@remixicon/react";
import { adminActionBadgeClass, adminActionLabel } from "@/lib/admin/admin-actions";
import { cn } from "@/lib/utils";

const ACTION_ICONS: Record<string, RemixiconComponentType> = {
  login: RiLoginCircleLine,
  logout: RiLogoutCircleLine,
  lead_created_manual: RiUserAddLine,
  lead_status_updated: RiRefreshLine,
  lead_updated: RiEdit2Line,
  lead_deleted: RiDeleteBinLine,
  lead_converted: RiArrowRightCircleLine,
  client_created: RiUserStarLine,
  lead_budget_added: RiFileList3Line,
  lead_note_added: RiChat3Line,
  note_added: RiStickyNoteLine,
  client_updated: RiUserSettingsLine,
  client_deactivated: RiPauseCircleLine,
  client_reactivated: RiPlayCircleLine,
  client_deleted: RiDeleteBinLine,
  link_added: RiLinksLine,
  invoice_created: RiBillLine,
  invoice_updated: RiFileEditLine,
  payment_recorded: RiMoneyDollarCircleLine,
  blog_post_updated: RiArticleLine,
  blog_post_deleted: RiDeleteBinLine,
  blog_status_updated: RiToggleLine,
  invite_created: RiMailSendLine,
  profile_updated: RiProfileLine,
  profile_photo_uploaded: RiImageAddLine,
};

function iconForAction(key: string): RemixiconComponentType {
  return ACTION_ICONS[key] ?? RiQuestionLine;
}

type Props = {
  action: string | undefined | null;
  className?: string;
  iconClassName?: string;
  showIcon?: boolean;
};

export function AdminActionBadge({ action, className, iconClassName, showIcon = true }: Props) {
  const key = String(action ?? "").trim();
  const label = adminActionLabel(key);
  const badgeClass = adminActionBadgeClass(key);
  const Icon = iconForAction(key);

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tracking-tight",
        badgeClass,
        className,
      )}
    >
      {showIcon ? <Icon className={cn("size-3.5 shrink-0 opacity-90", iconClassName)} aria-hidden /> : null}
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

/** Para textos sin badge (p. ej. notificaciones). */
export { adminActionLabel };
