export type TeamMemberProfile = {
  slug: "jean" | "mel";
  fullName: string;
  roleTitle: string;
  shortBio: string;
  longBio: string;
  specialties: string[];
  experienceSummary: string;
  highlights: string[];
  image: string;
  socialLinks: {
    instagram?: string;
    linkedin?: string;
    behance?: string;
    website?: string;
  };
};
