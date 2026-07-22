import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { UNITS } from "@/lib/units";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Items");
  sheet.columns = [
    { header: "Item", key: "item", width: 32 },
    { header: "Category", key: "category", width: 28 },
    { header: "Unit", key: "unit", width: 12 },
  ];
  sheet.addRow({ item: "Sumac", category: "Dry & Pantry Ingredients", unit: "g" });
  sheet.addRow({ item: "Pomegranate juice (fresh)", category: "Beverages & Mocktail Supplies", unit: "litre" });

  const notesSheet = workbook.addWorksheet("Allowed Units");
  notesSheet.columns = [{ header: "Unit", key: "unit", width: 12 }];
  for (const unit of UNITS) notesSheet.addRow({ unit });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="mishkak-items-template.xlsx"',
    },
  });
}
