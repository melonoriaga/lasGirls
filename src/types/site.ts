export type LinkItem = {
  label: string;
  href: string;
};

export type ContactChannel = {
  label: string;
  value: string;
  href: string;
};

export type SiteSettings = {
  brandName: string;
  claim: string;
  contactPhones: string[];
  socialLinks: Record<string, string>;
  featuredServices: string[];
};
