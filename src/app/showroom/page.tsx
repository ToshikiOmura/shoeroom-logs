"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type ShowroomData = {
  status: any;
  comments: any;
  gifts: any;
  giftLogs: any;
  ts: number;
};

export default function Page() {
  const searchParams = useSearchParams();
  const room_id = searchParams.get("room_id");
  const [data, setData] = useState<ShowroomData | null>(null);
  const comments = data?.comments ?? [];

  const [isCommentsOpen, setIsCommentsOpen] = useState(true);
  const [isGiftsOpen, setIsGiftsOpen] = useState(true);

  const normalizeGiftLogs = (giftLogs) => {
    // Map で user_id + gift_id をキーに集約
    const map = new Map();

    giftLogs.forEach(log => {
      const key = `${log.user_id}_${log.gift_id}`;
      if (!map.has(key)) {
        // 初めての組み合わせ → そのまま登録
        map.set(key, { ...log });
      } else {
        // 既存 → num を加算
        const existing = map.get(key);
        existing.num += log.num;

        // created_at が新しい方を採用
        if (log.created_at > existing.created_at) {
          existing.created_at = log.created_at;
        }

        map.set(key, existing);
      }
    });

    // map から配列へ戻す
    const mergedArray = Array.from(map.values());

    // 表示順を created_at 降順にしたい場合
    mergedArray.sort((a, b) => b.created_at - a.created_at);

    return mergedArray;
  }

  useEffect(() => {
    if (!room_id) return;

    const sse = new EventSource(`/api/ws?room_id=${room_id}`);
    sse.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const newData = {
        ...data,
        giftLogs: normalizeGiftLogs(data.giftLogs),
      };

      setData(newData);
    };

    sse.onerror = () => {
      console.error("SSE error");
    };

    return () => {
      sse.close();
    };
  }, [room_id]);

  if (!room_id) return <div>room_id が指定されていません</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4 bg-white text-black">
      <h1 className="text-2xl font-bold">Room ID: {room_id}</h1>
      {/* ログ領域 */}
      <div className="flex gap-4 w-full mt-4">

        {/* --- コメント一覧 --- */}
        <section className="w-2/3">
          <h2 className="text-xl font-semibold mt-6 mb-2">コメント一覧</h2>
          <div className="mt-2 space-y-2">
            {comments.map((c, i: number) => (
              <div
                key={i}
                className="flex items-start space-x-3 p-2 rounded-md bg-gray-100"
              >
                <img
                  src={c.avatar_url}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {c.user_name || c.name}
                  </span>
                  <span className="text-sm">{c.comment}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- ギフトの一覧表示 --- */}
        <section className="w-1/3">
          <h2 className="text-xl font-semibold mt-6 mb-2">ギフト履歴</h2>
          {data.giftLogs?.length === 0 ? (
            <div className="text-gray-500">まだギフトは投げられていません</div>
          ) : (
            <ul className="space-y-3">
              {data.giftLogs.map((log, i: number) => (
                <li key={i} className="flex items-center bg-gray-100 p-2 rounded shadow">
                  <img
                    src={log.avatar_url}
                    alt={log.name}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{log.name}</div>
                    <div className="flex gap-1 text-sm text-gray-700">
                      <img
                        src={log.image}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="mt-5">
                        × {log.num}
                      </div>
                      {/* {log.gift_name} × {log.num} */}
                      {/* （{log.point * log.num} pt） */}
                    </div>
                  </div>
                  {/* 時間（任意） */}
                  {/* <div className="text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </div> */}
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  );
}
