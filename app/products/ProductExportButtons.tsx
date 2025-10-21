"use client";
import { useCallback, useState } from "react";

export function ProductExportButtons() {
  const [loading, setLoading] = useState<"pdf" | "excel" | null>(null);
  const [alert, setAlert] = useState<string | null>(null);

  // Fetch all products for export (no search, no pagination)
  const fetchAllProductsForExport = useCallback(async () => {
    const params = new URLSearchParams({
      limit: "100000",
    });
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/products?${params}`
    );
    if (!response.ok) throw new Error("Failed to fetch products");
    const { products } = await response.json();
    return products;
  }, []);

  // PDF Export Handler (dynamic import)
  const handleExportPDF = useCallback(async () => {
    if (!window.confirm("Must read before! this request is a heavy load on our servers and it can raise the billing cost, so do not frequently do this action, also it might takes a while")) return;
    setLoading("pdf");
    setAlert(null);
    try {
      const products = await fetchAllProductsForExport();
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      const dataToExport = products.map((p: any) => [
        p.id,
        p.sku,
        p.en_name,
        p.price,
        p.quantity_on_hand ?? "-",
        p.sold_quantity,
      ]);
      autoTable(doc, {
        head: [["ID", "SKU", "Name", "Price", "Qty On Hand", "Sold Qty"]],
        body: dataToExport,
      });
      doc.save("products.pdf");
      setAlert("PDF exported successfully!");
    } catch (err: any) {
      setAlert("Failed to export PDF: " + (err.message || err));
    } finally {
      setLoading(null);
    }
  }, [fetchAllProductsForExport]);

  // Excel Export Handler (dynamic import)
  const handleExportExcel = useCallback(async () => {
    if (!window.confirm("Must read before! this request is a heavy load on our servers and it can raise the billing cost, so do not frequently do this action, also it might takes a while")) return;
    setLoading("excel");
    setAlert(null);
    try {
      const products = await fetchAllProductsForExport();
      const XLSX = await import("xlsx");
      const dataToExport = products.map((p: any) => ({
        ID: p.id,
        SKU: p.sku,
        Name: p.en_name,
        Price: p.price,
        "Qty On Hand": p.quantity_on_hand ?? "-",
        "Sold Qty": p.sold_quantity,
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      XLSX.writeFile(workbook, "products.xlsx");
      setAlert("Excel exported successfully!");
    } catch (err: any) {
      setAlert("Failed to export Excel: " + (err.message || err));
    } finally {
      setLoading(null);
    }
  }, [fetchAllProductsForExport]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          className="ml-2 px-2 py-1 border rounded text-sm flex items-center gap-1"
          onClick={handleExportPDF}
          type="button"
          disabled={loading !== null}
        >
          {loading === "pdf" ? "Exporting..." : <><span>📄</span> Export PDF</>}
        </button>
        <button
          className="ml-2 px-2 py-1 border rounded text-sm flex items-center gap-1"
          onClick={handleExportExcel}
          type="button"
          disabled={loading !== null}
        >
          {loading === "excel" ? "Exporting..." : <><span>📥</span> Export Excel</>}
        </button>
      </div>
      {alert && (
        <div
          className={`text-xs mt-1 ${
            alert.startsWith("Failed") ? "text-red-600" : "text-green-600"
          }`}
        >
          {alert}
        </div>
      )}
    </div>
  );
}