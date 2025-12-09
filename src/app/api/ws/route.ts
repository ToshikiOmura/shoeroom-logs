import { NextRequest } from "next/server";

// type gift_logs = {
//   normal: Array<{
//     user_id: number;
//     user_name: string;
//     avatar_url: string;
//     gift_id: number;
//     image: string;
//     num: number;
//     created_at: number;
//     name: string;
//   }>;
// };

// type comment_logs = {
//   comment_log: Array<{
//     ua: number;
//     avatar_id: number;
//     aft: number;
//     avatar_url: string;
//     name: string;
//     created_at: number;
//     comment: string;
//     user_id: number;
//   }>;
// };

export const runtime = "nodejs";
export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("room_id");

  if (!roomId) {
    return new Response("room_id is required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {

      async function fetchData() {
        try {
          const [statusRes, commentRes, giftListRes, giftLogRes] = await Promise.all([
            fetch(`https://www.showroom-live.com/api/live/room_status?room_id=${roomId}`),
            fetch(`https://www.showroom-live.com/api/live/comment_log?room_id=${roomId}`),
            fetch(`https://www.showroom-live.com/api/live/gift_list?room_id=${roomId}`),
            fetch(`https://www.showroom-live.com/api/live/gift_log?room_id=${roomId}`)
          ]);

          const statusJson = await statusRes.json();
          const commentsJson = await commentRes.json();
          const giftsListJson = await giftListRes.json();
          const giftLogJson = await giftLogRes.json();
          // console.log("### commentsJson:", commentsJson.comment_log);
          // console.log("### commentsJson key:", Object.keys(commentsJson));
          // console.log("### giftLogJson:", giftLogJson.gift_log);
          // console.log("### giftLogJson key:", Object.keys(giftLogJson));
          // [ 'gift_log' ]

          //---------------------------------------
          // コメント正規化
          //---------------------------------------
          const comments = Array.isArray(commentsJson.comment_log)
            ? commentsJson.comment_log
            : [];
          // console.log("### comments:", comments);

          //---------------------------------------
          // ギフト正規化：gift_list が本体
          //---------------------------------------
          const gifts = Array.isArray(giftsListJson?.normal)
            ? giftsListJson.normal
            : [];
          // console.log("### gifts:", gifts);

          // 🔥 ギフト投げログ（gift_log）
          const giftLogs = Array.isArray(giftLogJson.gift_log) ? giftLogJson.gift_log : [];
          // console.log("### giftLogs:", giftLogs);

          //---------------------------------------
          // 送信データまとめ
          //---------------------------------------
          const data = {
            status: statusJson,
            comments,
            gifts,
            giftLogs,
            ts: Date.now(),
          };

          // SSE 送信
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );

        } catch (err: any) {
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify(err)}\n\n`)
          );
        }
      }

      // 初回
      await fetchData();

      // 3秒ごと
      const interval = setInterval(fetchData, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}


// import { NextRequest } from "next/server";

// export const runtime = "nodejs";

// export async function GET(req: NextRequest) {
//   const roomId = req.nextUrl.searchParams.get("room_id");

//   if (!roomId) {
//     return new Response("room_id is required", { status: 400 });
//   }

//   const encoder = new TextEncoder();
//   const stream = new ReadableStream({
//     async start(controller) {
//       async function fetchData() {
//         try {
//           const [statusRes, commentRes, giftRes] = await Promise.all([
//             fetch(`https://www.showroom-live.com/api/live/room_status?room_id=${roomId}`),
//             fetch(`https://www.showroom-live.com/api/live/comment_log?room_id=${roomId}`),
//             fetch(`https://www.showroom-live.com/api/live/gift_list?room_id=${roomId}`)
//           ]);

//           const statusJson = await statusRes.json();
//           const commentsJson = await commentRes.json();
//           const giftsListJson = await giftRes.json();
//           console.log("### giftsListJson:", giftsListJson);

//           // -----------------------------
//           // 🔽 正規化: コメントは必ず配列にする
//           // -----------------------------
//           const comments = Array.isArray(commentsJson.comment_log)
//             ? commentsJson.comment_log
//             : [];

//           // -----------------------------
//           // 🔽 正規化: ギフトも必ず配列にする
//           // -----------------------------
//           const gifts =
//             Array.isArray(giftsListJson) ? giftsListJson :
//             Array.isArray(giftsListJson.gift_list) ? giftsListJson.gift_list :
//             [];

//           const data = {
//             status: statusJson,
//             comments,
//             gifts,
//             giftsRaw: giftsListJson,   // ←追加！
//             ts: Date.now(),
//           };

//           controller.enqueue(
//             encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
//           );
//         } catch (err: any) {
//           controller.enqueue(
//             encoder.encode(`event: error\ndata: ${JSON.stringify(err)}\n\n`)
//           );
//         }
//       }

//       // 初回
//       await fetchData();

//       // 3秒ごとに更新
//       const interval = setInterval(fetchData, 3000);

//       // 接続終了処理
//       req.signal.addEventListener("abort", () => {
//         clearInterval(interval);
//         controller.close();
//       });
//     },
//   });

//   return new Response(stream, {
//     headers: {
//       "Content-Type": "text/event-stream",
//       "Cache-Control": "no-cache",
//       Connection: "keep-alive",
//     },
//   });
// }
