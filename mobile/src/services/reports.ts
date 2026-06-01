// Helper to request PDF report from API and save locally.
// Requires installation of `react-native-fs` (native module) in the mobile app.
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

type ReportParams = {
  startDate?: string;
  endDate?: string;
  charts?: { name: string; base64: string }[];
};

export async function downloadPdfReport(apiBase: string, token: string, params: ReportParams) {
  const url = `${apiBase.replace(/\/$/, '')}/reports/export/pdf`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate PDF: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = `transactions-report-${Date.now()}.pdf`;
  const path = Platform.OS === 'android' ? `${RNFS.DocumentDirectoryPath}/${fileName}` : `${RNFS.LibraryDirectoryPath}/${fileName}`;

  await RNFS.writeFile(path, buffer.toString('base64'), 'base64');
  return path;
}
