//Invoice model
// Note:
// Each Quote is linked to 3 Invoices - of types holdingDeposit, installTravelCost, and finalInvoice.
// Each Invoice is linked to 1 Quote (via the quoteNumber)

export enum InvoiceType {
  HoldingDeposit = 'Holding Deposit',
  InstallTravelCost = 'Install Travel Cost',
  FinalInvoice = 'Final Invoice',
}

export enum InvoiceStatus {
  Sent = 'Sent',
  NotSent = 'Not Sent',
}

export interface Invoice {
  quoteNumber: string;
  invoiceType: InvoiceType;
  invoiceNumber: string;
  dateSent: string;
  dateDue: string;
  status: InvoiceStatus;
}
