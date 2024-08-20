import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { QuoteEntryComponent } from './quote/quote-entry/quote-entry.component';
import { WindowModule } from '@progress/kendo-angular-dialog';
import { DrawerModule } from '@progress/kendo-angular-layout';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { DrawerItem, DrawerSelectEvent } from '@progress/kendo-angular-layout';
import {
  SVGIcon,
  calendarIcon,
  envelopeLinkIcon,
  listUnorderedIcon,
  menuIcon,
  rightDoubleQuotesIcon,
  starOutlineIcon,
} from '@progress/kendo-svg-icons';
import { QuoteListComponent } from './quote/quote-list/quote-list.component';
import { TransactionListComponent } from './transaction/transaction-list/transaction-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    QuoteEntryComponent,
    WindowModule,
    DrawerModule,
    ButtonModule,
    QuoteListComponent,
    TransactionListComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ultimate-invoicing';

  // Experiment
  @Input() selectedItem? = '';

  public selected = '';
  public menuSvg: SVGIcon = menuIcon;

  public items: Array<DrawerItem> = [
    {
      text: 'Quotes List',
      svgIcon: rightDoubleQuotesIcon,
      selected: true,
    },
    { separator: true },
    { text: 'Transactions', svgIcon: listUnorderedIcon },
    { text: 'Calendar', svgIcon: calendarIcon },
    { separator: true },
    { text: 'Attachments', svgIcon: envelopeLinkIcon },
    { text: 'Favourites', svgIcon: starOutlineIcon },
  ];

  constructor(private router: Router) {}

  public onSelect(ev: DrawerSelectEvent): void {
    if (ev.item.text == 'Quotes List') this.router.navigate(['/quote-list']);
    if (ev.item.text == 'Transactions') this.router.navigate(['/trans-list']);
  }

  onSelectMenuItem(selectedItem: string) {
    this.selectedItem = selectedItem;
  }
}
