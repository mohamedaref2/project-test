
// Mock functions that would connect to Google Apps Script in a real implementation
import { UserRecord } from "@/types";

const mockGoogleScriptFunctions = {
  validateKey: (key: string) => {
    return new Promise<{isValid: boolean, rank: string, used: boolean, key: string, previousFiles: UserRecord[]}>((resolve) => {
      setTimeout(() => {
        if (key === "123456") {
          resolve({
            isValid: true,
            rank: "قائد",
            used: false,
            key: "123456",
            previousFiles: [
              {
                name: "محمد أحمد",
                key: "123456",
                pdf1: "https://example.com/pdf1",
                pdf2: "https://example.com/pdf2",
                pdf3: "https://example.com/pdf3",
                teamNumber: "5",
                serialNumber: "101",
                gender: "قائد",
                timestamp: "2025/04/01",
                rank: "قائد",
                date: "2025/04/01"
              },
              {
                name: "أحمد علي",
                key: "123456",
                pdf1: "https://example.com/pdf1_2",
                pdf2: null,
                pdf3: "https://example.com/pdf3_2",
                teamNumber: "6",
                serialNumber: "102",
                gender: "قائد",
                timestamp: "2025/03/20",
                rank: "قائد",
                date: "2025/03/20"
              }
            ]
          });
        } else {
          resolve({
            isValid: true,
            rank: "كشاف",
            used: true,
            key: key,
            previousFiles: [
              {
                name: "خالد علي",
                key: key,
                pdf1: "https://example.com/pdf1",
                pdf2: "https://example.com/pdf2",
                pdf3: null,
                teamNumber: "7",
                serialNumber: "103",
                gender: "",
                timestamp: "2025/04/05",
                rank: "كشاف",
                date: "2025/04/05"
              }
            ]
          });
        }
      }, 1000);
    });
  },
  
  processFormWithImage: (data: any) => {
    return new Promise<{pdf1: string | null, pdf2: string | null, pdf3: string | null}>((resolve) => {
      setTimeout(() => {
        resolve({
          pdf1: "https://example.com/pdf1",
          pdf2: "https://example.com/pdf2",
          pdf3: data.rank === "لجان" || data.rank === "قائد" ? "https://example.com/pdf3" : null
        });
      }, 2000);
    });
  }
};

export default mockGoogleScriptFunctions;
