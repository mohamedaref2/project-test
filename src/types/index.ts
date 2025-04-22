
// Define step types for app navigation
export type StepType = "key" | "form" | "result";

// PDF results from the form submission
export interface PDFResult {
  pdf1?: string;
  pdf2?: string;
  pdf3?: string;
}

// User record structure from the database/API
export interface UserRecord {
  key: string;
  name: string;
  pdf1?: string;
  pdf2?: string;
  pdf3?: string;
  timestamp: string;
  rank: string;
  teamNumber?: string;
  serialNumber?: string;
  gender?: string;
}
