// ===== IndexedDB-based Photo Storage for Lean Bulk Tracker =====
// 写真データ（base64 data URL）をIndexedDBに保存・取得するモジュール
// localStorageの5MB制限を回避し、大容量写真を安全に永続化する

const DB_NAME = 'lbt_photo_db';
const DB_VERSION = 1;
const STORE_NAME = 'body_photos';

// ===== DB初期化 =====
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // keyPath: 'date' (YYYY-MM-DD) で一意管理
        db.createObjectStore(STORE_NAME, { keyPath: 'date' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ===== 写真を保存 =====
export async function savePhoto(date: string, photoDataUrl: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ date, photo: photoDataUrl });

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);

    tx.oncomplete = () => db.close();
  });
}

// ===== 特定日の写真を取得 =====
export async function getPhoto(date: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(date);

    request.onsuccess = (event) => {
      const result = (event.target as IDBRequest).result as { date: string; photo: string } | undefined;
      resolve(result?.photo ?? null);
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);

    tx.oncomplete = () => db.close();
  });
}

// ===== 全写真を取得（日付昇順） =====
export async function getAllPhotos(): Promise<{ date: string; photo: string }[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const results = (event.target as IDBRequest).result as { date: string; photo: string }[];
      // 日付昇順でソート
      results.sort((a, b) => a.date.localeCompare(b.date));
      resolve(results);
    };
    request.onerror = (event) => reject((event.target as IDBRequest).error);

    tx.oncomplete = () => db.close();
  });
}

// ===== 特定日の写真を削除 =====
export async function deletePhoto(date: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(date);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject((event.target as IDBRequest).error);

    tx.oncomplete = () => db.close();
  });
}

// ===== 写真の枚数を取得 =====
export async function getPhotoCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = (event) => reject((event.target as IDBRequest).error);

    tx.oncomplete = () => db.close();
  });
}

// ===== IndexedDBの推定使用量を取得 =====
export async function getStorageEstimate(): Promise<{ usage: number; quota: number; usagePercent: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const usagePercent = quota > 0 ? Math.round((usage / quota) * 100) : 0;
    return { usage, quota, usagePercent };
  }
  // StorageManager非対応ブラウザ向けフォールバック
  return { usage: 0, quota: 0, usagePercent: 0 };
}

// ===== ストレージ永続化をリクエスト =====
// ブラウザがストレージを自動的にクリアしないよう永続化を要求する
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

// ===== 全写真をエクスポート用に取得（Blob形式） =====
// JSON内にbase64写真を含めた完全バックアップ用
export async function exportAllPhotosForBackup(): Promise<{ date: string; photo: string }[]> {
  return getAllPhotos();
}

// ===== バックアップから写真をインポート =====
export async function importPhotosFromBackup(photos: { date: string; photo: string }[]): Promise<number> {
  let imported = 0;
  for (const p of photos) {
    if (p.date && p.photo) {
      await savePhoto(p.date, p.photo);
      imported++;
    }
  }
  return imported;
}

// ===== データ整合性チェック =====
// localStorageのbodyLogsとIndexedDBの写真データの整合性を検証する
export async function checkDataIntegrity(): Promise<{
  bodyLogDates: number;
  photoDates: number;
  orphanedPhotos: string[];
  status: 'ok' | 'warning';
  message: string;
}> {
  const photos = await getAllPhotos();
  const photoDates = new Set(photos.map(p => p.date));

  let bodyLogDates = 0;
  try {
    const raw = localStorage.getItem('lbt_body_logs');
    if (raw) {
      const logs = JSON.parse(raw) as Record<string, { date: string }>;
      bodyLogDates = Object.keys(logs).length;
    }
  } catch { /* ignore */ }

  // 写真はあるがbodyLogが無い日付（孤立写真）
  const orphanedPhotos: string[] = [];
  const rawLogs = localStorage.getItem('lbt_body_logs');
  const logDates = rawLogs ? new Set(Object.keys(JSON.parse(rawLogs))) : new Set<string>();
  for (const d of photoDates) {
    if (!logDates.has(d)) {
      orphanedPhotos.push(d);
    }
  }

  const status = orphanedPhotos.length > 0 ? 'warning' : 'ok';
  const message = status === 'ok'
    ? `正常: ${photoDates.size}枚の写真、${bodyLogDates}件のボディログ`
    : `注意: ${orphanedPhotos.length}枚の写真にボディログがありません`;

  return { bodyLogDates, photoDates: photoDates.size, orphanedPhotos, status, message };
}

// ===== localStorageの既存写真データをIndexedDBに移行 =====
// 初回起動時に一度だけ実行し、既存データを失わないようにする
export async function migratePhotosFromLocalStorage(): Promise<void> {
  const MIGRATION_KEY = 'lbt_photo_migration_done';
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return;

  try {
    const raw = localStorage.getItem('lbt_body_logs');
    if (!raw) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return;
    }

    const logs = JSON.parse(raw) as Record<string, { date: string; weight: number | null; photo: string | null }>;
    const entries = Object.values(logs).filter((l) => l.photo);

    for (const log of entries) {
      if (log.photo) {
        await savePhoto(log.date, log.photo);
      }
    }

    // localStorageのphotoフィールドをクリアしてサイズを解放
    const cleaned: Record<string, { date: string; weight: number | null; photo: null }> = {};
    for (const [key, log] of Object.entries(logs)) {
      cleaned[key] = { ...log, photo: null };
    }
    localStorage.setItem('lbt_body_logs', JSON.stringify(cleaned));

    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`[PhotoDB] ${entries.length}件の写真をIndexedDBに移行しました`);
  } catch (e) {
    console.error('[PhotoDB] 移行中にエラーが発生しました:', e);
    // 移行失敗してもアプリは動作させる（次回起動時に再試行）
  }
}
