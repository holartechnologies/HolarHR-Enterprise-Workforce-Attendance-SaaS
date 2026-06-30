import { Queue, Worker, Job } from "bullmq";

const connection = {
  host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : "localhost",
  port: process.env.REDIS_URL ? parseInt(new URL(process.env.REDIS_URL).port || "6379") : 6379,
};

export const reportQueue = new Queue("report-generation", { connection });
export const aiQueue = new Queue("ai-processing", { connection });
export const exportQueue = new Queue("exports", { connection });

export async function addReportJob(companyId: string, type: string, params: Record<string, unknown>) {
  return reportQueue.add("generate-report", { companyId, type, params });
}

export async function addAIJob(companyId: string, type: string, data: Record<string, unknown>) {
  return aiQueue.add("ai-process", { companyId, type, data });
}

export async function addExportJob(companyId: string, format: string, data: Record<string, unknown>) {
  return exportQueue.add("export", { companyId, format, data });
}
