export interface Transaction {
  transactionNumber: string;
  bulkTransactionNumber: string;
  transactionType: TransactionType;
  customer: string;
  productCode: string;
  description: string;
  quantity: string;
  unitPriceInclGST: string;
  unitPriceExclGST: string;
  totalPriceInclGST: string;
  totalPriceExcl: string;
  dateCreated: string;
  status: TransactionStatus;
}

export enum TransactionType {
  GoogleAds = 'Google Ads',
  FacebookAds = 'Facebook Ads',
  DMSSupport = 'DMS Support',
  Installation = 'Installation',
  Travel = 'Travel',
  ITSupport = 'IT Support',
  Maintenance = 'Maintenance',
}

export enum TransactionStatus {
  Draft = 'Draft',
  RequestedInvoice = 'Requested Invoice',
  Sent = 'Sent',
  Paid = 'Paid',
  Expired = 'Expired',
  Cancelled = 'Cancelled',
}

export interface TransactionFilter {
  selectedTransactionType: string | null;
  selectedStatus: string | null;
  selectedGstOption: string | null;
  searchTerm: string;
  selectedSortBy: string | null;
}
