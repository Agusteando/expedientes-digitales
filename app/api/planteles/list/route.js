
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Allow any authenticated user, or public
export async function GET(req) {
  const planteles = await prisma.plantel.findMany({
    orderBy: { name: "asc" }
  });
  return NextResponse.json(planteles);
}
