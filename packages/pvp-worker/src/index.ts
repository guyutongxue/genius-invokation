import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", async (c) => {
  return c.json({ message: "Hello, World!" });
});

app.delete("/api/outdated", async (c) => {
  const { success, error } = await c.env.DB.prepare(
    `DELETE FROM notify WHERE created_at < date('now', '-3 days')`,
  ).run();
  if (success) {
    return c.json({ success: true });
  } else {
    return c.json({ success: false, error }, 500);
  }
});

app.post("/api/notify/new", async (c) => {
  const { success, results, error } = await c.env.DB.prepare(
    `INSERT INTO notify (msg) VALUES (?) RETURNING id`,
  )
    .bind(await c.req.text())
    .all();
  if (success) {
    return c.json({ success: true, id: results[0].id });
  } else {
    return c.json({ success: false, error }, 500);
  }
});

app.delete("/api/notify/:id", async (c) => {
  const { success, error } = await c.env.DB.prepare(
    `DELETE FROM notify WHERE id = ?`,
  )
    .bind(c.req.param().id)
    .run();
  if (success) {
    return c.json({ success: true });
  } else {
    return c.json({ success: false, error }, 500);
  }
});

app.post("/api/rpc/new", async (c) => {
  const { success, results, error } = await c.env.DB.prepare(
    `INSERT INTO rpc (request) VALUES (?) RETURNING id`,
  )
    .bind(await c.req.text())
    .all();
  if (success) {
    return c.json({ success: true, id: results[0].id });
  } else {
    return c.json({ success: false, error }, 500);
  }
});

app.get("/api/rpc/:id/request")

app.notFound((c) => c.text("Not Found", 404));

app.onError((err, c) => {
  return c.text(`Internal Server Error: ${err.message}`, 500);
});

export default app;
