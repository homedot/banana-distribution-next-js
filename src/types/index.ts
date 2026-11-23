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

export interface SaleKayaItem {
  kayaType: string;
  kolaQuantity: number;
  /** Missing on items saved before per-kaya quality; fall back to the sale's. */
  qualityCategory?: QualityCategory;
  /** kg entered for this kaya type, before thandu. Missing on items saved before per-kaya pricing. */
  totalWeight?: number;
  /** Rate for this kaya type, per the sale's rateBasis. Missing on items saved before per-kaya pricing. */
  sellingRate?: number;
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
  /** Kola quantity per kaya type. Missing on sales saved before per-kaya quantities. */
  kayaItems?: SaleKayaItem[];
  /** Overall grade: the kaya items' shared grade, or "Mixed" when they differ. */
  qualityCategory: QualityCategory;
  kolaQuantity: number;
  /** Net kola weight in kg — the kaya weights minus thanduWeight. */
  totalWeight: number;
  /** Legacy stem count; new sales record thanduWeight instead. */
  thanduCount: number;
  /** Thandu (stem) weight in kg taken off the kola weight. Missing on older sales. */
  thanduWeight?: number;
  rateBasis: RateBasis;
  /** Average rate across the kaya items (grossTotal ÷ kolas or kg); each item has its own `sellingRate`. */
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

/** A kola category (kaya type) offered on New Sale. */
export interface KayaType {
  id: string;
  name: string;
  createdAt: string;
}

export interface AppData {
  kayaTypes: KayaType[];
  brokers: Broker[];
  batches: BrokerBatch[];
  vendors: Vendor[];
  sales: Sale[];
  payments: Payment[];
}

export type ActivityAction = "create" | "update" | "delete";
export type ActivityEntity = "sale" | "customer" | "payment" | "kola_category" | "broker" | "batch";

export interface ActivityChange {
  /** Field path, e.g. "amountCollected" or "paymentDetails.upiId". */
  field: string;
  from: unknown;
  to: unknown;
}

/** One audit entry: who created, edited or deleted which record, and when. */
export interface ActivityEntry {
  id: string;
  userId: string;
  userEmail: string;
  userRole: "admin" | "accountant";
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  label: string;
  detail: string;
  changes: ActivityChange[];
  createdAt: string;
}

export interface ActivityPage {
  items: ActivityEntry[];
  hasMore: boolean;
}
