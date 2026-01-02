import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs'; 
import { ApiService } from '../api.service';
import { CartItem } from '../../models/cart.model';

export interface DolibarrInvoice {
    id: string;
    ref: string;
    total_ttc: string;
    date: number;
    socname: string;
    paye: string; // "0" für offen, "1" für bezahlt
    status: string; // "3" für storniert
}

@Injectable({
    providedIn: 'root'
})

export class InvoiceService {
    constructor(private apiService: ApiService) { }

    /**
     * Erstellt einen Rechnungsentwurf
     * Rückgabe: Die ID der Rechnung als String
     */

    async createDraft(socid: string): Promise<string> {
        const payload = {
            socid: socid, // Kunden-ID
            type: 0, // Verkaufsrechnung
            date: Math.floor(Date.now() / 1000),
            note_private: `Kassen-Rechnung - ${new Date().toLocaleString('de-DE')}`,
            pos_source: '1', //das ist die Nummer der Kasse
            module_source: 'takepos', //wichtig fürdie Belegnummern-Generierung (Steuert den Nummernkreis)
            mode_reglement_id: '4', //Zahlungsmodus: Barzahlung
            cond_reglement_id: '1' //Zahlungsbedingung: sofort
        };

        const response = await lastValueFrom(this.apiService.post<any>('/invoices', payload));

        return typeof response === 'object' ? String(response.id) : String(response);
    }

    /**
     * Fügt eine Position hinzu
     */
    async addLine(invoiceId: string, item: CartItem): Promise<void> {
        const payload = {
            subprice: item.price,
            qty: item.quantity,
            tva_tx: item.tva_tx,
            fk_product: parseInt(item.id),
            remise_percent: item.discount?.type === 'percent' ? item.discount.value : 0,
            price_base_type: 'TTC' // Preis inklusive Steuern
        };
        try {
            await lastValueFrom(
                this.apiService.post(`/invoices/${invoiceId}/lines`, payload, { responseType: 'text' })
            );
        } catch (error) {
            console.error('Line Add Error:', error);
            throw error;
        }
    }

    /**
       * Validieren
       */
    async validate(invoiceId: string): Promise<void> {
        try {
            await lastValueFrom(
                this.apiService.post(`/invoices/${invoiceId}/validate`, {}, { responseType: 'text' })
            );
        } catch (error) {
            console.error('Invoice Validation Error:', error);
            throw error;
        }

    }

    /**
     * Zahlung buchen
     */
    async addPayment(invoiceId: string, amount: number, paymentType: string): Promise<void> {
        const payload = {
            datepaye: Math.floor(Date.now() / 1000),
            paymentid: this.mapPaymentType(paymentType),
            closepaidinvoices: "yes",
            amount: amount,
            accountid: 1, // Standard-Kassenkonto
            num_payment: `POS-${new Date().toISOString()}`
        };
        try {
            await lastValueFrom(
                this.apiService.post(`/invoices/${invoiceId}/payments`, payload, { responseType: 'text' })
            );
        } catch (error) {
            console.error('Payment Add Error:', error);
            throw error;
        }
    }

    /**
     * ROLLBACK: Löscht eine Rechnung (Entwurf), falls etwas schief geht.
     */
    async deleteInvoice(invoiceId: string): Promise<void> {
        try {
            await lastValueFrom(
                this.apiService.delete(`/invoices/${invoiceId}`)
            );
            console.log(`Rollback erfolgreich: Rechnung ${invoiceId} gelöscht.`);
        } catch (e) {
            console.error(`Rollback fehlgeschlagen für Rechnung ${invoiceId}`, e);
        }
    }

    private mapPaymentType(type: string): string {
        const mapping: any = { 'cash': 4, 'delivery': 6, 'invoice': 2 };
        return mapping[type] || 4;
    }
    async getInvoices(): Promise<any[]> {
        const response = await lastValueFrom(this.apiService.get<any[]>('/invoices'));
        return response;
    }
}