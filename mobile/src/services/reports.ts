// Helper to request PDF report from API and save locally.
// Requires installation of `react-native-fs` (native module) in the mobile app.
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { apiRequest } from './api/client';

type ReportParams = {
  startDate?: string;
  endDate?: string;
  charts?: { name: string; base64: string }[];
};

/**
 * Converte um Blob em uma string Base64 sem depender da classe Buffer do Node.js
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // O resultado do readAsDataURL vem no formato "data:application/pdf;base64,..."
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadPdfReport(_apiBase: string, _token: string, params: ReportParams) {
  // Usamos o apiRequest centralizado que já lida com URL, Tokens e Refresh
  const blob = await apiRequest.post<Blob>('/reports/export/pdf', params, {
    responseType: 'blob',
  });

  // Converte binário para base64 usando FileReader (compatível com React Native)
  const base64Data = await blobToBase64(blob);

  const fileName = `transactions-report-${Date.now()}.pdf`;
  const path = Platform.OS === 'android' ? `${RNFS.DocumentDirectoryPath}/${fileName}` : `${RNFS.LibraryDirectoryPath}/${fileName}`;
  
  await RNFS.writeFile(path, base64Data, 'base64');
  return path;
}
