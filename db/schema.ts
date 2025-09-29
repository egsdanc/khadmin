import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  text,
  decimal,
  boolean,
  datetime,
  year,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const bakiye_islemleri = mysqlTable("bakiye_islemleri", {
  id: int("id").primaryKey().autoincrement(),
  bayi_id: int("bayi_id").notNull(),
  miktar: decimal("miktar", { precision: 10, scale: 2 }).notNull(),
  bakiye_sonrasi: decimal("bakiye_sonrasi", {
    precision: 10,
    scale: 2,
  }).notNull(),
  aciklama: text("aciklama"),
  created_at: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
    .notNull(),
  manuel_yukleme: decimal("manuel_yukleme", {
    precision: 10,
    scale: 2,
  }).default(sql`NULL`),
  iyzico_yukleme: decimal("iyzico_yukleme", {
    precision: 10,
    scale: 2,
  }).default(sql`NULL`),
  sipay_yukleme: decimal("sipay_yukleme", {
    precision: 10,
    scale: 2,
  }).default(sql`NULL`),
  invoice_id: varchar("invoice_id", { length: 100 }),
  status: int("status").default(0),
});

export const companies = mysqlTable("firmalar", {
  id: int("id").primaryKey().autoincrement(),
  name: text("name").notNull(),
  firma_unvan: text("firma_unvan").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).default(""),
  address: text("address"),
  firma: varchar("firma", { length: 255 }),
  vergi_dairesi: varchar("vergi_dairesi", { length: 255 }).default(""),
  vergi_no: varchar("vergi_no", { length: 50 }).default(""),
  tc_no: varchar("tc_no", { length: 20 }).default(""),
  iban: varchar("iban", { length: 50 }).default(""),
  durum: varchar("durum", { length: 20 }).default("active"),
  test_sayisi: int("test_sayisi").default(0),
  superadmin_oran: decimal("superadmin_oran", {
    precision: 10,
    scale: 2,
  }).default("0"),
  deleted_at: datetime("deleted_at").default(sql`NULL`),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const insertCompanySchema = createInsertSchema(companies);
export const selectCompanySchema = createSelectSchema(companies);
export type InsertCompany = typeof companies.$inferInsert;
export type SelectCompany = typeof companies.$inferSelect;

export const testler = mysqlTable("testler", {
  id: int("id").primaryKey().autoincrement(),
  plaka: varchar("plaka", { length: 250 }),
  sase: varchar("sase", { length: 250 }),
  motor: varchar("motor", { length: 250 }),
  marka: varchar("marka", { length: 100 }),
  model: varchar("model", { length: 100 }),
  kontrolmod: varchar("kontrolmod", { length: 450 }),
  km: varchar("km", { length: 450 }),
  ucret: decimal("ucret", { precision: 10, scale: 2 }).default("0"),
  yil: year("yil"),
  gosterge_km: int("gosterge_km"),
  paket: varchar("paket", { length: 250 }),
  aciklama: varchar("aciklama", { length: 500 }),
  usersid: int("usersid"),
  test_id: int("test_id"),
  tarih: datetime("tarih").default(sql`CURRENT_TIMESTAMP`),
});

export const insertTestlerSchema = createInsertSchema(testler);
export const selectTestlerSchema = createSelectSchema(testler);
export type InsertTestler = typeof testler.$inferInsert;
export type SelectTestler = typeof testler.$inferSelect;

export const users = mysqlTable("kullanicilar", {
  id: int("id").primaryKey().autoincrement(),
  isim: varchar("isim", { length: 150 }).notNull(),
  sifre: varchar("sifre", { length: 150 }).notNull(),
  macAdress: varchar("macAdress", { length: 150 }).notNull(),
  firstlogin: boolean("firstlogin").notNull().default(false),
  created_at: datetime("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: datetime("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
  deleted_at: datetime("deleted_at").default(sql`NULL`),
  firma_id: int("firma_id")
    .references(() => companies.id, { onDelete: "set null" })
    .default(sql`NULL`),
  bayi_id: int("bayi_id")
    .references(() => companies.id, { onDelete: "set null" })
    .default(sql`NULL`),
});

export const panel_users = mysqlTable("panel_users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firma_id: int("firma_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  bayi_id: int("bayi_id").references(() => bayiler.id, {
    onDelete: "set null",
  }),
  role: varchar("role", { length: 50 }).notNull().default("Bayi"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  image: text("image"),
  email_token: varchar("email_token", { length: 255 }),
  remember_token: varchar("remember_token", { length: 255 }),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
  deleted_at: timestamp("deleted_at"),
  language_preference: varchar("language_preference", { length: 5 }).default("tr"),
});

export const bayiler = mysqlTable("bayiler", {
  id: int("id").primaryKey().autoincrement(),
  ad: varchar("ad", { length: 255 }).notNull(),
  firma: int("firma"),
  aktif: int("aktif").notNull().default(1),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
  deleted_at: timestamp("deleted_at"),
  adres: text("adres"),
  bayi_oran: decimal("bayi_oran", { precision: 10, scale: 0 }),
  telefon: varchar("telefon", { length: 15 }),
  email: varchar("email", { length: 100 }),
  il: varchar("il", { length: 255 }),
  ilce: varchar("ilce", { length: 255 }),
  bakiye: decimal("bakiye", { precision: 10, scale: 2 }).default("0.00"),
  vergi_dairesi: varchar("vergi_dairesi", { length: 100 }),
  vergi_no: varchar("vergi_no", { length: 20 }),
  komisyon_tutar: decimal("komisyon_tutar", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
});

export const roles = mysqlTable("roles", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description").default(sql`NULL`),
  permissions: text("permissions").notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
  deleted_at: timestamp("deleted_at").default(sql`NULL`),
});

export const permissionSchema = z.object({
  panel: z.object({
    view: z.boolean(),
  }),
  companies: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  dealers: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  users: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  programUsers: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
  balance: z.object({
    view: z.boolean(),
    load: z.boolean(),
  }),
  tests: z.object({
    view: z.boolean(),
    create: z.boolean(),
    vinView: z.boolean(),
    vinQuery: z.boolean(),
  }),
  reports: z.object({
    view: z.boolean(),
  }),
  roles: z.object({
    view: z.boolean(),
    create: z.boolean(),
    edit: z.boolean(),
    delete: z.boolean(),
  }),
});

export const roleSchema = createInsertSchema(roles).extend({
  permissions: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      return permissionSchema.parse(parsed);
    } catch {
      throw new Error("Invalid permissions format");
    }
  }),
});

export const selectRoleSchema = createSelectSchema(roles).extend({
  permissions: z.string().transform((str) => {
    try {
      const parsed = JSON.parse(str);
      return permissionSchema.parse(parsed);
    } catch {
      throw new Error("Invalid permissions format");
    }
  }),
});

export type InsertRole = typeof roles.$inferInsert;
export type SelectRole = typeof roles.$inferSelect;

export const vinreader = mysqlTable("vinreader", {
  id: int("id").primaryKey().autoincrement(),
  plaka: varchar("plaka", { length: 250 }).notNull(),
  sase: varchar("sase", { length: 250 }).notNull(),
  motor: varchar("motor", { length: 250 }).notNull(),
  marka: varchar("marka", { length: 100 }).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  yil: int("yil").notNull(),
  gosterge_km: int("gosterge_km").notNull(),
  paket: varchar("paket", { length: 250 }).notNull(),
  ucret: decimal("ucret", { precision: 10, scale: 2 }).default("0"),
  aciklama: varchar("aciklama", { length: 500 }).notNull(),
  kontrolmod: varchar("kontrolmod", { length: 450 }).notNull(),
  vin1: varchar("vin1", { length: 250 }).notNull(),
  vin2: varchar("vin2", { length: 250 }).notNull(),
  vin3: varchar("vin3", { length: 250 }).notNull(),
  usersid: int("usersid"),
  tarih: timestamp("tarih").default(sql`CURRENT_TIMESTAMP`),
  test_id: int("test_id").notNull(),
});

export const insertVinreaderSchema = createInsertSchema(vinreader);
export const selectVinreaderSchema = createSelectSchema(vinreader);
export type InsertVinreader = typeof vinreader.$inferInsert;
export type SelectVinreader = typeof vinreader.$inferSelect;

export const bayi_bakiye = mysqlTable("bayi_bakiye", {
  id: int("id").primaryKey().autoincrement(),
  bayi_id: int("bayi_id")
    .notNull()
    .references(() => bayiler.id),
  bakiye: decimal("bakiye", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
  ),
});

export const bakiye_komisyonlar = mysqlTable("bakiye_komisyonlar", {
  id: int("id").primaryKey().autoincrement(),
  test_id: int("test_id").notNull(),
  firma_id: int("firma_id").notNull(),
  bayi_id: int("bayi_id").notNull(),
  bayi_oran: decimal("bayi_oran", { precision: 10, scale: 2 }).notNull(),
  ucret: decimal("ucret", { precision: 10, scale: 2 }).notNull(),
  komisyon_tutar: decimal("komisyon_tutar", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  test_komisyon_tutar: decimal("test_komisyon_tutar", {
    precision: 10,
    scale: 2,
  })
    .notNull()
    .default("0.00"),
  bakiye: decimal("bakiye", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
  deleted_at: timestamp("deleted_at"),
});

export const cihaz_satislari = mysqlTable("cihaz_satislari", {
  id: int("id").primaryKey().autoincrement(),
  firma_id: int("firma_id")
    .notNull()
    .references(() => companies.id),
  bayi_id: int("bayi_id")
    .notNull()
    .references(() => bayiler.id),
  toplam_tutar: decimal("toplam_tutar", { precision: 10, scale: 2 }).notNull(),
  odenen_tutar: decimal("odenen_tutar", { precision: 10, scale: 2 }).notNull(),
  kalan_tutar: decimal("kalan_tutar", { precision: 10, scale: 2 }).notNull(),
  teslim_durumu: varchar("teslim_durumu", { length: 50 }).notNull(),
  aciklama: text("aciklama"),
  odeme_tarihi: timestamp("odeme_tarihi"),
  kalan_odeme_tarihi: timestamp("kalan_odeme_tarihi"),
  prim_yuzdesi: decimal("prim_yuzdesi", { precision: 5, scale: 2 }).notNull(),
  prim_tutari: decimal("prim_tutari", { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
  deleted_at: timestamp("deleted_at"),
});

export const bakiyeIslemleriRelations = relations(
  bakiye_islemleri,
  ({ one }) => ({
    bayi: one(bayiler, {
      fields: [bakiye_islemleri.bayi_id],
      references: [bayiler.id],
    }),
  }),
);

export const bakiyeKomisyonlarRelations = relations(
  bakiye_komisyonlar,
  ({ one }) => ({
    test: one(testler, {
      fields: [bakiye_komisyonlar.test_id],
      references: [testler.id],
    }),
    firma: one(companies, {
      fields: [bakiye_komisyonlar.firma_id],
      references: [companies.id],
    }),
    bayi: one(bayiler, {
      fields: [bakiye_komisyonlar.bayi_id],
      references: [bayiler.id],
    }),
  }),
);

export const insertBayiBakiyeSchema = createInsertSchema(bayi_bakiye);
export const selectBayiBakiyeSchema = createSelectSchema(bayi_bakiye);
export type InsertBayiBakiye = typeof bayi_bakiye.$inferInsert;
export type SelectBayiBakiye = typeof bayi_bakiye.$inferSelect;

export const insertBakiyeKomisyonSchema =
  createInsertSchema(bakiye_komisyonlar);
export const selectBakiyeKomisyonSchema =
  createSelectSchema(bakiye_komisyonlar);
export type InsertBakiyeKomisyon = typeof bakiye_komisyonlar.$inferInsert;
export type SelectBakiyeKomisyon = typeof bakiye_komisyonlar.$inferSelect;

export const insertBakiyeIslemSchema = createInsertSchema(bakiye_islemleri);
export const selectBakiyeIslemSchema = createSelectSchema(bakiye_islemleri);
export type InsertBakiyeIslem = typeof bakiye_islemleri.$inferInsert;
export type SelectBakiyeIslem = typeof bakiye_islemleri.$inferSelect;

export const panelUsersRelations = relations(panel_users, ({ one }) => ({
  firma: one(companies, {
    fields: [panel_users.firma_id],
    references: [companies.id],
  }),
  bayi: one(bayiler, {
    fields: [panel_users.bayi_id],
    references: [bayiler.id],
  }),
}));

export const usersRelations = relations(users, ({ one }) => ({
  firma: one(companies, {
    fields: [users.firma_id],
    references: [companies.id],
  }),
}));

export const bayilerRelations = relations(bayiler, ({ one }) => ({
  firma_relation: one(companies, {
    fields: [bayiler.firma],
    references: [companies.id],
  }),
}));

export const bayiBakiyeRelations = relations(bayi_bakiye, ({ one }) => ({
  bayi: one(bayiler, {
    fields: [bayi_bakiye.bayi_id],
    references: [bayiler.id],
  }),
}));

export const cihazSatislariRelations = relations(cihaz_satislari, ({ one }) => ({
  firma: one(companies, {
    fields: [cihaz_satislari.firma_id],
    references: [companies.id],
  }),
  bayi: one(bayiler, {
    fields: [cihaz_satislari.bayi_id],
    references: [bayiler.id],
  }),
}));

export const insertCihazSatisiSchema = createInsertSchema(cihaz_satislari);
export const selectCihazSatisiSchema = createSelectSchema(cihaz_satislari);
export type InsertCihazSatisi = typeof cihaz_satislari.$inferInsert;
export type SelectCihazSatisi = typeof cihaz_satislari.$inferSelect;


export const online_cihaz_satislari = mysqlTable("online_cihaz_satislari", {
  id: int("id").primaryKey().autoincrement(),
  siparis_no: varchar("siparis_no", { length: 50 }).notNull().unique(),
  cihaz_satis_id: int("cihaz_satis_id"),
  musteri_adi: varchar("musteri_adi", { length: 100 }).notNull(),
  musteri_soyadi: varchar("musteri_soyadi", { length: 100 }).notNull(),
  tc_no: varchar("tc_no", { length: 11 }),
  email: varchar("email", { length: 100 }).notNull(),
  telefon: varchar("telefon", { length: 20 }).notNull(),
  adres: text("adres").notNull(),
  il: varchar("il", { length: 50 }).notNull(),
  ilce: varchar("ilce", { length: 50 }).notNull(),
  fatura_tipi: varchar("fatura_tipi", { length: 20 }).notNull().default("Bireysel"),
  vergi_dairesi: varchar("vergi_dairesi", { length: 100 }),
  vergi_no: varchar("vergi_no", { length: 20 }),
  tutar: decimal("tutar", { precision: 10, scale: 2 }).notNull(),
  odeme_durumu: varchar("odeme_durumu", { length: 20 }).notNull().default("Beklemede"),
  kargo_durumu: varchar("kargo_durumu", { length: 20 }).notNull().default("Hazirlaniyor"),
  kargo_firmasi: varchar("kargo_firmasi", { length: 50 }),
  kargo_takip_no: varchar("kargo_takip_no", { length: 50 }),
  iyzico_payment_id: varchar("iyzico_payment_id", { length: 100 }),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  deleted_at: timestamp("deleted_at"),
});

export const onlineCihazSatislariRelations = relations(online_cihaz_satislari, ({ one }) => ({
  cihaz_satis: one(cihaz_satislari, {
    fields: [online_cihaz_satislari.cihaz_satis_id],
    references: [cihaz_satislari.id],
  }),
}));

export const insertOnlineCihazSatisiSchema = createInsertSchema(online_cihaz_satislari);
export const selectOnlineCihazSatisiSchema = createSelectSchema(online_cihaz_satislari);
export type InsertOnlineCihazSatisi = typeof online_cihaz_satislari.$inferInsert;
export type SelectOnlineCihazSatisi = typeof online_cihaz_satislari.$inferSelect;

export const bakiye_hareketleri = mysqlTable("bakiye_hareketleri", {
  id: int("id").primaryKey().autoincrement(),
  bayi_id: int("bayi_id").notNull(),
  tutar: decimal("tutar", { precision: 10, scale: 2 }).notNull(),
  bakiye_oncesi: decimal("bakiye_oncesi", { precision: 10, scale: 2 }).notNull().default("0.00"),
  bakiye_sonrasi: decimal("bakiye_sonrasi", { precision: 10, scale: 2 }).notNull().default("0.00"),
  islem_tipi: varchar("islem_tipi", { length: 10 }).notNull(),
  durum: varchar("durum", { length: 20 }).notNull(),
  iyzico_payment_id: varchar("iyzico_payment_id", { length: 100 }),
  referans_kodu: varchar("referans_kodu", { length: 100 }),
  basket_id: varchar("basket_id", { length: 100 }),
  kart_no: varchar("kart_no", { length: 20 }),
  taksit_sayisi: int("taksit_sayisi"),
  aciklama: text("aciklama"),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

export const bakiyeHareketleriRelations = relations(bakiye_hareketleri, ({ one }) => ({
  bayi: one(bayiler, {
    fields: [bakiye_hareketleri.bayi_id],
    references: [bayiler.id],
  }),
}));

// Ülkeler tablosu
export const ulkeler = mysqlTable("ulkeler", {
  id: int("id").primaryKey().autoincrement(),
  ulke_adi: varchar("ulke_adi", { length: 150 }).notNull(),
  ulke_kodu: varchar("ulke_kodu", { length: 3 }).unique(),
  telefon_kodu: varchar("telefon_kodu", { length: 10 }),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
});

// İller tablosu
export const iller = mysqlTable("iller", {
  id: int("id").primaryKey().autoincrement(),
  il: varchar("il", { length: 100 }).notNull(),
  ulke_id: int("ulke_id").notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  deleted_at: timestamp("deleted_at"),
});

// İlçeler tablosu
export const ilceler = mysqlTable("ilceler", {
  id: int("id").primaryKey().autoincrement(),
  ilce: varchar("ilce", { length: 100 }).notNull(),
  il_id: int("il_id").notNull(),
  created_at: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updated_at: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  deleted_at: timestamp("deleted_at"),
});

// Relations
export const illerRelations = relations(iller, ({ one, many }) => ({
  ulke: one(ulkeler, {
    fields: [iller.ulke_id],
    references: [ulkeler.id],
  }),
  ilceler: many(ilceler),
}));

export const ilcelerRelations = relations(ilceler, ({ one }) => ({
  il: one(iller, {
    fields: [ilceler.il_id],
    references: [iller.id],
  }),
}));

export const ulkelerRelations = relations(ulkeler, ({ many }) => ({
  iller: many(iller),
}));

export const insertBakiyeHareketleriSchema = createInsertSchema(bakiye_hareketleri);
export const selectBakiyeHareketleriSchema = createSelectSchema(bakiye_hareketleri);
export type InsertBakiyeHareketleri = typeof bakiye_hareketleri.$inferInsert;
export type SelectBakiyeHareketleri = typeof bakiye_hareketleri.$inferSelect;