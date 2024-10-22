export type Invoice = {
  id: string;
  invoiceNumber: string;
  description: string;
  amount: number;
  date: Date;
  status: 'paid' | 'pending' | 'overdue';
  userId: string;
  userEmail: string;
  createdAt: string;
  userName: string;
  country: string;
}
