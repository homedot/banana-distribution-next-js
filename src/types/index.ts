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

/** Extra details for non-cash payments. Only the selected method's fields are filled. */
export interface PaymentDetails {
  upiId: string;
  upiTransactionId: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankReference: string;
}

export interface Sale {
  id: string;
  vendorId: string;
  /** Stock batch — only on sales created before batches were removed from New Sale. */
  batchId?: string | null;
  /** Display label — all kaya types joined with ", ". */
  kayaType: string;
  /** Every kaya type in the sale. Missing/empty on older single-type sales. */
  kayaTypes?: string[];
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
  /** Missing on sales saved before this field existed. */
  paymentDetails?: PaymentDetails;
  balanceDue: number;
  customFields: CustomField[];
  notes: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAllocation {
  saleId: string;
  amount: number;
}

export interface Payment {
  id: string;
  vendorId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  reference: string;
  notes: string;
  allocations: PaymentAllocation[];
  createdAt: string;
}

export type PaymentInput = Pick<Payment, "vendorId" | "amount" | "method" | "date" | "reference" | "notes">;

export interface AppData {
  brokers: Broker[];
  batches: BrokerBatch[];
  vendors: Vendor[];
  sales: Sale[];
  payments: Payment[];
}
