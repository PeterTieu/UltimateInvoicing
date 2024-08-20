import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction.model';
import { WindowModule } from '@progress/kendo-angular-dialog';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { TransactionService } from '../transactions.service';

@Component({
  selector: 'app-bulk-transaction-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    WindowModule,
    DropDownsModule,
  ],
  templateUrl: './bulk-transaction-entry.component.html',
  styleUrls: ['./bulk-transaction-entry.component.scss'],
})
export class BulkTransactionEntryComponent implements OnInit, OnChanges {
  @Input() bulkTransactionNumber: string | null = null;
  @Input() transactions: Transaction[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Transaction[]>();

  editableTransactionForms: FormGroup[] = [];
  newTransactionForm: FormGroup;
  transactionStatusOptions = Object.values(TransactionStatus);
  transactionTypes = Object.values(TransactionType);

  windowTop = 0;
  windowLeft = 0;
  windowWidth = 1400;
  windowHeight = 650;

  transactionError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService
  ) {
    this.newTransactionForm = this.fb.group({
      transactionType: [null, Validators.required],
      customer: [null, [Validators.required, Validators.minLength(2)]],
      productCode: [null, [Validators.required, Validators.minLength(3)]],
      description: [null, [Validators.required, Validators.minLength(3)]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitPriceInclGST: [null, [Validators.required, Validators.min(0)]],
      status: [TransactionStatus.Draft, Validators.required],
    });
  }

  ngOnInit(): void {
    this.populateForms();
    this.centerWindow();
    window.addEventListener('scroll', this.centerWindow.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.centerWindow.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      this.populateForms();
    }
  }

  populateForms(): void {
    this.editableTransactionForms = this.transactions.map((transaction) =>
      this.fb.group({
        transactionNumber: [
          { value: transaction.transactionNumber, disabled: true },
        ],
        transactionType: [transaction.transactionType, Validators.required],
        customer: [
          transaction.customer,
          [Validators.required, Validators.minLength(2)],
        ],
        productCode: [
          transaction.productCode,
          [Validators.required, Validators.minLength(3)],
        ],
        description: [
          transaction.description,
          [Validators.required, Validators.minLength(3)],
        ],
        quantity: [
          transaction.quantity,
          [Validators.required, Validators.min(1)],
        ],
        unitPriceInclGST: [
          transaction.unitPriceInclGST,
          [Validators.required, Validators.min(0)],
        ],
        status: [transaction.status, Validators.required],
        totalPrice: [
          { value: this.calculateTotalPrice(transaction), disabled: true },
        ],
      })
    );
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.editableTransactionForms.every((form) => form.valid)) {
      const updatedTransactions = this.transactions.map(
        (transaction, index) => ({
          ...transaction,
          ...this.editableTransactionForms[index].value,
        })
      );
      this.transactionService.updateBulkTransaction(
        this.bulkTransactionNumber!,
        updatedTransactions
      );
      this.save.emit(updatedTransactions);
      this.transactionError = null;
    } else {
      this.transactionError = 'Please fill out all required fields correctly.';
    }
  }

  calculateTotalPrice(transaction: Transaction): number {
    const quantity = parseFloat(transaction.quantity) || 0;
    const unitPrice = parseFloat(transaction.unitPriceInclGST) || 0;
    return quantity * unitPrice;
  }

  calculateTotalPriceForAll(): number {
    return this.transactions.reduce(
      (total, transaction) => total + this.calculateTotalPrice(transaction),
      0
    );
  }

  getFormControl(form: FormGroup, controlName: string): FormControl {
    return form.get(controlName) as FormControl;
  }

  addTransactionItem(): void {
    if (this.newTransactionForm.invalid) {
      this.transactionError = 'Please fill out all required fields correctly.';
      return;
    }

    const highestTransactionNumber =
      this.transactionService.getHighestTransactionNumber();

    const newTransaction: Transaction = {
      ...this.newTransactionForm.value,
      transactionNumber: (highestTransactionNumber + 1).toString(),
      bulkTransactionNumber: this.bulkTransactionNumber!,
      dateCreated: new Date().toISOString().split('T')[0],
      unitPriceExclGST: '',
      totalPriceInclGST: '',
      totalPriceExcl: '',
    };

    this.transactions.push(newTransaction);
    this.populateForms();
    this.newTransactionForm.reset({
      transactionType: null,
      customer: '',
      productCode: '',
      description: '',
      quantity: '',
      unitPriceInclGST: '',
      status: TransactionStatus.Draft,
    });
    this.transactionError = null;
  }

  removeTransactionItem(index: number): void {
    this.transactions.splice(index, 1);
    this.populateForms();
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
}
