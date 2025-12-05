export interface Customer {
  id: string;
  name: string;
  firstname?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  country?: string;
  code_client?: string;
  note_private?: string;
  status?: number;
  particulier?: boolean;
}
