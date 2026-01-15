// src/app/features/payment/payment.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../models/customer.model';


@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './payment.component.html',
  styles: [`
    .payment-option {
      transition: all 0.1s;
    }
    .payment-option.selected {
      border-color: #818872;
      background-color: #e5e7e1;
    }
  `]
})
export class PaymentComponent {
  
  // Inputs (Daten vom App-Container)
  @Input({ required: true }) cartTotal!: number;
  @Input() customer: Customer | null = null;
  @Input() paymentAmount: string = '';
  @Input() selectedPaymentType: 'cash' | 'delivery' | 'invoice' = 'cash';

  // Outputs (Events zurück an den App-Container)
  @Output() paymentAmountChange = new EventEmitter<string>();
  @Output() selectedPaymentTypeChange = new EventEmitter<'cash' | 'delivery' | 'invoice'>();
  @Output() completeTransaction = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
  

  // Zahlungsoptionen zur einfachen Iteration
  readonly paymentOptions = [
    {
      type: 'cash' as const,
      label: 'Barzahlung'
    },
    {
      type: 'delivery' as const,
      label: 'Lieferschein'
    },
    {
      type: 'invoice' as const,
      label: 'Rechnung'
    }
  ];

  // Abgeleitete Werte (werden berechnet und angezeigt)
  get paidAmount(): number {
    return parseFloat(this.paymentAmount) || 0;
  }

  get changeAmount(): number {
    return this.paidAmount - this.cartTotal;
  }

  // Hilfsmethode, um den Betrag schnell einzugeben
  public quickPay(amount: number): void {
    // Bei Kartenzahlung oder Rechnung wird der Gesamtbetrag angenommen
    if (this.selectedPaymentType !== 'cash') {
      this.paymentAmountChange.emit(this.cartTotal.toFixed(2));
    } else {
      // Bei Barzahlung wird der eingegebene Betrag verwendet
      this.paymentAmountChange.emit(amount.toFixed(2));
    }
  }

  // Füllt das Eingabefeld mit dem Gesamtbetrag
  public fillTotal(): void {
    this.paymentAmountChange.emit(this.cartTotal.toFixed(2));
  }
}