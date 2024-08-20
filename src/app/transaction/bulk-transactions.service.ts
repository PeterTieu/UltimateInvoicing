import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BulkTransaction } from './bulk-transaction.model';
import { DUMMY_BULK_TRANSACTIONS } from '../dummy-data';

@Injectable({ providedIn: 'root' })
export class BulkTransactionService {
  private bulkTransactions: BulkTransaction[] = [];
  private nextBulkTransactionNumber: number = 1;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (this.isBrowser()) {
      const storedTransactions = localStorage.getItem('bulkTransactions');
      if (storedTransactions) {
        this.bulkTransactions = JSON.parse(storedTransactions);
      } else {
        this.bulkTransactions = DUMMY_BULK_TRANSACTIONS;
        this.saveToLocalStorage();
      }
      this.nextBulkTransactionNumber =
        Math.max(
          ...this.bulkTransactions.map((bt) =>
            parseInt(bt.bulkTransactionNumber, 10)
          )
        ) + 1;
    }
  }

  getNextBulkTransactionNumber(): string {
    return this.nextBulkTransactionNumber.toString();
  }

  saveBulkTransaction(bulkTransaction: BulkTransaction) {
    this.bulkTransactions.push(bulkTransaction);
    this.nextBulkTransactionNumber++;
    this.saveToLocalStorage();
  }

  private saveToLocalStorage() {
    if (this.isBrowser()) {
      localStorage.setItem(
        'bulkTransactions',
        JSON.stringify(this.bulkTransactions)
      );
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
