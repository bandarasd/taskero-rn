import { apiRequest, apiUpload } from "./apiClient";
import { ServiceCategory } from "../types";

export type WorkerCertification = {
  id: string;
  user_id: string;
  category: ServiceCategory;
  document_url: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export async function getWorkerCertifications(userId: string): Promise<WorkerCertification[]> {
  const data = await apiRequest<{ certifications: WorkerCertification[] }>(
    `/users/${encodeURIComponent(userId)}/certifications`
  );
  return data.certifications;
}

export async function submitCertification(
  userId: string,
  category: ServiceCategory,
  documentUri: string
): Promise<WorkerCertification> {
  const ext = documentUri.split(".").pop() ?? "jpg";
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext.toLowerCase());

  const fd = new FormData();
  fd.append("category", category);
  fd.append("document", {
    uri: documentUri,
    name: `cert_${category.toLowerCase()}.${ext}`,
    type: isImage ? `image/${ext}` : "application/pdf",
  } as any);

  const data = await apiUpload<{ certification: WorkerCertification }>(
    `/users/${encodeURIComponent(userId)}/certifications`,
    fd,
    "POST"
  );
  return data.certification;
}
