export interface Invoice {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  userName: string;
  country: string;
}
