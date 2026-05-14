/**
 * Triggers the native file picker in the main process and returns a normalized
 * CV JSON. The actual xlsx parsing happens in main (see electron/ipc/excel.cjs)
 * to keep heavy deps off the renderer bundle.
 */
export async function importExcel() {
  const result = await window.api.excel.importDialog();
  if (result.canceled) return { canceled: true };
  if (result.error) throw new Error(result.error);
  return { canceled: false, data: result.data, file: result.file };
}
