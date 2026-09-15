import Database from 'better-sqlite3';
import { afterEach, describe, expect, it } from 'vitest';
import { BUDGET_SCHEMA_VERSION, bootstrapBudgetDatabase, initializeBudgetSchema } from './database';

const databases: Database.Database[] = [];

afterEach(() => {
  for (const db of databases.splice(0)) {
    db.close();
  }
});

describe('budget database bootstrap', () => {
  it('creates the schema and seeds the verified category dictionary', () => {
    const db = new Database(':memory:');
    databases.push(db);

    bootstrapBudgetDatabase(db);

    expect(db.pragma('user_version', { simple: true })).toBe(BUDGET_SCHEMA_VERSION);

    const count = db
      .prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM categories')
      .get();
    expect(count?.count).toBe(30);
    const seeded = db
      .prepare<[], { category_group: string | null; category: string; subcategory: string }>(
        'SELECT category_group, category, subcategory FROM categories ORDER BY category, subcategory',
      )
      .all();
    expect(seeded).toEqual(
      expect.arrayContaining(
        [
          ['Działka', 'Ogród i działka'],
          ['Finanse', 'Inwestycje i akcje'],
          ['Finanse', 'Podatki i ubezpieczenia'],
          ['Finanse', 'Pozostałe'],
          ['Finanse', 'Praca'],
          ['Lucjan', 'Utrzymanie'],
          ['Lucjan', 'Weterynarz'],
          ['Mieszkanie', 'Czynsz i kredyt'],
          ['Mieszkanie', 'Media'],
          ['Mieszkanie', 'Subskrypcje'],
          ['Okolicznościowe', 'Prezenty i okazje'],
          ['Osobiste', 'Zakupy i usługi'],
          ['Rozrywka', 'Hobby i kultura'],
          ['Rozrywka', 'Inne'],
          ['Rozrywka', 'Podróże'],
          ['Rozrywka', 'Subskrypcje'],
          ['Rozwój osobisty', 'Sport i edukacja'],
          ['Samochód', 'Parking'],
          ['Samochód', 'Paliwo'],
          ['Samochód', 'Serwis i opłaty'],
          ['Utrzymanie domu', 'Naprawy'],
          ['Utrzymanie domu', 'Wyposażenie i sprzęt'],
          ['Wyłączone', 'Operacje techniczne'],
          ['Zdrowie', 'Leki'],
          ['Zdrowie', 'Leczenie'],
          ['Życie', 'Dziecko'],
          ['Życie', 'Inne'],
          ['Życie', 'Jedzenie poza domem'],
          ['Życie', 'Transport'],
          ['Życie', 'Żywność'],
        ].map(([category, subcategory]) => ({ category_group: null, category, subcategory })),
      ),
    );
    expect(
      db
        .prepare<[], { count: number }>(
          "SELECT COUNT(*) AS count FROM categories WHERE id IN ('finanse-ubezpieczenia', 'finanse-swiadczenia-zus')",
        )
        .get()?.count,
    ).toBe(0);
  });

  it('is idempotent and enforces foreign keys', () => {
    const db = new Database(':memory:');
    databases.push(db);

    bootstrapBudgetDatabase(db);
    initializeBudgetSchema(db);
    bootstrapBudgetDatabase(db);

    const count = db
      .prepare<[], { count: number }>('SELECT COUNT(*) AS count FROM categories')
      .get();
    expect(count?.count).toBe(30);
    expect(() =>
      db
        .prepare(
          `INSERT INTO bank_transactions (id, account_id, booked_at, amount_cents, description)
          VALUES ('missing-account', 'missing', '2026-01-01', 100, 'test')`,
        )
        .run(),
    ).toThrow('FOREIGN KEY');
  });

  it('rejects deletion of bank transaction source facts', () => {
    const db = new Database(':memory:');
    databases.push(db);
    bootstrapBudgetDatabase(db);
    db.prepare("INSERT INTO accounts (id, name) VALUES ('main', 'Main')").run();
    db.prepare(
      `INSERT INTO bank_transactions (id, account_id, booked_at, amount_cents, description)
       VALUES ('tx-immutable', 'main', '2026-01-01', 100, 'test')`,
    ).run();

    expect(() =>
      db.prepare("DELETE FROM bank_transactions WHERE id = 'tx-immutable'").run(),
    ).toThrow('cannot be deleted');
  });
});
