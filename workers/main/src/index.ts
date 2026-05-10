/**
 * Workers entrypoint — roda todos os 4 workers num único processo Node.
 *
 * Em prod (Coolify), 1 container = 1 processo. BullMQ workers compartilham
 * bem o event loop (cada um fica esperando jobs em Redis).
 */

import "@nivertotal/worker-scheduler";
import "@nivertotal/worker-generator";
import "@nivertotal/worker-imagery";
import "@nivertotal/worker-publisher";

console.log("✓ Workers started: scheduler · generator · imagery · publisher");

process.on("SIGTERM", () => {
  console.log("[main] SIGTERM recebido, encerrando workers...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[main] SIGINT recebido, encerrando workers...");
  process.exit(0);
});
