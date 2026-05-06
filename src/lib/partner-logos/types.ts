export type PartnerLogoRecord = {
  imageUrl: string;
  storagePath: string;
  linkUrl: string;
  enabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PartnerLogoPublic = {
  id: string;
  imageUrl: string;
  linkUrl: string;
};
