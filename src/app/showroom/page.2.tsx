"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type GiftLog = {
  aft: number;
  avatar_id: number;
  avatar_url: string;
  created_at: number;
  gift_id: number;
  image: string;
  image2: string;
  name: string;
  num: number;
  ua: number;
  user_id: number;
};

type ShowroomData = {
  status: any;
  comments: any[];
  gifts: any[];
  giftLogs: GiftLog[];
  ts: number;
};

// Suspense wrapper
function ShowroomPageInner() {
  const searchParams = useSearchParams();
  const room_id = searchParams.get("room_id");
  const [data, setData] = useState<ShowroomData | null>(null);

  const comments = data?.comments ?? [];

  /** ギフトログ統合処理 */
  const normalizeGiftLogs = (giftLogs: GiftLog[]) => {
    const map = new Map<string, GiftLog>();

    giftLogs.forEach((log) => {
      const key = `${log.user_id}_${log.gift_id}`;

      if (!map.has(key)) {
        map.set(key, { ...log });
      } else {
        const existing = map.get(key)!;
        existing.num += log.num;
        if (log.created_at > existing.created_at) {
          existing.created_at = log.created_at;
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => b.created_at - a.created_at
    );
  };

  const getGiftSG = (gift_id: number) => {
    const gift = data?.gifts.find((g) => g.gift_id === gift_id);
    return gift ? gift.point : 0;
  };

  useEffect(() => {
    if (!room_id) return;

    const sse = new EventSource(`/api/ws?room_id=${room_id}`);
    sse.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      setData({
        ...payload,
        giftLogs: normalizeGiftLogs(payload.giftLogs),
      });
    };
    return () => sse.close();
  }, [room_id]);

  if (!room_id) return <div>room_id が指定されていません</div>;
  if (!data) return <div>読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex flex-col">

      {/* ヘッダー */}
      <header className="bg-white shadow p-4 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold">Showroom Viewer</h1>
        <span className="text-sm text-gray-600">Room ID: {room_id}</span>
      </header>

      {/* メインレイアウト */}
      <main className="flex-1 p-4 grid grid-cols-2 gap-4">

        {/* コメント一覧 */}
        <section className="bg-white rounded-xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3">コメント一覧</h2>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {comments.map((c, i) => (
              <div
                key={i}
                className="flex items-start p-2 bg-gray-50 rounded-lg shadow-sm"
              >
                <img
                  src={c.avatar_url}
                  className="w-10 h-10 rounded-full mr-3"
                  alt=""
                />

                <div className="flex flex-col">
                  <span className="font-bold text-sm mb-2">
                    {c.user_name || c.name}
                  </span>
                  <span className="text-sm">{c.comment}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ギフト一覧 */}
        <section className="bg-white rounded-xl shadow p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-3">ギフト履歴</h2>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {data.giftLogs.length === 0 ? (
              <div className="text-gray-500">まだギフトはありません</div>
            ) : (
              data.giftLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center bg-gray-50 rounded-lg p-2 shadow-sm"
                >
                  <img
                    src={log.avatar_url}
                    className="w-10 h-10 rounded-full mr-3"
                  />

                  <div className="flex-1">
                    <div className="font-semibold">{log.name}</div>

                    <div className="flex items-center gap-2 text-sm mt-1">
                      <img
                        src={log.image}
                        className="w-8 h-8 rounded"
                        alt=""
                      />
                      <span>
                        × {log.num}（{getGiftSG(log.gift_id) * log.num} SG）
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ShowroomPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ShowroomPageInner />
    </Suspense>
  );
}
