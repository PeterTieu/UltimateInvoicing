import { Injectable } from '@angular/core';
import { ItemsServices } from './items-services.model';
import { DUMMY_ITEMS_SERVICES } from '../dummy-data';

@Injectable({
  providedIn: 'root',
})
export class ItemsServicesService {
  private itemServices: ItemsServices[] = JSON.parse(
    localStorage.getItem('itemServices') || '[]'
  );

  constructor() {
    const itemServices = localStorage.getItem('itemServices');
    if (itemServices) {
      this.itemServices = JSON.parse(itemServices);
    } else {
      this.itemServices = DUMMY_ITEMS_SERVICES;
      this.saveItemServices();
    }
  }

  getItemServicesByQuoteNumber(quoteNumber: string | null): ItemsServices[] {
    return this.itemServices.filter((item) => item.quoteNumber === quoteNumber);
  }

  addItemService(newItem: ItemsServices) {
    this.itemServices.push(newItem);
    this.saveItemServices();
  }

  saveItemServices() {
    localStorage.setItem('itemServices', JSON.stringify(this.itemServices));
  }

  replaceItemServicesByQuoteNumber(
    quoteNumber: string | null,
    newItems: ItemsServices[]
  ) {
    const otherItems = this.itemServices.filter(
      (item) => item.quoteNumber !== quoteNumber
    );

    this.itemServices = [...otherItems, ...newItems];

    this.saveItemServices();
  }
}
