export interface Quote {
  quoteNumber: string;
  department: string;
  dateCreated: string;
  dateOfExpiry: string;
  customer: string;
  customerID: string | null;
  description: string;
  preparedFor: string;
  customerPhone: string;
  customerEmail: string;
  preparedBy: string;
  status: QuoteStatus;
  specialConditions: string;
  notes: string;
}

export interface NewQuoteData {
  quoteNumber: string;
  description: string;
  dateCreated: string;
}

export enum QuoteStatus {
  Draft = 'Draft',
  Sent = 'Sent',
  Signed = 'Signed',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
}

export interface QuoteFilter {
  selectedStatus: string | null;
  searchTerm: string;
  selectedSortBy: string | null;
}
