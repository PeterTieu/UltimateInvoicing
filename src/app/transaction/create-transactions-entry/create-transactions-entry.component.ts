import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DialogModule, WindowModule } from '@progress/kendo-angular-dialog';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { TabStripModule, SelectEvent } from '@progress/kendo-angular-layout';
import { EditorModule } from '@progress/kendo-angular-editor';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import * as XLSX from 'xlsx';
import { TransactionService } from '../transactions.service';
import { BulkTransactionService } from '../bulk-transactions.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction.model';

interface TransactionItem {
  transactionType: string;
  customer: string;
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
}

@Component({
  selector: 'app-create-transactions-entry',
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
  templateUrl: './create-transactions-entry.component.html',
  styleUrls: ['./create-transactions-entry.component.scss'],
})
export class CreateTransactionsEntryComponent implements OnInit, OnChanges {
  @Output() closeWindow = new EventEmitter<void>();

  opened = true;
  windowTop = 0;
  windowLeft = 0;
  windowWidth = 900;
  windowHeight = 600;

  uploadDropZoneClass: string = '';

  transactionItems: TransactionItem[] = [];
  filteredTransactionItems: TransactionItem[] = [];
  newTransactionItem: TransactionItem = {
    transactionType: '',
    customer: '',
    productCode: '',
    description: '',
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0,
    status: 'Draft',
  };
  transactionTypes: string[] = [
    'Google Ads',
    'Facebook Ads',
    'DMS Support',
    'Installation',
    'Travel',
    'IT Support',
    'Maintenance',
  ];

  transactionError: string | null = null;

  // Filter properties
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
  selectedTransactionType: TransactionType | null = null;

  transactionStatusOptions = [
    { text: 'All', value: null },
    { text: 'Draft', value: TransactionStatus.Draft },
    { text: 'Requested Invoice', value: TransactionStatus.RequestedInvoice },
    { text: 'Sent', value: TransactionStatus.Sent },
    { text: 'Paid', value: TransactionStatus.Paid },
    { text: 'Cancelled', value: TransactionStatus.Cancelled },
  ];
  selectedStatus: TransactionStatus | null = null;

  gstOptions = [
    { text: 'Included', value: null },
    { text: 'Included', value: 'included' },
    { text: 'Excluded', value: 'excluded' },
  ];
  selectedGstOption: string = 'included';

  searchTerm = '';

  myForm!: FormGroup;

  bulkTransactionNumber: string = '';

  constructor(
    private transactionService: TransactionService,
    private bulkTransactionService: BulkTransactionService,
    private fb: FormBuilder
  ) {} // Inject the TransactionService and BulkTransactionService

  ngOnInit(): void {
    this.bulkTransactionNumber =
      this.bulkTransactionService.getNextBulkTransactionNumber();
    this.myForm = this.fb.group({
      transactionType: [null, [Validators.required]],
      customer: [null, [Validators.required, Validators.minLength(2)]],
      productCode: [null, [Validators.required, Validators.minLength(3)]],
      description: [null, [Validators.required, Validators.minLength(3)]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitPrice: [null, [Validators.required, Validators.min(0)]],
      totalPrice: [null],
      status: [null],
    });
    this.centerWindow();
    window.addEventListener('scroll', this.centerWindow.bind(this));
    this.filterTransactionItems();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.centerWindow.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {}

  private centerWindow(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    this.windowTop = (screenHeight - this.windowHeight) / 2 + scrollTop;
    this.windowLeft = (screenWidth - this.windowWidth) / 2 + scrollLeft;
  }

  onCancel() {
    this.closeWindow.emit();
    this.opened = false;
  }

  onSubmit() {
    this.closeWindow.emit();
    this.opened = false;
  }

  onSaveDraft() {
    if (this.transactionItems.length === 0) {
      alert('There is no Transaction to save as draft');
      return;
    }

    const highestTransactionNumber =
      this.transactionService.transactions.reduce(
        (max, transaction) =>
          Math.max(max, parseInt(transaction.transactionNumber, 10)),
        0
      );

    const newTransactions = this.transactionItems.map((item, index) => {
      const transactionNumber = (
        highestTransactionNumber +
        index +
        1
      ).toString();
      const dateCreated = new Date().toISOString().split('T')[0]; // Format the date as YYYY-MM-DD

      return {
        transactionNumber: transactionNumber,
        bulkTransactionNumber: this.bulkTransactionNumber,
        transactionType: item.transactionType,
        customer: item.customer,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPriceInclGST: item.unitPrice.toString(),
        unitPriceExclGST: '',
        totalPriceInclGST: '',
        totalPriceExcl: '',
        dateCreated: dateCreated,
        status: TransactionStatus.Draft,
      } as Transaction;
    });

    newTransactions.forEach((transaction) => {
      this.transactionService.addTransaction(transaction);
    });

    this.bulkTransactionService.saveBulkTransaction({
      bulkTransactionNumber: this.bulkTransactionNumber,
      dateCreated: new Date().toISOString().split('T')[0],
    });

    this.closeWindow.emit();
    this.opened = false;
  }

  onRequestInvoice() {
    if (this.transactionItems.length === 0) {
      alert('There is no Transaction to request an invoice for');
      return;
    }

    const highestTransactionNumber =
      this.transactionService.transactions.reduce(
        (max, transaction) =>
          Math.max(max, parseInt(transaction.transactionNumber, 10)),
        0
      );

    const newTransactions = this.transactionItems.map((item, index) => {
      const transactionNumber = (
        highestTransactionNumber +
        index +
        1
      ).toString();
      const dateCreated = new Date().toISOString().split('T')[0]; // Format the date as YYYY-MM-DD

      return {
        transactionNumber: transactionNumber,
        bulkTransactionNumber: this.bulkTransactionNumber,
        transactionType: item.transactionType,
        customer: item.customer,
        productCode: item.productCode,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPriceInclGST: item.unitPrice.toString(),
        unitPriceExclGST: '',
        totalPriceInclGST: '',
        totalPriceExcl: '',
        dateCreated: dateCreated,
        status: TransactionStatus.RequestedInvoice,
      } as Transaction;
    });

    newTransactions.forEach((transaction) => {
      this.transactionService.addTransaction(transaction);
    });

    this.bulkTransactionService.saveBulkTransaction({
      bulkTransactionNumber: this.bulkTransactionNumber,
      dateCreated: new Date().toISOString().split('T')[0],
    });

    this.closeWindow.emit();
    this.opened = false;
  }

  public onTabSelect(e: SelectEvent): void {
    console.log(e);
  }

  addTransactionItem() {
    if (this.myForm.invalid) {
      this.transactionError = 'Please fill out all required fields correctly.';
      return;
    }

    // Copy form values to newTransactionItem
    this.newTransactionItem = this.myForm.value;
    this.newTransactionItem.totalPrice =
      this.newTransactionItem.quantity * this.newTransactionItem.unitPrice;

    this.transactionItems.push({ ...this.newTransactionItem });
    this.resetNewTransactionItem();
    this.transactionError = null;
    this.filterTransactionItems(); // Ensure filtering is done after adding a new item
    this.myForm.reset({
      transactionType: '',
      customer: '',
      productCode: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      status: 'Draft',
    });
  }

  removeTransactionItem(item: TransactionItem) {
    this.transactionItems = this.transactionItems.filter((i) => i !== item);

    // Remove form controls associated with the removed item
    this.myForm.removeControl(`transactionType-${item.productCode}`);
    this.myForm.removeControl(`customer-${item.productCode}`);
    this.myForm.removeControl(`productCode-${item.productCode}`);
    this.myForm.removeControl(`description-${item.productCode}`);
    this.myForm.removeControl(`quantity-${item.productCode}`);
    this.myForm.removeControl(`unitPrice-${item.productCode}`);
    this.myForm.removeControl(`totalPrice-${item.productCode}`);

    this.filterTransactionItems(); // Ensure filtering is done after removing an item
  }

  resetNewTransactionItem() {
    this.newTransactionItem = {
      transactionType: '',
      customer: '',
      productCode: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0,
      status: 'Draft',
    };
  }

  getTotalPrice(items: TransactionItem[]): number {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  }

  // Upload / Drag & Drop functions
  triggerFileInput() {
    const fileInput = document.getElementById(
      'file-upload'
    ) as HTMLInputElement;
    fileInput.click();
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.readExcelFile(file);
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDropZoneClass = '';
    const file = event.dataTransfer?.files[0];
    if (file) {
      this.readExcelFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDropZoneClass = 'dragover';
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.uploadDropZoneClass = '';
  }

  readExcelFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      this.populateTransactionItems(jsonData);
    };
    reader.readAsArrayBuffer(file);
  }

  populateTransactionItems(data: any) {
    const requiredFields = [
      'transactionType',
      'customer',
      'productCode',
      'description',
      'quantity',
      'unitPrice',
    ];

    const headers = data[0];
    const missingFields = requiredFields.filter(
      (field) => !headers.includes(field)
    );

    if (missingFields.length > 0) {
      this.transactionError = `Excel file is missing required columns: ${missingFields.join(
        ', '
      )}`;
      return;
    }

    const newItems: TransactionItem[] = data.slice(1).map((row: any) => ({
      transactionType: row[headers.indexOf('transactionType')],
      customer: row[headers.indexOf('customer')],
      productCode: row[headers.indexOf('productCode')],
      description: row[headers.indexOf('description')],
      quantity: row[headers.indexOf('quantity')],
      unitPrice: row[headers.indexOf('unitPrice')],
      totalPrice:
        row[headers.indexOf('quantity')] * row[headers.indexOf('unitPrice')],
      status: 'Draft',
    }));

    // Adding new items to transactionItems and setting up form controls for each item
    newItems.forEach((item: TransactionItem) => {
      this.transactionItems.push(item);
      this.myForm.addControl(
        `transactionType-${item.productCode}`,
        new FormControl(item.transactionType, Validators.required)
      );
      this.myForm.addControl(
        `customer-${item.productCode}`,
        new FormControl(item.customer, [
          Validators.required,
          Validators.minLength(2),
        ])
      );
      this.myForm.addControl(
        `productCode-${item.productCode}`,
        new FormControl(item.productCode, [
          Validators.required,
          Validators.minLength(3),
        ])
      );
      this.myForm.addControl(
        `description-${item.productCode}`,
        new FormControl(item.description, [
          Validators.required,
          Validators.minLength(3),
        ])
      );
      this.myForm.addControl(
        `quantity-${item.productCode}`,
        new FormControl(item.quantity, [Validators.required, Validators.min(1)])
      );
      this.myForm.addControl(
        `unitPrice-${item.productCode}`,
        new FormControl(item.unitPrice, [
          Validators.required,
          Validators.min(1),
        ])
      );
      this.myForm.addControl(
        `totalPrice-${item.productCode}`,
        new FormControl(item.totalPrice)
      );
    });

    this.transactionError = null;
    this.filterTransactionItems(); // Ensure filtering is done after populating items from the file
  }

  // Methods for filters
  onTypeChange(event: any) {
    this.selectedTransactionType = event.value;
    this.filterTransactionItems();
  }

  onStatusChange(event: any) {
    this.selectedStatus = event.value;
    this.filterTransactionItems();
  }

  onGstOptionChange(event: any) {
    this.selectedGstOption = event.value;
    this.filterTransactionItems();
  }

  onSearchTermChange() {
    this.filterTransactionItems();
  }

  filterTransactionItems() {
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredTransactionItems = this.transactionItems.filter(
      (item) =>
        (this.selectedTransactionType === null ||
          item.transactionType === this.selectedTransactionType) &&
        (this.selectedStatus === null || item.status === this.selectedStatus) &&
        (item.transactionType.toLowerCase().includes(searchTermLower) ||
          item.productCode.toLowerCase().includes(searchTermLower) ||
          item.customer.toLowerCase().includes(searchTermLower) ||
          item.description.toLowerCase().includes(searchTermLower))
    );
  }
}
