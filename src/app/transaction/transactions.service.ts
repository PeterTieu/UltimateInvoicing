import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Transaction, TransactionType } from './transaction.model';
import { isPlatformBrowser } from '@angular/common';
import { DUMMY_TRANSACTIONS } from '../dummy-data';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  transactions: Transaction[] = DUMMY_TRANSACTIONS;
  private tempTransaction: Transaction | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (this.isBrowser()) {
      const transactions = localStorage.getItem('transactions');
      if (transactions) {
        this.transactions = JSON.parse(transactions);
      }
    }
  }

  saveTransactions() {
    if (this.isBrowser()) {
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }
  }

  removeTransaction(transactionNumber: string) {
    this.transactions = this.transactions.filter(
      (transaction) => transaction.transactionNumber !== transactionNumber
    );
    this.saveTransactions();
  }

  addTransaction(transactionData: Transaction) {
    const newTransaction: Transaction = {
      transactionNumber: transactionData.transactionNumber,
      bulkTransactionNumber: transactionData.bulkTransactionNumber,
      transactionType: transactionData.transactionType,
      customer: transactionData.customer,
      productCode: transactionData.productCode,
      description: transactionData.description,
      quantity: transactionData.quantity,
      unitPriceInclGST: transactionData.unitPriceInclGST,
      unitPriceExclGST: transactionData.unitPriceExclGST,
      totalPriceInclGST: transactionData.totalPriceInclGST,
      totalPriceExcl: transactionData.totalPriceExcl,
      dateCreated: transactionData.dateCreated,
      status: transactionData.status,
    };
    this.transactions.push(newTransaction);
    this.tempTransaction = newTransaction;
    this.saveTransactions();
  }

  updateBulkTransaction(
    bulkTransactionNumber: string,
    updatedTransactions: Transaction[]
  ) {
    this.transactions = this.transactions
      .filter(
        (transaction) =>
          transaction.bulkTransactionNumber !== bulkTransactionNumber
      )
      .concat(updatedTransactions);
    this.saveTransactions();
  }

  getHighestTransactionNumber(): number {
    return this.transactions.reduce(
      (max, transaction) =>
        Math.max(max, parseInt(transaction.transactionNumber, 10)),
      0
    );
  }

  discardTempTransaction() {
    if (this.tempTransaction) {
      this.removeTransaction(this.tempTransaction.transactionNumber);
      this.tempTransaction = null;
    }
  }

  confirmTempTransaction() {
    this.tempTransaction = null;
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
