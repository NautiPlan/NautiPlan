import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function loadDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:nautiplan.db");
    console.log("数据库加载成功");

    // 添加这行来查看数据库路径
    console.log("数据库路径:", await db.path);
  }
  return db;
}
