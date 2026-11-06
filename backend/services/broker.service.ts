import { connectDB } from "@/backend/config/db";
import { Broker } from "@/backend/models/Broker";
import { ApiError } from "@/backend/utils/ApiError";

export interface BrokerInput {
  name: string;
  location: string;
  vehicleNumber?: string;
  phone?: string;
}

export async function listBrokers() {
  await connectDB();
  return Broker.find().sort({ createdAt: -1 });
}

export async function createBroker(input: BrokerInput) {
  await connectDB();
  return Broker.create(input);
}

export async function getBrokerById(id: string) {
  await connectDB();
  const broker = await Broker.findById(id);
  if (!broker) throw new ApiError(404, "Broker not found");
  return broker;
}

export async function updateBroker(id: string, input: Partial<BrokerInput>) {
  await connectDB();
  const broker = await Broker.findByIdAndUpdate(id, input, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!broker) throw new ApiError(404, "Broker not found");
  return broker;
}

export async function deleteBroker(id: string) {
  await connectDB();
  const broker = await Broker.findByIdAndDelete(id);
  if (!broker) throw new ApiError(404, "Broker not found");
  return broker;
}
