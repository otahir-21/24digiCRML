import * as XLSX from 'xlsx';

/**
 * Parse Excel file and return data for each sheet
 * @param {File} file - Excel file (.xlsx, .xls)
 * @returns {Promise<Array<{name: string, data: Array<Object>}>>}
 */
export function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheets = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          return {
            name: sanitizeCollectionName(sheetName),
            originalName: sheetName,
            data: jsonData,
            rowCount: jsonData.length,
          };
        });

        resolve(sheets);
      } catch (err) {
        reject(new Error('Failed to parse Excel file: ' + err.message));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function sanitizeCollectionName(name) {
  return name
    .replace(/[^a-zA-Z0-9_\s-]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase()
    .slice(0, 50) || 'sheet';
}
