export type StatsMetric = {
  id: string;
  label: string;
  value: number;
  helper: string;
};

export type MonthlySeriesPoint = {
  month: string;
  leads: number;
  clients: number;
  posts: number;
};

export type AnalyticsSnapshot = {
  date: string;
  metrics: {
    totalLeads: number;
    convertedLeads: number;
    activeClients: number;
    publishedPosts: number;
    totalLikes: number;
    estimatedIncome: number;
    pendingIncome: number;
  };
  monthly: MonthlySeriesPoint[];
};
