import { dictionaries, type Locale } from "@/i18n/messages";
import type { EditorialTeamMember } from "@/content/teamSetup/editorial-members";

/** Merges English copy from messages when `locale === "en"`. */
export function resolveEditorialMember(member: EditorialTeamMember, locale: Locale): EditorialTeamMember {
  if (locale !== "en") return member;
  const o = dictionaries.en.editorialOverridesEn?.[member.slug as "jean" | "mel"];
  if (!o) return member;
  return {
    ...member,
    ...o,
    skills: o.skills?.length ? [...o.skills] : member.skills,
    bio: o.bio?.length ? [...o.bio] : member.bio,
    expertise: o.expertise?.length ? [...o.expertise] : member.expertise,
  };
}
