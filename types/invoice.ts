export interface Invoice {
  id: string; // Firestore document ID
  invoiceNumber: string; // Unique invoice number
  description: string; // Description of the invoice
  amount: string; // Amount for the invoice (e.g., "75 USDT")
  date: string; // Date of the invoice (ISO string format)
  status: 'paid' | 'pending' | 'overdue'; // Status of the invoice
  userId: string; // User ID associated with the invoice
  userEmail: string; // Email of the user associated with the invoice
  createdAt: string; // Timestamp when the invoice was created
  userName: string; // Name of the user associated with the invoice
  country: string; // Country of the user associated with the invoice
}
