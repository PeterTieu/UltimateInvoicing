import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  OnInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { QuotesService } from '../quotes.service';
import { InvoicesService } from '../invoices.service';
import { ItemsServicesService } from '../items-services.service';
import { DialogModule } from '@progress/kendo-angular-dialog';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { WindowModule } from '@progress/kendo-angular-dialog';
import { QuoteStatus } from '../quote.model';
import { SelectEvent, TabStripModule } from '@progress/kendo-angular-layout';
import { EditorModule } from '@progress/kendo-angular-editor';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { InvoiceType, InvoiceStatus } from '../invoice.model';
import { ProductType } from '../items-services.model';
import { Customer } from '../../customer-data';
import { Department } from '../../department-data';

@Component({
  selector: 'app-quote-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    ButtonsModule,
    WindowModule,
    TabStripModule,
    EditorModule,
    DropDownsModule,
  ],
  templateUrl: './quote-entry.component.html',
  styleUrls: ['./quote-entry.component.scss'],
})
export class QuoteEntryComponent implements OnInit, OnChanges {
  @Input() public get quoteNumber(): string | null {
    return this._quoteNumber;
  }

  public set quoteNumber(quoteNumber: string | null) {
    this._quoteNumber = quoteNumber;
    if (quoteNumber === undefined || quoteNumber === null)
      console.log('quoteNumber is null');
  }

  private _quoteNumber!: string | null;

  @Output() close = new EventEmitter<void>();

  enteredQuoteNumber = '';
  enteredDepartment = '';
  enteredDescription = '';
  enteredDateCreated = '';
  enteredDateExpiry = '';
  enteredCustomer = '';
  enteredPreparedFor = '';
  enteredCustomerPhone = '';
  enteredCustomerEmail = '';
  enteredSpecialConditions = new FormControl('');
  enteredNotes = new FormControl('');

  customerNames = Object.values(Customer).map((c) => c.name); // Get all customer names
  departmentNames = Object.values(Department); // Get all department names
  selectedCustomerID: string | null = null;

  // Temporary arrays for holding changes
  tempInstallTrainingItems: any[] = [];
  tempMaintenanceItems: any[] = [];
  tempAdditionalItems: any[] = [];

  newInstallTrainingItem: any = this.createEmptyItem();
  newMaintenanceItem: any = this.createEmptyItem();
  newAdditionalItem: any = this.createEmptyItem();

  gstOptions = ['Included', 'Excluded'];
  selectedGstOption = 'Included';

  productTypes = Object.values(ProductType);

  installTrainingError: string = '';
  maintenanceError: string = '';
  additionalError: string = '';

  statusOptions = Object.values(QuoteStatus);
  selectedStatus: QuoteStatus = QuoteStatus.Draft;

  opened = true;
  windowTop = 0;
  windowLeft = 0;
  windowWidth = 900;
  windowHeight = 900;

  private quotesService = inject(QuotesService);
  private itemServiceService = inject(ItemsServicesService);
  private invoicesService = inject(InvoicesService);

  invoices: any[] = [];
  invoiceTypes = Object.values(InvoiceType);
  invoiceStatuses = Object.values(InvoiceStatus);

  private originalQuoteData: any;

  private fieldMappings: { [key: string]: (value: any) => void } = {
    enteredQuoteNumber: (value) => (this.enteredQuoteNumber = value),
    enteredDepartment: (value) => (this.enteredDepartment = value),
    enteredDescription: (value) => (this.enteredDescription = value),
    enteredDateCreated: (value) => (this.enteredDateCreated = value),
    enteredDateExpiry: (value) => (this.enteredDateExpiry = value),
    enteredCustomer: (value) => (this.enteredCustomer = value),
    enteredPreparedFor: (value) => (this.enteredPreparedFor = value),
    enteredCustomerPhone: (value) => (this.enteredCustomerPhone = value),
    enteredCustomerEmail: (value) => (this.enteredCustomerEmail = value),
  };

  ngOnInit(): void {
    this.selectedGstOption = 'Included'; // Set default value
    this.centerWindow();
    window.addEventListener('scroll', this.centerWindow.bind(this));
    this.loadItemServices();
    this.loadInvoices();
    this.updatePrices();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.centerWindow.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quoteNumber']) {
      this.loadQuoteData(this.quoteNumber);
      this.loadItemServices();
      this.loadInvoices();
    }
  }

  onCustomerChange(selectedCustomer: string): void {
    const customerData = Object.values(Customer).find(
      (c) => c.name === selectedCustomer
    );
    if (customerData) {
      this.selectedCustomerID = customerData.customerID;
    } else {
      this.selectedCustomerID = null;
    }
  }

  handleFilter(value: string) {
    this.customerNames = Object.values(Customer)
      .map((c) => c.name)
      .filter((name) => name.toLowerCase().includes(value.toLowerCase()));
  }

  handleDepartmentFilter(value: string) {
    this.departmentNames = Object.values(Department).filter((name) =>
      name.toLowerCase().includes(value.toLowerCase())
    );
  }

  private loadQuoteData(quoteNumber: string | null): void {
    const quote = this.quotesService.quotes.find(
      (q) => q.quoteNumber === quoteNumber
    );
    if (quote) {
      this.enteredQuoteNumber = quote.quoteNumber;
      this.enteredDepartment = quote.department;
      this.enteredDescription = quote.description;
      this.enteredDateCreated = this.formatDateForDisplay(quote.dateCreated);

      // Automatically calculate "Date of Expiry" if not set
      if (!quote.dateOfExpiry) {
        this.enteredDateExpiry = this.quotesService.calculateDateOfExpiry(
          this.formatDateForStorage(this.enteredDateCreated)
        );
      } else {
        this.enteredDateExpiry = this.formatDateForDisplay(quote.dateOfExpiry);
      }

      this.enteredCustomer = quote.customer;
      this.selectedCustomerID = quote.customerID;
      this.enteredPreparedFor = quote.preparedFor;
      this.enteredCustomerPhone = quote.customerPhone;
      this.enteredCustomerEmail = quote.customerEmail;
      this.enteredSpecialConditions.setValue(quote.specialConditions);
      this.enteredNotes.setValue(quote.notes);
      this.selectedStatus = quote.status;

      // Create a deep copy of the original quote data
      this.originalQuoteData = JSON.parse(JSON.stringify(quote));
    }
  }

  updateQuote() {
    const quote = this.quotesService.quotes.find(
      (q) => q.quoteNumber === this.enteredQuoteNumber
    );

    if (quote) {
      quote.quoteNumber = this.enteredQuoteNumber;
      quote.description = this.enteredDescription;
      quote.department = this.enteredDepartment;
      quote.dateCreated = this.formatDateForStorage(this.enteredDateCreated);

      // Update the Date of Expiry
      quote.dateOfExpiry = this.formatDateForStorage(this.enteredDateExpiry);

      quote.customer = this.enteredCustomer;
      quote.customerID = this.selectedCustomerID || '';
      quote.preparedFor = this.enteredPreparedFor;
      quote.customerPhone = this.enteredCustomerPhone;
      quote.customerEmail = this.enteredCustomerEmail;
      quote.status = this.selectedStatus;
    } else {
      console.warn(`Quote with number ${this.enteredQuoteNumber} not found.`);
    }
  }

  private loadItemServices(): void {
    const itemServices = this.itemServiceService.getItemServicesByQuoteNumber(
      this.quoteNumber
    );
    this.tempInstallTrainingItems = itemServices.filter(
      (item) => item.productType === ProductType.InstallTrainingTravel
    );
    this.tempMaintenanceItems = itemServices.filter(
      (item) => item.productType === ProductType.Maintenance
    );
    this.tempAdditionalItems = itemServices.filter(
      (item) => item.productType === ProductType.AdditionalItems
    );
  }

  private loadInvoices(): void {
    this.invoices = this.invoicesService.getInvoicesByQuoteNumber(
      this.quoteNumber
    );
  }

  onCancel() {
    this.quotesService.discardTempQuote();
    this.close.emit();

    // Reset the temporary arrays (essentially discarding changes)
    this.loadItemServices();

    this.opened = false;
  }

  onSubmit() {
    this.updateQuote();
    this.saveItemServices(); // Update to use temp arrays
    this.updateInvoices();

    this.quotesService.saveQuotes();
    this.quotesService.confirmTempQuote();

    this.close.emit();
    this.opened = false;
  }

  saveItemServices() {
    // Replace the current items in the service with the temporary items
    this.itemServiceService.replaceItemServicesByQuoteNumber(this.quoteNumber, [
      ...this.tempInstallTrainingItems,
      ...this.tempMaintenanceItems,
      ...this.tempAdditionalItems,
    ]);
  }

  updateInvoices() {
    this.invoices.forEach((invoice) => {
      this.invoicesService.updateInvoice(invoice.invoiceNumber, invoice);
    });
  }

  onInvoiceFieldChange() {}

  onStatusChange(status: QuoteStatus) {
    this.selectedStatus = status;
  }

  public toggle(isOpened: boolean): void {
    this.opened = isOpened;
  }

  private centerWindow(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    this.windowTop = (screenHeight - this.windowHeight) / 2 + scrollTop;
    this.windowLeft = (screenWidth - this.windowWidth) / 2 + scrollLeft;
  }

  public onTabSelect(e: SelectEvent): void {
    console.log(e);
  }

  private createEmptyItem() {
    return {
      productType: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPriceExclGST: 0,
      totalPriceInclGST: 0,
      quoteNumber: this.quoteNumber,
      productCode: 'NEW' + Math.random().toString(36).substr(2, 9),
    };
  }

  onGstOptionChange(event: any) {
    this.selectedGstOption = event;
    this.updatePrices();
  }

  updatePrices() {
    const gstMultiplier = this.selectedGstOption === 'Included' ? 1.1 : 1.0;

    this.tempInstallTrainingItems.forEach((item) => {
      item.totalPrice = item.quantity * item.unitPrice * gstMultiplier;
    });
    this.tempMaintenanceItems.forEach((item) => {
      item.totalPrice = item.quantity * item.unitPrice * gstMultiplier;
    });
    this.tempAdditionalItems.forEach((item) => {
      item.totalPrice = item.quantity * item.unitPrice * gstMultiplier;
    });
  }

  addInstallTrainingItem() {
    this.newInstallTrainingItem.quoteNumber = this.quoteNumber;
    this.newInstallTrainingItem.totalPriceExclGST =
      this.newInstallTrainingItem.quantity *
      this.newInstallTrainingItem.unitPrice;
    this.newInstallTrainingItem.totalPriceInclGST =
      this.newInstallTrainingItem.totalPriceExclGST * 1.1;
    this.newInstallTrainingItem.totalPrice =
      this.selectedGstOption === 'Included'
        ? this.newInstallTrainingItem.totalPriceInclGST
        : this.newInstallTrainingItem.totalPriceExclGST;

    const requiredFields = [
      'productType',
      'description',
      'quantity',
      'unitPrice',
    ];
    const missingFields = requiredFields.filter(
      (field) => !this.newInstallTrainingItem[field]
    );

    if (missingFields.length > 0) {
      this.installTrainingError = `Field(s) required: ${missingFields.join(
        ', '
      )}`;
      return;
    }

    this.tempInstallTrainingItems.push({ ...this.newInstallTrainingItem });
    this.newInstallTrainingItem = this.createEmptyItem();

    this.installTrainingError = '';
  }

  addMaintenanceItem() {
    this.newMaintenanceItem.quoteNumber = this.quoteNumber;
    this.newMaintenanceItem.totalPriceExclGST =
      this.newMaintenanceItem.quantity * this.newMaintenanceItem.unitPrice;
    this.newMaintenanceItem.totalPriceInclGST =
      this.newMaintenanceItem.totalPriceExclGST * 1.1;
    this.newMaintenanceItem.totalPrice =
      this.selectedGstOption === 'Included'
        ? this.newMaintenanceItem.totalPriceInclGST
        : this.newMaintenanceItem.totalPriceExclGST;

    const requiredFields = [
      'productType',
      'description',
      'quantity',
      'unitPrice',
    ];
    const missingFields = requiredFields.filter(
      (field) => !this.newMaintenanceItem[field]
    );

    if (missingFields.length > 0) {
      this.maintenanceError = `Field(s) required: ${missingFields.join(', ')}`;
      return;
    }

    this.tempMaintenanceItems.push({ ...this.newMaintenanceItem });
    this.newMaintenanceItem = this.createEmptyItem();
    this.maintenanceError = '';
  }

  addAdditionalItem() {
    this.newAdditionalItem.quoteNumber = this.quoteNumber;
    this.newAdditionalItem.totalPriceExclGST =
      this.newAdditionalItem.quantity * this.newAdditionalItem.unitPrice;
    this.newAdditionalItem.totalPriceInclGST =
      this.newAdditionalItem.totalPriceExclGST * 1.1;
    this.newAdditionalItem.totalPrice =
      this.selectedGstOption === 'Included'
        ? this.newAdditionalItem.totalPriceInclGST
        : this.newAdditionalItem.totalPriceExclGST;

    const requiredFields = [
      'productType',
      'description',
      'quantity',
      'unitPrice',
    ];
    const missingFields = requiredFields.filter(
      (field) => !this.newAdditionalItem[field]
    );

    if (missingFields.length > 0) {
      this.additionalError = `Field(s) required: ${missingFields.join(', ')}`;
      return;
    }

    this.tempAdditionalItems.push({ ...this.newAdditionalItem });
    this.newAdditionalItem = this.createEmptyItem();
    this.additionalError = '';
  }

  removeInstallTrainingItem(item: any): any {
    const index = this.tempInstallTrainingItems.indexOf(item);
    if (index !== -1) {
      this.tempInstallTrainingItems.splice(index, 1);
    }

    return item;
  }

  removeMaintenanceItem(item: any): any {
    const index = this.tempMaintenanceItems.indexOf(item);
    if (index !== -1) {
      this.tempMaintenanceItems.splice(index, 1);
    }
    return item;
  }

  removeAdditionalItem(item: any): any {
    const index = this.tempAdditionalItems.indexOf(item);
    if (index !== -1) {
      this.tempAdditionalItems.splice(index, 1);
    }
    return item;
  }

  moveItem(item: any, newSection: string): void {
    let removedItem: any;
    switch (item.productType) {
      case ProductType.InstallTrainingTravel:
        removedItem = this.removeInstallTrainingItem(item);
        break;
      case ProductType.Maintenance:
        removedItem = this.removeMaintenanceItem(item);
        break;
      case ProductType.AdditionalItems:
        removedItem = this.removeAdditionalItem(item);
        break;
    }

    if (removedItem) {
      removedItem.productType = newSection;
      switch (newSection) {
        case ProductType.InstallTrainingTravel:
          this.tempInstallTrainingItems.push(removedItem);
          break;
        case ProductType.Maintenance:
          this.tempMaintenanceItems.push(removedItem);
          break;
        case ProductType.AdditionalItems:
          this.tempAdditionalItems.push(removedItem);
          break;
      }
    }
  }

  onProductTypeChange(item: any, event: any) {
    const newProductType = event;
    this.moveItem(item, newProductType);
    this.updateSection();
  }

  updateSection() {
    const itemServices = this.itemServiceService.getItemServicesByQuoteNumber(
      this.quoteNumber
    );
    this.tempInstallTrainingItems = itemServices.filter(
      (item) => item.productType === ProductType.InstallTrainingTravel
    );
    this.tempMaintenanceItems = itemServices.filter(
      (item) => item.productType === ProductType.Maintenance
    );
    this.tempAdditionalItems = itemServices.filter(
      (item) => item.productType === ProductType.AdditionalItems
    );
  }

  getTotalPrice(items: any[]): number {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  }

  onFieldChange(fieldName: string, value: any) {
    const updateField = this.fieldMappings[fieldName];
    if (updateField) {
      updateField(value);
    } else {
      console.warn(`Field ${fieldName} does not exist on QuoteEntryComponent`);
    }
  }

  onSpecialConditionsChange(value: string) {
    this.enteredSpecialConditions.setValue(value);
  }

  onNotesChange(value: string) {
    this.enteredNotes.setValue(value);
  }

  private formatDateForDisplay(date: string): string {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  }

  private formatDateForStorage(date: string): string {
    const [year, month, day] = date.split('-');
    return `${day}-${month}-${year}`;
  }
}
