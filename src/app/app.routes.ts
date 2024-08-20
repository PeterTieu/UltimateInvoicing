import { Routes } from '@angular/router';
import { QuoteListComponent } from './quote/quote-list/quote-list.component';
import { TransactionListComponent } from './transaction/transaction-list/transaction-list.component';

export const routes: Routes = [
  { path: 'quote-list', component: QuoteListComponent },
  { path: 'trans-list', component: TransactionListComponent },
];
