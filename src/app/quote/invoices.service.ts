import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Invoice, InvoiceType, InvoiceStatus } from './invoice.model';
import { isPlatformBrowser } from '@angular/common';
import { DUMMY_INVOICES } from '../dummy-data';

@Injectable({ providedIn: 'root' })
export class InvoicesService {
  invoices: Invoice[] = [];

  private getDefaultInvoices(): Invoice[] {
    return DUMMY_INVOICES;
  }

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (this.isBrowser()) {
      const invoices = localStorage.getItem('invoices');
      if (invoices) {
        this.invoices = JSON.parse(invoices);
      } else {
        this.invoices = this.getDefaultInvoices();
        this.saveInvoices();
      }
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private saveInvoices() {
    localStorage.setItem('invoices', JSON.stringify(this.invoices));
  }

  getInvoices(): Invoice[] {
    return this.invoices;
  }

  getInvoicesByQuoteNumber(quoteNumber: string | null): Invoice[] {
    return this.invoices.filter(
      (invoice) => invoice.quoteNumber === quoteNumber
    );
  }

  getInvoiceByNumber(invoiceNumber: string): Invoice | undefined {
    return this.invoices.find(
      (invoice) => invoice.invoiceNumber === invoiceNumber
    );
  }

  addInvoice(invoice: Invoice) {
    this.invoices.push(invoice);
    this.saveInvoices();
  }

  updateInvoice(invoiceNumber: string, updatedInvoice: Partial<Invoice>) {
    const index = this.invoices.findIndex(
      (invoice) => invoice.invoiceNumber === invoiceNumber
    );
    if (index !== -1) {
      this.invoices[index] = { ...this.invoices[index], ...updatedInvoice };
      this.saveInvoices();
    }
  }

  removeInvoice(invoiceNumber: string) {
    this.invoices = this.invoices.filter(
      (invoice) => invoice.invoiceNumber !== invoiceNumber
    );
    this.saveInvoices();
  }

  removeInvoicesByQuoteNumber(quoteNumber: string) {
    this.invoices = this.invoices.filter(
      (invoice) => invoice.quoteNumber !== quoteNumber
    );
    this.saveInvoices();
  }
}
