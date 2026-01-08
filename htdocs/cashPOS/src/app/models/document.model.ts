export interface DetailViewConfig {
  title: string;
  modulePart: 'invoice' | 'shipment';
  ref: string;
  date: number;
  total?: string;
  statusLabel?: string;
  customerName: string;
  id: string; // Dolibarr ID für den PDF-Abruf
}