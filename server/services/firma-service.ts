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

export async function getFirmaNameById(id: number) {
  try {
    console.log("Firma adı getiriliyor...");
    const sql = `
      SELECT name FROM firmalar
      WHERE id = ? AND deleted_at IS NULL
    `;

    const result = await executeQuery(sql, [id]);
    return result[0]?.name || null;
  } catch (error) {
    console.error('Firma adı getirme hatası:', error);
    throw error;
  }
}

export default {
  getFirmalar,
  getFirmaNameById
};