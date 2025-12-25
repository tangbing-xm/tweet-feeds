import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { vendors } from "@/db/schema";

export async function GET() {
  const rows = await db
    .select({
      slug: vendors.slug,
      name_en: vendors.nameEn,
      name_zh: vendors.nameZh,
      sort_order: vendors.sortOrder,
    })
    .from(vendors)
    .orderBy(asc(vendors.sortOrder), asc(vendors.slug));

  return NextResponse.json({ items: rows });
}






