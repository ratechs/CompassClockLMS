// services/excel/BaseExcelHandler.js
import XLSX from "xlsx";
import fs from "fs";

class BaseExcelHandler {
  constructor() {
    if (this.constructor === BaseExcelHandler) {
      throw new Error("Cannot instantiate abstract class");
    }
    this.mapping = {};
    this.requiredFields = [];
    this.uploadType = "";
  }

  getMapping() { throw new Error("Must implement getMapping()"); }
  getRequiredFields() { throw new Error("Must implement getRequiredFields()"); }
  async processRow(row, context) { throw new Error("Must implement processRow()"); }

  readExcelFile(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[sheet]);
  }

  validateRow(row) {
    const errors = [];
    this.getRequiredFields().forEach(field => {
      if (!row[field] || row[field].toString().trim() === "") {
        errors.push(`Missing: ${field}`);
      }
    });
    return { isValid: errors.length === 0, errors };
  }

  mapColumns(row) {
    const mapped = {};
    Object.keys(this.getMapping()).forEach(key => {
      const excelKey = this.getMapping()[key];
      mapped[key] = row[excelKey] !== undefined ? row[excelKey] : null;
    });
    return mapped;
  }

  async processFile(filePath, context) {
    const results = { success: [], failed: [], total: 0 };

    try {
      const data = this.readExcelFile(filePath);
      results.total = data.length;

      for (const [index, rawRow] of data.entries()) {
        const rowNumber = index + 2;
        const validation = this.validateRow(rawRow);

        if (!validation.isValid) {
          results.failed.push({ row: rowNumber, errors: validation.errors });
          continue;
        }

        const mappedRow = this.mapColumns(rawRow);
        const result = await this.processRow(mappedRow, context);

        if (result.success) {
          results.success.push({ row: rowNumber, action: result.action, id: result.id });
        } else {
          results.failed.push({ row: rowNumber, errors: result.errors });
        }
      }
    } catch (error) {
      results.failed.push({ errors: error.message });
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return results;
  }

  getTemplateBuffer() {
    const headers = Object.keys(this.getMapping());
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      headers.map(h => `Sample_${h}`),
      ...Array(10).fill(headers.map(() => ""))
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, this.uploadType.toUpperCase());
    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}

export default BaseExcelHandler;