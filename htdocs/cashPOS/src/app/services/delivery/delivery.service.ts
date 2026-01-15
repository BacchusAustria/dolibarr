import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { ApiService } from '../api.service';
import { CartItem } from '../../models/cart.model';

// Interfaces für bessere Typensicherheit
export interface DolibarrOrder {
    id: string;
    socid: string;
    ref: string;
    total_ttc: string;
    lines?: any[]; // Vereinfacht, enthält die Zeilen-IDs die wir fürs Mapping brauchen
}

@Injectable({
    providedIn: 'root'
})
export class DeliveryService {

    constructor(private apiService: ApiService) { }

    /**
     * Hauptprozess: Erstellt einen kompletten Lieferschein aus dem Warenkorb.
     * Wrapper-Funktion, die alle Schritte nacheinander ausführt.
     */
    async createFullDeliveryProcess(socid: string, items: CartItem[]): Promise<string> {
        try {
            // 1. Auftrag (Commande) anlegen
            const orderId = await this.createOrderDraft(socid);
            console.log('Order Draft created:', orderId);

            // 2. Positionen zum Auftrag hinzufügen
            for (const item of items) {
                await this.addOrderLine(orderId, item);
            }

            // 3. Auftrag validieren
            await this.validateOrder(orderId);
            console.log('Order validated');

            // 4. Lieferschein (Shipment) aus Auftrag erstellen
            // Dazu müssen wir den validierten Auftrag neu laden, um die Zeilen-IDs zu bekommen
            const validatedOrder = await this.getOrder(orderId);
            const shipmentId = await this.createShipmentFromOrder(validatedOrder);
            console.log('Shipment created:', shipmentId);

            // 5. Lieferschein validieren (bucht Bestand)
            await this.validateShipment(shipmentId);
            console.log('Shipment validated');

            // 6. Lieferschein abschließen
            await this.closeShipment(shipmentId);
            console.log('Shipment closed');

            return shipmentId;

        } catch (error) {
            console.error('Error in delivery process:', error);
            throw error;
        }
    }

    // --- Schritt 1: Auftrag anlegen ---

    async createOrderDraft(socid: string): Promise<string> {
        const payload = {
            socid: socid,
            type: 0, // Standard-Bestellung
            date: Math.floor(Date.now() / 1000),
            date_livraison: Math.floor(Date.now() / 1000), // Lieferdatum = Heute
            note_private: `POS-Lieferschein - ${new Date().toLocaleString('de-DE')}`,
            origin: 'takepos', // Markierung Herkunft
            shipping_method_id: 1 // Optional: Abholung oder Versandart ID setzen
        };

        const response = await lastValueFrom(this.apiService.post<any>('/orders', payload));
        return typeof response === 'object' ? String(response.id) : String(response);
    }

    // --- Schritt 2: Positionen hinzufügen ---

    async addOrderLine(orderId: string, item: CartItem): Promise<void> {
        const payload = {
            subprice: item.price, // Nettopreis oder Brutto je nach Konfig
            qty: item.quantity,
            tva_tx: item.tva_tx,
            fk_product: parseInt(item.id),
            remise_percent: item.discount?.type === 'percent' ? item.discount.value : 0,
            price_base_type: 'TTC', // Preis inkl. Steuern, analog zu InvoiceService
            product_type: item.type // Wichtig für Service vs. Produkt
        };

        await lastValueFrom(
            this.apiService.post(`/orders/${orderId}/lines`, payload, { responseType: 'json' })
        );
    }

    // --- Schritt 3: Auftrag validieren ---

    async validateOrder(orderId: string): Promise<void> {
        // idwarehouse: '1' könnte hier übergeben werden, um Lager für Reservierung zu setzen
        await lastValueFrom(
            this.apiService.post(`/orders/${orderId}/validate`, { idwarehouse: '1' }, { responseType: 'json' })
        );
    }

    // --- Hilfsfunktion: Auftrag holen (für Mapping) ---

    async getOrder(orderId: string): Promise<DolibarrOrder> {
        return await lastValueFrom(this.apiService.get<DolibarrOrder>(`/orders/${orderId}`));
    }

    // --- Schritt 4: Lieferschein (Shipment) erstellen ---

    async createShipmentFromOrder(order: DolibarrOrder): Promise<string> {
        if (!order.lines || order.lines.length === 0) {
            throw new Error('Order has no lines to ship');
        }

        const shipmentLines = order.lines.map((line: any) => ({
            origin_line_id: line.id,
            qty: parseFloat(line.qty) // Volle Menge liefern
        }));

        const payload = {
            socid: order.socid,
            type: 0,
            origin_type: 'order',
            origin_id: order.id,
            lines: shipmentLines,
            date: Math.floor(Date.now() / 1000),
            date_livraison: Math.floor(Date.now() / 1000),
            note_private: 'Erstellt mit CashPOS',
            shipping_method_id: 1
        };


        const response = await lastValueFrom(this.apiService.post<any>('/shipments', payload));
        return typeof response === 'object' ? String(response.id) : String(response);
    }

    // --- Schritt 5: Lieferschein validieren ---

    async validateShipment(shipmentId: string): Promise<void> {
        const payload = {

            "notrigger": 0
        };

        await lastValueFrom(

            this.apiService.post(`/shipments/${shipmentId}/validate`, payload, { responseType: 'json' })
        );
    }

    // --- Schritt 6 : Lieferschein abschließen ---
    async closeShipment(shipmentId: string): Promise<void> {
              const payload = {

            "notrigger": 0
        };
        await lastValueFrom(
            this.apiService.post(`/shipments/${shipmentId}/close`, payload, { responseType: 'json' })
        );
    }

    //Lieferschein holen
    async getShipment(shipmentId: string): Promise<any> {
        return await lastValueFrom(this.apiService.get<any>(`/shipments/${shipmentId}`));
    }
    
    //alle Lieferscheine holen
    async getShipments(): Promise<any[]> {
        return await lastValueFrom(this.apiService.get<any[]>(`/shipments`));
    }
    
    /**
     * ROLLBACK: Löscht einen Auftrag (Entwurf), falls etwas schief geht.
     */
    async deleteOrder(orderId: string): Promise<void> {
        try {
            await lastValueFrom(this.apiService.delete(`/orders/${orderId}`));
            console.log(`Rollback: Order ${orderId} gelöscht.`);
        } catch (e) {
            console.error(`Rollback fehlgeschlagen für Order ${orderId}`, e);
        }
    }
}