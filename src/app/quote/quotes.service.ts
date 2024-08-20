import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { NewQuoteData, Quote, QuoteStatus } from './quote.model';
import { Invoice, InvoiceType, InvoiceStatus } from './invoice.model';
import { isPlatformBrowser } from '@angular/common';
import { DUMMY_QUOTES } from '../dummy-data';
import { InvoicesService } from './invoices.service';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  quotes: Quote[] = DUMMY_QUOTES;
  private tempQuote: Quote | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private invoicesService: InvoicesService
  ) {
    if (this.isBrowser()) {
      const quotes = localStorage.getItem('quotes');
      if (quotes) {
        this.quotes = JSON.parse(quotes);
      }
    }
  }

  saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(this.quotes));
  }

  removeQuote(quoteNumber: string) {
    this.quotes = this.quotes.filter(
      (quote) => quote.quoteNumber !== quoteNumber
    );
    this.saveQuotes();
  }

  addQuote(quoteData: NewQuoteData) {
    const formattedDateCreated = this.formatDateForStorage(
      quoteData.dateCreated
    );
    const newQuote: Quote = {
      quoteNumber: quoteData.quoteNumber,
      department: '',
      dateCreated: formattedDateCreated,
      dateOfExpiry: this.calculateDateOfExpiry(formattedDateCreated),
      customer: '',
      customerID: '',
      description: quoteData.description,
      preparedFor: '',
      customerPhone: '',
      customerEmail: '',
      preparedBy: '*Name of logged in user*',
      status: QuoteStatus.Draft,
      specialConditions: '',
      notes: '',
    };
    this.quotes.push(newQuote);
    this.tempQuote = newQuote;
    this.saveQuotes();
    this.createDefaultInvoices(newQuote.quoteNumber);
  }

  discardTempQuote() {
    if (this.tempQuote) {
      this.removeQuote(this.tempQuote.quoteNumber);
      this.invoicesService.removeInvoicesByQuoteNumber(
        this.tempQuote.quoteNumber
      );
      this.tempQuote = null;
    }
  }

  confirmTempQuote() {
    this.tempQuote = null;
  }

  calculateDateOfExpiry(dateCreated: string): string {
    const [day, month, year] = dateCreated.split('-');
    const createdDate = new Date(`${year}-${month}-${day}`);
    const expiryDate = new Date(createdDate);
    expiryDate.setDate(createdDate.getDate() + 30);

    // Ensure the date is returned in 'dd-mm-yyyy' format
    const formattedDay = this.padZero(expiryDate.getDate());
    const formattedMonth = this.padZero(expiryDate.getMonth() + 1);
    const formattedYear = expiryDate.getFullYear();

    return `${formattedDay}-${formattedMonth}-${formattedYear}`;
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : value.toString();
  }

  private createDefaultInvoices(quoteNumber: string) {
    const invoiceTypes = [
      InvoiceType.HoldingDeposit,
      InvoiceType.InstallTravelCost,
      InvoiceType.FinalInvoice,
    ];
    invoiceTypes.forEach((type, index) => {
      const newInvoice: Invoice = {
        quoteNumber,
        invoiceType: type,
        invoiceNumber: `INV-${quoteNumber}-${index + 1}`,
        dateSent: '',
        dateDue: '',
        status: InvoiceStatus.NotSent,
      };
      this.invoicesService.addInvoice(newInvoice);
    });
  }

  private formatDateForStorage(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
