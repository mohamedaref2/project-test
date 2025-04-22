
export interface PDFResult {
  pdf1: string | null;
  pdf2: string | null;
  pdf3: string | null;
}

export interface UserRecord {
  name: string;
  key: string;
  pdf1: string | null;
  pdf2: string | null;
  pdf3: string | null;
  teamNumber?: string;
  serialNumber?: string;
  gender?: string;
  date: string;
}

export type StepType = "key" | "form" | "result";
