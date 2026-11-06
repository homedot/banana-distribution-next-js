import type { AppData, Broker, BrokerBatch, Distribution, Vendor } from "@/src/types";

const brokers: Broker[] = [
  {
    id: "brk_murugan",
    name: "Murugan Traders",
    location: "Thanjavur",
    vehicleNumber: "TN 49 AX 1187",
    phone: "+91 98421 10234",
    createdAt: "2026-10-20T04:00:00.000Z",
  },
  {
    id: "brk_selva",
    name: "Selva Agencies",
    location: "Trichy",
    vehicleNumber: "TN 45 BJ 5521",
    phone: "+91 97889 44110",
    createdAt: "2026-10-20T04:00:00.000Z",
  },
  {
    id: "brk_karthik",
    name: "Karthik & Sons",
    location: "Theni",
    vehicleNumber: "TN 56 CK 8842",
    phone: "+91 90031 22876",
    createdAt: "2026-10-20T04:00:00.000Z",
  },
  {
    id: "brk_rathna",
    name: "Rathna Brokers",
    location: "Dindigul",
    vehicleNumber: "TN 58 DP 3390",
    phone: "+91 94421 77302",
    createdAt: "2026-10-20T04:00:00.000Z",
  },
  {
    id: "brk_vetrivel",
    name: "Vetrivel Bananas",
    location: "Cumbum",
    vehicleNumber: "TN 72 EF 6630",
    phone: "+91 96291 55082",
    createdAt: "2026-10-20T04:00:00.000Z",
  },
  {
    id: "brk_kragro",
    name: "K.R. Agro",
    location: "Mettupalayam",
    vehicleNumber: "TN 41 GH 9014",
    phone: "+91 93445 20091",
    createdAt: "2026-10-18T04:00:00.000Z",
  },
];

const batches: BrokerBatch[] = [
  {
    id: "bat_murugan_1",
    brokerId: "brk_murugan",
    kayaType: "Nendran",
    inwardQtyKolas: 420,
    totalWeightKg: 6300,
    thanduPerKola: 6,
    ratePerKola: 38,
    date: "2026-10-24T05:00:00.000Z",
    status: "closed",
  },
  {
    id: "bat_selva_1",
    brokerId: "brk_selva",
    kayaType: "Poovan",
    inwardQtyKolas: 300,
    totalWeightKg: 4200,
    thanduPerKola: 7,
    ratePerKola: 33,
    date: "2026-10-26T05:00:00.000Z",
    status: "closed",
  },
  {
    id: "bat_karthik_1",
    brokerId: "brk_karthik",
    kayaType: "Robusta",
    inwardQtyKolas: 260,
    totalWeightKg: 3900,
    thanduPerKola: 6,
    ratePerKola: 29,
    date: "2026-10-28T05:00:00.000Z",
    status: "closed",
  },
  {
    id: "bat_rathna_1",
    brokerId: "brk_rathna",
    kayaType: "Red Banana",
    inwardQtyKolas: 180,
    totalWeightKg: 2700,
    thanduPerKola: 5,
    ratePerKola: 46,
    date: "2026-10-29T05:00:00.000Z",
    status: "closed",
  },
  {
    id: "bat_vetrivel_1",
    brokerId: "brk_vetrivel",
    kayaType: "Robusta",
    inwardQtyKolas: 300,
    totalWeightKg: 7500,
    thanduPerKola: 6,
    ratePerKola: 27,
    date: "2026-10-30T05:00:00.000Z",
    status: "active",
  },
  {
    id: "bat_kragro_1",
    brokerId: "brk_kragro",
    kayaType: "Poovan",
    inwardQtyKolas: 200,
    totalWeightKg: 2800,
    thanduPerKola: 5,
    ratePerKola: 30,
    date: "2026-10-22T05:00:00.000Z",
    status: "closed",
  },
];

const vendors: Vendor[] = [
  { id: "ven_selvam", name: "Selvam Stores", contactPerson: "Selvam Raj", phone: "+91 90472 10981", location: "Ernakulam", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_anitha", name: "Anitha Traders", contactPerson: "Anitha K.", phone: "+91 88915 33421", location: "Thrissur", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_kumar", name: "Kumar Fruit Mart", contactPerson: "Kumar P.", phone: "+91 94003 21187", location: "Ernakulam", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_devi", name: "Devi Vegetable Shop", contactPerson: "Devi S.", phone: "+91 90371 44502", location: "Thrissur", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_ganesh", name: "Ganesh Fruits", contactPerson: "Ganesh Kumar", phone: "+91 97456 10923", location: "Ernakulam", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_lakshmi", name: "Lakshmi Traders", contactPerson: "Lakshmi N.", phone: "+91 96332 87541", location: "Thrissur", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_newstar", name: "New Star Fruits", contactPerson: "Ratheesh M.", phone: "+91 89034 51267", location: "Ernakulam", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_priya", name: "Priya Fruit Stall", contactPerson: "Priya V.", phone: "+91 95433 67210", location: "Thrissur", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_ssveg", name: "SS Vegetables", contactPerson: "Suresh S.", phone: "+91 90481 23675", location: "Ernakulam", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_coastal", name: "Coastal Fruit Traders", contactPerson: "Jameel A.", phone: "+91 88489 90213", location: "Ernakulam", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_greenvalley", name: "Green Valley Mart", contactPerson: "Teena Joseph", phone: "+91 94972 65810", location: "Thrissur", createdAt: "2026-10-20T04:00:00.000Z" },
  { id: "ven_nambiar", name: "Nambiar Stores", contactPerson: "Nambiar K.", phone: "+91 90742 33190", location: "Ernakulam", createdAt: "2026-10-18T04:00:00.000Z" },
  { id: "ven_thrissurfresh", name: "Thrissur Fresh Mart", contactPerson: "Biju Thomas", phone: "+91 86060 12745", location: "Thrissur", createdAt: "2026-10-18T04:00:00.000Z" },
];

function dist(
  id: string,
  vendorId: string,
  batch: BrokerBatch,
  kolaQuantity: number,
  rate: number,
  collected: number,
  date: string,
  quality: Distribution["qualityCategory"] = "Grade A",
  discount = 0,
  paymentMethod: Distribution["paymentMethod"] = "cash"
): Distribution {
  const totalWeight =
    Math.round(
      (batch.totalWeightKg / batch.inwardQtyKolas) * kolaQuantity * 100
    ) / 100;
  const thanduCount = batch.thanduPerKola * kolaQuantity;
  const grossTotal = Math.round(rate * kolaQuantity * 100) / 100;
  const netPayable = Math.max(0, grossTotal - discount);
  const balanceDue = Math.max(0, netPayable - collected);
  return {
    id,
    vendorId,
    batchId: batch.id,
    kayaType: batch.kayaType,
    qualityCategory: quality,
    kolaQuantity,
    totalWeight,
    thanduCount,
    rateBasis: "per_kola",
    dailySellingRate: rate,
    grossTotal,
    discount,
    netPayable,
    amountCollected: collected,
    paymentMethod,
    balanceDue,
    customFields: [],
    notes: "",
    date,
    createdAt: date,
    updatedAt: date,
  };
}

const bMurugan = batches[0];
const bSelva = batches[1];
const bKarthik = batches[2];
const bRathna = batches[3];
const bVetrivel = batches[4];
const bKrAgro = batches[5];

const distributions: Distribution[] = [
  dist("dis_1", "ven_selvam", bMurugan, 150, 42, 6300, "2026-10-25T06:30:00.000Z", "Grade A"),
  dist("dis_2", "ven_anitha", bMurugan, 120, 40, 0, "2026-10-25T09:10:00.000Z", "Grade B"),
  dist("dis_3", "ven_kumar", bMurugan, 150, 41, 4000, "2026-10-26T07:45:00.000Z", "Grade A", 0, "upi"),

  dist("dis_4", "ven_devi", bSelva, 180, 37, 6660, "2026-10-27T06:15:00.000Z", "Grade A", 0, "bank_transfer"),
  dist("dis_5", "ven_ganesh", bSelva, 120, 36, 2000, "2026-10-28T08:20:00.000Z", "Mixed"),

  dist("dis_6", "ven_lakshmi", bKarthik, 140, 33, 4620, "2026-10-29T06:50:00.000Z", "Grade A", 0, "upi"),
  dist("dis_7", "ven_newstar", bKarthik, 120, 32, 0, "2026-10-29T10:05:00.000Z", "Grade B"),

  dist("dis_8", "ven_priya", bRathna, 90, 50, 4500, "2026-10-30T07:00:00.000Z", "Grade A"),
  dist("dis_9", "ven_ssveg", bRathna, 90, 49, 1500, "2026-10-30T11:30:00.000Z", "Grade A", 0, "upi"),

  dist("dis_10", "ven_coastal", bVetrivel, 150, 30, 4500, "2026-10-31T06:40:00.000Z", "Grade A", 0, "bank_transfer"),
  dist("dis_11", "ven_greenvalley", bVetrivel, 110, 29, 1500, "2026-11-01T07:55:00.000Z", "Mixed"),

  dist("dis_12", "ven_nambiar", bKrAgro, 120, 34, 4080, "2026-10-23T06:20:00.000Z", "Grade A"),
  dist("dis_13", "ven_thrissurfresh", bKrAgro, 80, 33, 2640, "2026-10-23T09:40:00.000Z", "Grade A", 0, "upi"),
];

export const seedData: AppData = {
  brokers,
  batches,
  vendors,
  distributions,
};
