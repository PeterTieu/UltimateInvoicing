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
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../transaction.model';
import { WindowModule } from '@progress/kendo-angular-dialog';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';

@Component({
  selector: 'app-transaction-entry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    WindowModule,
    DropDownsModule,
  ],
  templateUrl: './transaction-entry.component.html',
  styleUrls: ['./transaction-entry.component.scss'],
})
export class TransactionEntryComponent implements OnInit, OnChanges {
  @Input() transaction: Transaction | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Transaction>();
  @Output() openBulkTransaction = new EventEmitter<string>();

  editableTransactionForm: FormGroup;
  transactionStatusOptions = Object.values(TransactionStatus);
  transactionTypes = Object.values(TransactionType);

  windowTop = 0;
  windowLeft = 0;
  windowWidth = 900;
  windowHeight = 450;

  transactionError: string | null = null;

  constructor(private fb: FormBuilder) {
    this.editableTransactionForm = this.fb.group({
      transactionNumber: [{ value: '', disabled: true }],
      transactionType: [null, Validators.required],
      customer: [null, [Validators.required, Validators.minLength(2)]],
      productCode: [null, [Validators.required, Validators.minLength(3)]],
      description: [null, [Validators.required, Validators.minLength(3)]],
      quantity: [null, [Validators.required, Validators.min(1)]],
      unitPriceInclGST: [null, [Validators.required, Validators.min(0)]],
      status: [null, Validators.required],
      totalPrice: [{ value: null, disabled: true }],
    });
  }

  ngOnInit(): void {
    this.populateForm();
    this.centerWindow();
    window.addEventListener('scroll', this.centerWindow.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.centerWindow.bind(this));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction']) {
      this.populateForm();
    }
  }

  populateForm(): void {
    if (this.transaction) {
      this.editableTransactionForm.patchValue({
        transactionNumber: this.transaction.transactionNumber,
        transactionType: this.transaction.transactionType,
        customer: this.transaction.customer,
        productCode: this.transaction.productCode,
        description: this.transaction.description,
        quantity: this.transaction.quantity,
        unitPriceInclGST: this.transaction.unitPriceInclGST,
        status: this.transaction.status,
        totalPrice: this.calculateTotalPrice(),
      });
    }
  }

  onBulkTransactionClick(): void {
    if (this.transaction?.bulkTransactionNumber) {
      this.close.emit(); // Close the current window
      this.openBulkTransaction.emit(this.transaction.bulkTransactionNumber); // Emit the event to open the BulkTransactionEntryComponent
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.editableTransactionForm.valid) {
      const updatedTransaction = {
        ...this.transaction,
        ...this.editableTransactionForm.value,
      };
      this.save.emit(updatedTransaction);
      this.transactionError = null;
    } else {
      this.transactionError = 'Please fill out all required fields correctly.';
    }
  }

  calculateTotalPrice(): number {
    const quantity = this.editableTransactionForm.get('quantity')?.value || 0;
    const unitPrice =
      this.editableTransactionForm.get('unitPriceInclGST')?.value || 0;
    return quantity * unitPrice;
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
