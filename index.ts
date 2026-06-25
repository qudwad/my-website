import { randomUUID } from "crypto";
import { existsSync, readFileSync, unlinkSync } from "fs";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const JOBS = new Map<string, { command: string; outfile: string }>();

Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/run") {
      const body = await req.json();
      if (body.password !== "ohwowjack") {
        return Response.json({ error: "wrong password" }, { status: 403 });
      }
      const command = String(body.command ?? "").trim();
      if (!command) {
        return Response.json({ error: "command is required" }, { status: 400 });
      }

      const id = randomUUID();
      const outfile = `/tmp/job-${id}.out`;
      const escaped = command.replace(/'/g, "'\\''");

      const proc = Bun.spawn(
        ["bash", "-c", `exec >"${outfile}" 2>&1; ${escaped}`],
        { detached: true, stdio: ["ignore", "ignore", "ignore"] }
      );
      proc.unref();
      const pid = proc.pid;

      JOBS.set(id, { command, outfile });
      return Response.json({ id, pid, command });
    }

    const jobMatch = url.pathname.match(/^\/api\/job\/(.+)$/);
    if (req.method === "GET" && jobMatch) {
      const id = jobMatch[1];
      const job = JOBS.get(id);
      if (!job) return Response.json({ error: "job not found" }, { status: 404 });
      const output = existsSync(job.outfile) ? readFileSync(job.outfile, "utf-8") : "";
      return Response.json({ id, command: job.command, output });
    }

    if (req.method === "GET" && url.pathname === "/api/jobs") {
      const jobs = Array.from(JOBS.entries()).map(([id, j]) => ({
        id, command: j.command, exists: existsSync(j.outfile),
      }));
      return Response.json({ jobs });
    }

    if (req.method === "DELETE" && jobMatch) {
      const id = jobMatch[1];
      const job = JOBS.get(id);
      if (!job) return Response.json({ error: "job not found" }, { status: 404 });
      JOBS.delete(id);
      try { unlinkSync(job.outfile); } catch {}
      return Response.json({ ok: true });
    }

    return Response.json({ error: "not found" }, { status: 404 });
  },
});

console.log(`bgsh listening on http://localhost:${PORT}`);
