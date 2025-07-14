
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req) {
  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, label: true }
  });
  return NextResponse.json(planteles);
}
