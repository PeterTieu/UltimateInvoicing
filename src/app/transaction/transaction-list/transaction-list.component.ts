import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TransactionService } from '../transactions.service';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { WindowModule } from '@progress/kendo-angular-dialog';
import { PanelBarModule } from '@progress/kendo-angular-layout';
import { SwitchModule } from '@progress/kendo-angular-inputs';
import { CreateTransactionsEntryComponent } from '../create-transactions-entry/create-transactions-entry.component';
import { TransactionEntryComponent } from '../transaction-entry/transaction-entry.component';
import { BulkTransactionEntryComponent } from '../bulk-transaction-entry/bulk-transaction-entry.component';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
  TransactionFilter,
} from '../transaction.model';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    DropDownsModule,
    FormsModule,
    ReactiveFormsModule,
    WindowModule,
    PanelBarModule,
    SwitchModule,
    CreateTransactionsEntryComponent,
    TransactionEntryComponent,
    BulkTransactionEntryComponent,
  ],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.scss'],
})
export class TransactionListComponent implements OnInit {
  private transactionService = inject(TransactionService);

  @Input() selectedItem = 'Transaction List';

  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];
  displayedTransactions: Transaction[] = [];
  displayedBulkTransactions: string[] = [];
  groupedTransactions: { [key: string]: Transaction[] } = {};

  selectedTransaction: Transaction | null = null;
  isViewingTransaction = false;
  isViewingBulkTransaction = false;
  selectedBulkTransactionNumber: string | null = null;

  public windowOpened = false;
  public expandAll = true;
  public groupByBulkTransactionsList = true;
  public bulkTransactionNumberSearchTerm = '';

  itemsToLoad = 10;
  currentIndex = 0;
  bulkCurrentIndex = 0;

  transactionTypeOptions = [
    { text: 'All', value: null },
    { text: 'Google Ads', value: TransactionType.GoogleAds },
    { text: 'Facebook Ads', value: TransactionType.FacebookAds },
    { text: 'DMS Support', value: TransactionType.DMSSupport },
    { text: 'Installation', value: TransactionType.Installation },
    { text: 'Travel', value: TransactionType.Travel },
    { text: 'IT Support', value: TransactionType.ITSupport },
    { text: 'Maintenance', value: TransactionType.Maintenance },
  ];

  transactionStatusOptions = [
    { text: 'All', value: null },
    { text: 'Draft', value: TransactionStatus.Draft },
    { text: 'Requested Invoice', value: TransactionStatus.RequestedInvoice },
    { text: 'Sent', value: TransactionStatus.Sent },
    { text: 'Paid', value: TransactionStatus.Paid },
    { text: 'Cancelled', value: TransactionStatus.Cancelled },
  ];

  gstOptions = [
    { text: 'Included', value: null },
    { text: 'Excluded', value: 'excluded' },
  ];

  sortByOptions = [
    { text: 'None', value: null },
    {
      text: 'Trn # (Highest to Lowest)',
      value: 'transactionNumberDesc',
    },
    {
      text: 'Trn # (Lowest to Highest)',
      value: 'transactionNumberAsc',
    },
    {
      text: 'Bulk Trn # (Highest to Lowest)',
      value: 'bulkTransactionNumberDesc',
    },
    {
      text: 'Bulk Trn # (Lowest to Highest)',
      value: 'bulkTransactionNumberAsc',
    },
    { text: 'Date Created (Newest to Oldest)', value: 'dateCreatedDesc' },
    { text: 'Date Created (Oldest to Newest)', value: 'dateCreatedAsc' },
    { text: 'Transaction Type', value: 'type' },
    { text: 'Status', value: 'status' },
  ];

  transactionFilter: TransactionFilter = {
    selectedTransactionType: null,
    selectedStatus: null,
    selectedGstOption: null,
    searchTerm: '',
    selectedSortBy: null,
  };

  ngOnInit() {
    this.transactions = this.transactionService.transactions;
    this.filterTransactions();
    // this.loadMoreTransactions();
    this.loadMoreBulkTransactions();
  }

  getBulkTransactionNumbers() {
    let bulkTransactionNumbers = Object.keys(this.groupedTransactions);
    if (this.transactionFilter.selectedSortBy === 'bulkTransactionNumberDesc') {
      bulkTransactionNumbers = bulkTransactionNumbers.sort(
        (a, b) => parseInt(b) - parseInt(a)
      );
    } else if (
      this.transactionFilter.selectedSortBy === 'bulkTransactionNumberAsc'
    ) {
      bulkTransactionNumbers = bulkTransactionNumbers.sort(
        (a, b) => parseInt(a) - parseInt(b)
      );
    }
    return bulkTransactionNumbers;
  }

  groupTransactionsByBulkTransactionNumber(transactions: Transaction[]) {
    const groupedTransactions: { [key: string]: Transaction[] } = {};
    transactions.forEach((transaction) => {
      const bulkNumber = transaction.bulkTransactionNumber;
      if (!groupedTransactions[bulkNumber]) {
        groupedTransactions[bulkNumber] = [];
      }
      groupedTransactions[bulkNumber].push(transaction);
    });
    return groupedTransactions;
  }

  public openWindow(): void {
    this.windowOpened = true;
  }

  public closeWindow(): void {
    this.windowOpened = false;
    this.selectedTransaction = null;
    this.selectedBulkTransactionNumber = null;
    this.isViewingTransaction = false;
    this.isViewingBulkTransaction = false;
    this.refreshTransactions();
  }

  onSelectTransaction(transaction: Transaction) {
    this.selectedTransaction = transaction;
    this.isViewingTransaction = true;
    this.windowOpened = true;
  }

  onSelectBulkTransaction(bulkTransactionNumber: string, event: Event) {
    event.stopPropagation();
    this.selectedBulkTransactionNumber = bulkTransactionNumber;
    this.isViewingBulkTransaction = true;
    this.windowOpened = true;
  }

  onSaveTransaction(updatedTransaction: Transaction) {
    const index = this.transactions.findIndex(
      (transaction) =>
        transaction.transactionNumber === updatedTransaction.transactionNumber
    );
    if (index !== -1) {
      this.transactions[index] = { ...updatedTransaction };
      this.transactionService.saveTransactions();
    }
    this.refreshTransactions();
    this.closeWindow();
  }

  onSaveBulkTransaction(updatedTransactions: Transaction[]) {
    updatedTransactions.forEach((updatedTransaction) => {
      const index = this.transactions.findIndex(
        (transaction) =>
          transaction.transactionNumber === updatedTransaction.transactionNumber
      );
      if (index !== -1) {
        this.transactions[index] = { ...updatedTransaction };
      }
    });
    this.transactionService.saveTransactions();
    this.refreshTransactions();
    this.closeWindow();
  }

  refreshTransactions() {
    this.transactions = this.transactionService.transactions;
    this.filterTransactions();
  }

  onSearchTermChange() {
    this.filterTransactions();
  }

  onTypeChange(event: any) {
    this.transactionFilter.selectedTransactionType = event.value;
    this.filterTransactions();
  }

  onStatusChange(event: any) {
    this.transactionFilter.selectedStatus = event.value;
    this.filterTransactions();
  }

  onGstOptionChange(event: any) {
    this.transactionFilter.selectedGstOption = event.value;
    this.filterTransactions();
  }

  onSortByChange(event: any) {
    this.transactionFilter.selectedSortBy = event.value;
    this.filterTransactions();
  }

  filterTransactions() {
    const searchTermLower = this.transactionFilter.searchTerm.toLowerCase();
    const bulkTransactionNumberSearchTermLower =
      this.bulkTransactionNumberSearchTerm.toLowerCase();
    this.filteredTransactions = this.transactions.filter(
      (transaction) =>
        (this.transactionFilter.selectedTransactionType === null ||
          transaction.transactionType ===
            this.transactionFilter.selectedTransactionType) &&
        (this.transactionFilter.selectedStatus === null ||
          transaction.status === this.transactionFilter.selectedStatus) &&
        (transaction.transactionNumber
          .toLowerCase()
          .includes(searchTermLower) ||
          transaction.productCode.toLowerCase().includes(searchTermLower) ||
          transaction.customer.toLowerCase().includes(searchTermLower) ||
          transaction.description.toLowerCase().includes(searchTermLower)) &&
        transaction.bulkTransactionNumber
          .toLowerCase()
          .includes(bulkTransactionNumberSearchTermLower)
    );

    this.sortTransactions();
    this.currentIndex = 0;
    this.bulkCurrentIndex = 0;
    this.displayedTransactions = [];
    this.displayedBulkTransactions = [];
    this.loadMoreTransactions();
    this.loadMoreBulkTransactions();
    this.groupedTransactions = this.groupTransactionsByBulkTransactionNumber(
      this.filteredTransactions
    );
  }

  sortTransactions() {
    if (this.transactionFilter.selectedSortBy) {
      this.filteredTransactions.sort((a, b) => {
        if (this.transactionFilter.selectedSortBy === 'transactionNumberDesc') {
          return parseInt(b.transactionNumber) - parseInt(a.transactionNumber);
        } else if (
          this.transactionFilter.selectedSortBy === 'transactionNumberAsc'
        ) {
          return parseInt(a.transactionNumber) - parseInt(b.transactionNumber);
        }
        if (
          this.transactionFilter.selectedSortBy === 'bulkTransactionNumberDesc'
        ) {
          return (
            parseInt(b.bulkTransactionNumber) -
            parseInt(a.bulkTransactionNumber)
          );
        } else if (
          this.transactionFilter.selectedSortBy === 'bulkTransactionNumberAsc'
        ) {
          return (
            parseInt(a.bulkTransactionNumber) -
            parseInt(b.bulkTransactionNumber)
          );
        } else if (
          this.transactionFilter.selectedSortBy === 'dateCreatedDesc'
        ) {
          return (
            new Date(b.dateCreated).getTime() -
            new Date(a.dateCreated).getTime()
          );
        } else if (this.transactionFilter.selectedSortBy === 'dateCreatedAsc') {
          return (
            new Date(a.dateCreated).getTime() -
            new Date(b.dateCreated).getTime()
          );
        } else if (this.transactionFilter.selectedSortBy === 'type') {
          const typeOrder = Object.values(TransactionType);
          return (
            typeOrder.indexOf(a.transactionType) -
            typeOrder.indexOf(b.transactionType)
          );
        } else if (this.transactionFilter.selectedSortBy === 'status') {
          const statusOrder = Object.values(TransactionStatus);
          return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
        }
        return 0;
      });
    }
  }

  loadMoreTransactions() {
    const remainingItems = this.filteredTransactions.length - this.currentIndex;
    const itemsToDisplay = Math.min(this.itemsToLoad, remainingItems);

    const nextSetOfTransactions = this.filteredTransactions.slice(
      this.currentIndex,
      this.currentIndex + itemsToDisplay
    );

    this.displayedTransactions = [
      ...this.displayedTransactions,
      ...nextSetOfTransactions,
    ];
    this.currentIndex += itemsToDisplay;
  }

  loadMoreBulkTransactions() {
    const bulkTransactionNumbers = this.getBulkTransactionNumbers();
    const remainingItems =
      bulkTransactionNumbers.length - this.bulkCurrentIndex;
    const itemsToDisplay = Math.min(this.itemsToLoad, remainingItems);

    const nextSetOfBulkTransactions = bulkTransactionNumbers.slice(
      this.bulkCurrentIndex,
      this.bulkCurrentIndex + itemsToDisplay
    );

    this.displayedBulkTransactions = [
      ...this.displayedBulkTransactions,
      ...nextSetOfBulkTransactions,
    ];
    this.bulkCurrentIndex += itemsToDisplay;
  }

  calculateUnitPriceExclGST(transaction: Transaction): number {
    const unitPriceInclGST = parseFloat(transaction.unitPriceInclGST) || 0;
    return unitPriceInclGST / 1.1; // Assuming GST is 10%
  }

  calculateTotalPrice(transaction: Transaction): number {
    const quantity = parseFloat(transaction.quantity) || 0;
    const unitPriceInclGST = parseFloat(transaction.unitPriceInclGST) || 0;
    const unitPriceExclGST = transaction.unitPriceExclGST
      ? parseFloat(transaction.unitPriceExclGST)
      : this.calculateUnitPriceExclGST(transaction);

    if (this.transactionFilter.selectedGstOption === 'excluded') {
      return quantity * unitPriceExclGST;
    } else {
      return quantity * unitPriceInclGST;
    }
  }

  trackByTransactionNumber(index: number, transaction: Transaction) {
    return transaction.transactionNumber;
  }

  getUnitPrice(transaction: Transaction): string {
    if (this.transactionFilter.selectedGstOption === 'excluded') {
      return transaction.unitPriceExclGST
        ? transaction.unitPriceExclGST
        : this.calculateUnitPriceExclGST(transaction).toFixed(2);
    } else {
      return transaction.unitPriceInclGST;
    }
  }

  toggleExpandAll(state: boolean) {
    this.expandAll = state;
  }

  toggleShowBulkTransactions(state: boolean) {
    this.groupByBulkTransactionsList = state;
  }

  onBulkTransactionSearchTermChange(event: any) {
    this.bulkTransactionNumberSearchTerm = event.target.value;
    this.filterTransactions();
  }

  onOpenBulkTransaction(bulkTransactionNumber: string): void {
    this.selectedBulkTransactionNumber = bulkTransactionNumber;
    this.isViewingTransaction = false;
    this.isViewingBulkTransaction = true;
    this.windowOpened = true;
  }
}
