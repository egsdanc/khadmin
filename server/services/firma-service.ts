import { executeQuery } from './connection';

export async function getFirmalar() {
  try {
    console.log("Firmalar getiriliyor...");
    const sql = `
      SELECT * FROM firmalar
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
    `;

    const result = await executeQuery(sql);
    return result;
  } catch (error) {
    console.error('Firmaları getirme hatası:', error);
    throw error;
  }
}

export default {
  getFirmalar
};