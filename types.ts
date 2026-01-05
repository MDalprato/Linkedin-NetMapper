
export interface LinkedInConnection {
  firstName: string;
  lastName: string;
  url: string;
  email: string;
  company: string;
  position: string;
  connectedOn: string;
}

export interface TreeNode {
  name: string;
  children?: TreeNode[];
  value?: number;
  type: 'root' | 'company' | 'contact';
  info?: LinkedInConnection;
}

export interface NetworkSummary {
  totalConnections: number;
  totalCompanies: number;
  topCompanies: { name: string; count: number }[];
  aiInsights?: string;
}
