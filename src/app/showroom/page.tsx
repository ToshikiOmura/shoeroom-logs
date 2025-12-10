"use client";

import { useEffect, useState, useRef, Suspense } from "react";
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

// Suspense wrapper inner component
function ShowroomPageInner() {
  const searchParams = useSearchParams();
  const room_id = searchParams.get("room_id");
  const [data, setData] = useState<ShowroomData | null>(null);
  const comments = data?.comments ?? [];
  const giftLogs = data?.giftLogs ?? [];
  const commentRef = useRef<HTMLDivElement>(null);
  const giftRef = useRef<HTMLDivElement>(null);

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

      {/* --- ヘッダー --- */}
      <header className="bg-blue-200 shadow p-2 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-baseline gap-5">
          <h1 className="text-xl font-bold">SHOWROOM Viewer</h1>
          <p className="text-sm font-bold">Ver.1.1</p>
        </div>
        <span className="text-base text-gray-600">Room ID: {room_id}</span>
      </header>

      {/* --- メインレイアウト --- */}
      <main className="flex-1 p-2 flex gap-2">

        {/* --- コメント --- */}
        <section className="w-3/5 bg-white rounded-xl shadow p-2 flex flex-col h-[calc(100vh-70px)] relative">
          <h2 className="text-base font-semibold mb-2">コメント</h2>

          {/* スクロール領域 */}
          <div
            ref={commentRef}
            className="flex-1 overflow-y-auto pr-1 space-y-2"
          >
            {comments.map((c, i) => (
              <div
                key={i}
                className="flex items-start p-2 bg-gray-200 rounded-lg shadow-sm"
              >
                <img src={c.avatar_url} className="w-8 h-8 rounded-full mr-2" alt="" />
                <div className="flex flex-col">
                  <span className="font-bold text-xs">{c.user_name || c.name}</span>
                  <span className="text-xs">{c.comment}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ▲ コメントボタン */}
          <button
            onClick={() =>
              commentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="
              absolute bottom-3 right-3
              flex items-center justify-center
              w-7 h-7
              rounded-full

              /* ガラス表現 */
              bg-blue-600/70
              backdrop-blur-xl
              shadow-[0_0_20px_rgba(0,0,0,0.20)]
              border border-white/40
              hover:bg-blue-600/60

              /* 光沢 */
              before:absolute before:inset-0
              before:rounded-full
              before:bg-gradient-to-br before:from-white/40 before:to-blue-200/10
              before:pointer-events-none

              /* テキスト */
              text-white font-bold text-sm
              drop-shadow

              /* アニメーション */
              transition-all duration-200
              hover:scale-110 hover:shadow-[0_0_25px_rgba(0,0,0,0.25)]
            "
          >
            ▲
          </button>
        </section>

        {/* --- ギフト--- */}
        <section className="w-2/5 bg-white rounded-xl shadow p-2 flex flex-col h-[calc(100vh-70px)] relative">
          <h2 className="text-base font-semibold mb-2">ギフト</h2>

          <div
            ref={giftRef}
            className="flex-1 overflow-y-auto pr-1 space-y-2"
          >
            {giftLogs.length === 0 ? (
              <div className="text-gray-500">まだギフトはありません</div>
            ) : (
              giftLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center bg-gray-200 rounded-lg p-2 shadow-sm"
                >
                  <img src={log.avatar_url} className="w-8 h-8 rounded-full mr-2" alt="" />
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{log.name}</div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <img src={log.image} className="w-6 h-6 rounded" alt="" />
                      <div>
                        <div>× {log.num}</div>
                        <div>
                          {getGiftSG(log.gift_id)} x {log.num} ={" "}
                          {getGiftSG(log.gift_id) * log.num} SG
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ▲ ギフトボタン */}
          <button
            onClick={() =>
              giftRef.current?.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="
              absolute bottom-3 right-3
              flex items-center justify-center
              w-7 h-7
              rounded-full

              /* ガラス表現 */
              bg-blue-600/70
              backdrop-blur-xl
              shadow-[0_0_20px_rgba(0,0,0,0.20)]
              border border-white/40
              hover:bg-blue-600/60

              /* 光沢 */
              before:absolute before:inset-0
              before:rounded-full
              before:bg-gradient-to-br before:from-white/40 before:to-blue-200/10
              before:pointer-events-none

              /* テキスト */
              text-white font-bold text-sm
              drop-shadow

              /* アニメーション */
              transition-all duration-200
              hover:scale-110 hover:shadow-[0_0_25px_rgba(0,0,0,0.25)]
            "
          >
            ▲
          </button>
        </section>

      </main>
    </div>
  );
}

export default function ShowroomPage() {
  return (
    <Suspense fallback={<div className="p-2">Loading...</div>}>
      <ShowroomPageInner />
    </Suspense>
  );
}
