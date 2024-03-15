import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { upgradeWebSocket } from "hono/cloudflare-workers";

type Bindings = {
  DB: D1Database;
};
type Env = {
  Bindings: Bindings;
};

const app = new Hono<Env>();

app.use(cors({ origin: "*" }));

const POLL_INTERVAL = 500;

app.get(
  "/ws/request-room",
  upgradeWebSocket((c: Context<Env, any, {}>) => {
    let roomId: number | null = null;
    let closed = false;
    let wsSend: ((data: string) => void) | null = null;
    const interval = setInterval(async () => {
      if (closed) {
        clearInterval(interval);
        return;
      }
      const { success, results } = await c.env.DB.prepare(
        `DELETE FROM messages WHERE room_id = ? AND host_to_guest = 0 RETURNING *`,
      )
        .bind(roomId)
        .all();
      if (!success || wsSend === null || results.length === 0) {
        return;
      }
      for (const result of results) {
        wsSend(result.content as string);
      }
    }, POLL_INTERVAL);
    return {
      async onMessage(evt, ws) {
        try {
          const data = JSON.parse(evt.data);
          console.log(data);
          switch (data.method) {
            case "initialize":
              let result = await c.env.DB.prepare(
                `SELECT id FROM rooms WHERE active = 0 ORDER BY RANDOM() LIMIT 1`,
              ).first();
              if (!result) {
                throw new Error("No available rooms");
              }
              roomId = result.id as number;
              const { success, error } = await c.env.DB.prepare(
                `UPDATE rooms SET active = 1 WHERE id = ?`,
              )
                .bind(roomId)
                .run();
              if (!success) {
                throw error;
              }
              wsSend = (data) => ws.send(data);
              ws.send(JSON.stringify({ method: "reply:initialize", roomId }));
              break;
            case "notify":
            case "rpc":
              if (roomId === null) {
                throw new Error("Room not initialized");
              }
              await c.env.DB.prepare(
                `INSERT INTO messages (room_id, content, host_to_guest) VALUES (?, ?, 1)`,
              )
                .bind(roomId, evt.data)
                .run();
              break;
            default:
              throw new Error(`Unknown method ${data.method}`);
          }
        } catch (e) {
          console.error(e);
          ws.send(
            JSON.stringify({
              method: "error",
              message: e instanceof Error ? e.message : "Unknown error",
            }),
          );
        }
      },
      async onClose(evt, ws) {
        ws.close();
        closed = true;
        if (roomId !== null) {
          await c.env.DB.prepare(`UPDATE rooms SET active = 0 WHERE id = ?`)
            .bind(roomId)
            .run();
          await c.env.DB.prepare(`DELETE FROM messages WHERE room_id = ?`)
            .bind(roomId)
            .run();
        }
      },
      async onError(evt, ws) {
        ws.close();
        console.error(evt);
      },
    };
  }),
);

app.get("/ws/room/:id", upgradeWebSocket((c: Context<Env, any, {}>) => {
  const roomId = parseInt(c.req.param('id'));
  let initialized = false;
  let closed = false;
  let wsSend: ((data: string) => void) | null = null;
  const interval = setInterval(async () => {
    if (closed) {
      clearInterval(interval);
      return;
    }
    const { success, results } = await c.env.DB.prepare(
      `DELETE FROM messages WHERE room_id = ? AND host_to_guest = 1 RETURNING *`,
    )
      .bind(roomId)
      .all();
    if (!success || wsSend === null || results.length === 0) {
      return;
    }
    for (const result of results) {
      wsSend(result.content as string);
    }
  }, POLL_INTERVAL);
  return {
    async onMessage(evt, ws) {
      try {
        const data = JSON.parse(evt.data);
        console.log(data);
        switch (data.method) {
          case "initialize":
            if (isNaN(roomId)) {
              ws.send(JSON.stringify({ method: "error", message: "Invalid room ID" }));
              ws.close();
              break;
            }
            const result = await c.env.DB.prepare(`SELECT active FROM rooms WHERE id = ?`).bind(roomId).first();
            if (!(result?.active)) {
              ws.send(JSON.stringify({ method: "error", message: "Room not found" }));
              ws.close();
              break;
            }
            wsSend = (data) => ws.send(data);
            ws.send(JSON.stringify({ method: "reply:initialize" }));
            initialized = true;
            break;
          case "reply:rpc":
          case "giveUp":
            if (!initialized) {
              ws.send(JSON.stringify({ method: "error", message: "Room not initialized" }));
              break;
            }
            await c.env.DB.prepare(
              `INSERT INTO messages (room_id, content, host_to_guest) VALUES (?, ?, 0)`,
            )
              .bind(roomId, evt.data)
              .run();
            break;
          default:
            throw new Error(`Unknown method ${data.method}`);
        }
      } catch (e) {
        console.error(e);
        ws.send(
          JSON.stringify({
            method: "error",
            message: e instanceof Error ? e.message : "Unknown error",
          }),
        );
      }
    },
    async onClose(evt, ws) {
      closed = true;
      if (roomId !== null) {
        await c.env.DB.prepare(`UPDATE rooms SET active = 0 WHERE id = ?`)
          .bind(roomId)
          .run();
        await c.env.DB.prepare(`DELETE FROM messages WHERE room_id = ?`)
          .bind(roomId)
          .run();
      }
      ws.close();
    },
    async onError(evt, ws) {
      console.error(evt);
      ws.close();
    },
  }
}));

app.notFound((c) => c.text("Not Found", 404));

app.onError((err, c) => {
  return c.text(`Internal Server Error: ${err.message}`, 500);
});

export default app;