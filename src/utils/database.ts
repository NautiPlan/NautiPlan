import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function loadDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:nautiplan.db");

    const tables = await db.select<{ name: string }[]>("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('Plans', 'Tasks')");

    if (tables.length === 0) {
      await db.execute(`
    CREATE TABLE Plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      startDate TEXT NOT NULL,
      dueDate TEXT,
      priority INTEGER NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);

      await db.execute(`
    CREATE TABLE Tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT FALSE,
      planId TEXT NOT NULL
    )
  `);

      console.log("数据库初始化完成");
    }

    console.log("数据库加载成功");
  }

  return db;
}
