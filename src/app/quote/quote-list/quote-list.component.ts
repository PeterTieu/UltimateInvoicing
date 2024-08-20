import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuoteEntryComponent } from '../quote-entry/quote-entry.component';
import { QuotesService } from '../quotes.service';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { Quote, QuoteFilter, QuoteStatus } from '../quote.model';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [
    CommonModule,
    QuoteEntryComponent,
    DropDownsModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.scss'],
})
export class QuoteListComponent implements OnInit {
  private quotesService = inject(QuotesService);

  @Input() selectedItem = 'Quotes List';

  quotes: Quote[] = [];
  filteredQuotes: Quote[] = [];
  displayedQuotes: Quote[] = [];

  selectedQuoteNumber: string | null = null;
  isViewingQuote = false;

  itemsToLoad = 10;
  currentIndex = 0;

  quoteStatusOptions = [
    { text: 'All', value: null },
    { text: 'Draft', value: QuoteStatus.Draft },
    { text: 'Sent', value: QuoteStatus.Sent },
    { text: 'Signed', value: QuoteStatus.Signed },
    { text: 'Expired', value: QuoteStatus.Expired },
    { text: 'Cancelled', value: QuoteStatus.Cancelled },
  ];

  sortByOptions = [
    { text: 'None', value: null },
    { text: 'Quote Number (Highest to Lowest)', value: 'quoteNumberDesc' },
    { text: 'Quote Number (Lowest to Highest)', value: 'quoteNumberAsc' },
    { text: 'Date Created (Newest to Oldest)', value: 'dateCreatedDesc' },
    { text: 'Date Created (Oldest to Newest)', value: 'dateCreatedAsc' },
    { text: 'Status', value: 'status' },
  ];

  quoteFilter: QuoteFilter = {
    selectedStatus: null,
    searchTerm: '',
    selectedSortBy: null,
  };

  ngOnInit() {
    this.quotes = this.quotesService.quotes;
    this.refreshQuotes();
  }

  onSelectQuote(quoteNumber: string) {
    this.selectedQuoteNumber = quoteNumber;
    this.isViewingQuote = true;
  }

  get selectedQuote() {
    return this.quotes.find(
      (quote) => quote.quoteNumber === this.selectedQuoteNumber
    )!;
  }

  onCloseQuoteEntryPoint() {
    this.quotesService.discardTempQuote();
    this.isViewingQuote = false;
    this.refreshQuotes();
  }

  refreshQuotes() {
    this.quotes = this.quotesService.quotes;
    this.filterQuotes();
  }

  onCreateQuote() {
    const newQuoteNumber = (
      Math.max(...this.quotes.map((q) => parseInt(q.quoteNumber))) + 1
    ).toString();

    const today = new Date();
    const dateCreated = today.toISOString().split('T')[0];
    const dateOfExpiry = new Date(today.setDate(today.getDate() + 30))
      .toISOString()
      .split('T')[0];

    const newQuote = {
      quoteNumber: newQuoteNumber,
      description: '',
      dateCreated,
      dateOfExpiry,
      customer: '',
      preparedFor: '',
      customerPhone: '',
      customerEmail: '',
      department: '',
      status: QuoteStatus.Draft,
      specialConditions: '',
      notes: '',
      preparedBy: '',
    };

    this.quotesService.addQuote(newQuote);
    this.selectedQuoteNumber = newQuoteNumber;
    this.isViewingQuote = true;
    this.refreshQuotes();
  }

  onSearchTermChange() {
    this.filterQuotes();
  }

  onStatusChange(event: any) {
    this.quoteFilter.selectedStatus = event.value;
    this.filterQuotes();
  }

  onSortByChange(event: any) {
    this.quoteFilter.selectedSortBy = event.value;
    this.filterQuotes();
  }

  filterQuotes() {
    const searchTermLower = this.quoteFilter.searchTerm.toLowerCase();
    this.filteredQuotes = this.quotes.filter(
      (quote) =>
        (this.quoteFilter.selectedStatus === null ||
          quote.status === this.quoteFilter.selectedStatus) &&
        (quote.quoteNumber.toLowerCase().includes(searchTermLower) ||
          quote.department.toLowerCase().includes(searchTermLower) ||
          quote.customer.toLowerCase().includes(searchTermLower) ||
          quote.customerID?.toLowerCase().includes(searchTermLower) ||
          quote.description.toLowerCase().includes(searchTermLower) ||
          quote.preparedFor.toLowerCase().includes(searchTermLower) ||
          quote.preparedBy.toLowerCase().includes(searchTermLower))
    );

    this.sortQuotes();
    this.currentIndex = 0;
    this.displayedQuotes = [];
    this.loadMoreQuotes();
  }

  sortQuotes() {
    if (this.quoteFilter.selectedSortBy) {
      this.filteredQuotes.sort((a, b) => {
        if (this.quoteFilter.selectedSortBy === 'quoteNumberDesc') {
          return parseInt(b.quoteNumber) - parseInt(a.quoteNumber);
        } else if (this.quoteFilter.selectedSortBy === 'quoteNumberAsc') {
          return parseInt(a.quoteNumber) - parseInt(b.quoteNumber);
        } else if (this.quoteFilter.selectedSortBy === 'dateCreatedDesc') {
          return this.parseDate(b.dateCreated) - this.parseDate(a.dateCreated);
        } else if (this.quoteFilter.selectedSortBy === 'dateCreatedAsc') {
          return this.parseDate(a.dateCreated) - this.parseDate(b.dateCreated);
        } else if (this.quoteFilter.selectedSortBy === 'status') {
          const statusOrder = [
            QuoteStatus.Draft,
            QuoteStatus.Sent,
            QuoteStatus.Signed,
            QuoteStatus.Expired,
            QuoteStatus.Cancelled,
          ];
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        }
        return 0;
      });
    }
  }

  loadMoreQuotes() {
    const remainingItems = this.filteredQuotes.length - this.currentIndex;
    const itemsToDisplay = Math.min(this.itemsToLoad, remainingItems);

    const nextSetOfQuotes = this.filteredQuotes.slice(
      this.currentIndex,
      this.currentIndex + itemsToDisplay
    );

    this.displayedQuotes = [...this.displayedQuotes, ...nextSetOfQuotes];
    this.currentIndex += itemsToDisplay;
  }

  parseDate(dateStr: string): number {
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  trackByQuoteNumber(index: number, quote: Quote) {
    return quote.quoteNumber;
  }
}
