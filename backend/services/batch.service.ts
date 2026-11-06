import { connectDB } from "@/backend/config/db";
import { Batch } from "@/backend/models/Batch";
import { Broker } from "@/backend/models/Broker";
import { ApiError } from "@/backend/utils/ApiError";

export interface BatchInput {
  brokerId: string;
  kayaType: string;
  inwardQtyKolas: number;
  totalWeightKg: number;
  thanduPerKola?: number;
  ratePerKola: number;
  date: string;
  status?: "active" | "closed";
}

export async function listBatches() {
  await connectDB();
  return Batch.find().sort({ date: -1 });
}

export async function createBatch(input: BatchInput) {
  await connectDB();

  const broker = await Broker.findById(input.brokerId);
  if (!broker) throw new ApiError(400, "brokerId does not match an existing broker");

  return Batch.create(input);
}

export async function getBatchById(id: string) {
  await connectDB();
  const batch = await Batch.findById(id);
  if (!batch) throw new ApiError(404, "Batch not found");
  return batch;
}

export async function updateBatch(id: string, input: Partial<BatchInput>) {
  await connectDB();

  if (input.brokerId) {
    const broker = await Broker.findById(input.brokerId);
    if (!broker) throw new ApiError(400, "brokerId does not match an existing broker");
  }

  const batch = await Batch.findByIdAndUpdate(id, input, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!batch) throw new ApiError(404, "Batch not found");
  return batch;
}

export async function deleteBatch(id: string) {
  await connectDB();
  const batch = await Batch.findByIdAndDelete(id);
  if (!batch) throw new ApiError(404, "Batch not found");
  return batch;
}
