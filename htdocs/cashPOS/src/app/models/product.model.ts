import { Category } from './category.model';
export interface Product {
    /** Die interne ID des Objekts in der Dolibarr-Datenbank */
    id: string; 

    /** Der Referenzcode des Produkts (z.B. BARCODE oder SKU) */
    ref: string;

    /** Der vollständige Produktname */
    label: string; 

    /** Beschreibung des Produkts (kann lang sein) */
    description: string; 
    multiprices_ttc? : number[];

    /** Verkaufspreis ohne Steuern/Mehrwertsteuer (price_ttc ist der inkl. Steuern) */
    price: number; 

    /** Verkaufspreis inklusive Steuern/Mehrwertsteuer */
    price_ttc: number;

    /** Steuersatz in Prozent (z.B. 19 oder 7) */
    tva_tx: number; 
    
    /** Währungscode (z.B. 'EUR') */
    price_base_type: string;

    /** Status des Produkts (1=Verkaufbar, 0=Entwurf) */
    status: string; 
    
    /** Art des Produkts (1=Produkt, 0=Dienstleistung) */
    type: string; 
    
    /** Die Lagerbestandsmenge (kann ein String sein) */
    stock_reel: string; 

    /** Dolibarr-Kategorie-IDs, denen das Produkt zugeordnet ist (Array von Strings/Zahlen) */
    fk_default_bom: string | null; 
    
    /** Das Datum der letzten Änderung (als Unix-Zeitstempel-String) */
    date_update: string; 

    // Optional oder seltener verwendete Felder für eine POS-App
    
    /** EAN-13 Barcode */
    barcode?: string;

    /** Optionaler Mindestverkaufspreis */
    price_min?: number;
    
    /** ID der Lager (warehouse) */
    fk_warehouse?: string;

    /// Array von Kategorien, denen das Produkt zugeordnet ist
    categories?: Category[];

    
}