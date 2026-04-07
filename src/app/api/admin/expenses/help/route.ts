import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";

const HELP_FILENAME = "EXPENSES_MODULE.md";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const filePath = join(process.cwd(), "src", "lib", "expenses", HELP_FILENAME);
    const markdown = await readFile(filePath, "utf8");
    return NextResponse.json({ ok: true, markdown, title: "Gastos compartidos — documentación" });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo cargar la documentación." }, { status: 500 });
  }
}
