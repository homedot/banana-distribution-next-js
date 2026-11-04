export type PaymentMethod = "cash" | "upi" | "bank_transfer";

export type QualityCategory = "Grade A" | "Grade B" | "Mixed";

export type RateBasis = "per_kola" | "per_kg";

export type BatchStatus = "active" | "closed";

export type PaymentStatus = "paid" | "partial" | "pending";

export interface Broker {
  id: string;
  name: string;
  location: string;
  vehicleNumber: string;
  phone: string;
  createdAt: string;
}

export interface BrokerBatch {
  id: string;
  brokerId: string;
  kayaType: string;
  inwardQtyKolas: number;
  totalWeightKg: number;
  thanduPerKola: number;
  ratePerKola: number;
  date: string;
  status: BatchStatus;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  location: string;
  createdAt: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface Distribution {
  id: string;
  vendorId: string;
  batchId: string;
  kayaType: string;
  qualityCategory: QualityCategory;
  kolaQuantity: number;
  totalWeight: number;
  thanduCount: number;
  rateBasis: RateBasis;
  dailySellingRate: number;
  grossTotal: number;
  discount: number;
  netPayable: number;
  amountCollected: number;
  paymentMethod: PaymentMethod;
  balanceDue: number;
  customFields: CustomField[];
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  brokers: Broker[];
  batches: BrokerBatch[];
  vendors: Vendor[];
  distributions: Distribution[];
}
