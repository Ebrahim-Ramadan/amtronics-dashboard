"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, FileText } from "lucide-react"; // Added FileText icon
import dynamic from "next/dynamic";
import type { ChartData, ChartOptions } from "chart.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import LazyLoad from "@/lib/LazyLoad";
import * as XLSX from "xlsx";
// Import jsPDF with dynamic import to avoid SSR issues
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Bar = dynamic(() => import("react-chartjs-2").then((mod) => mod.Bar), { ssr: false });
const Topleftmenu = dynamic(() => import('@/components/top-left-menu'))


const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getCurrentYear() {
  return new Date().getFullYear();
}

export default function AnalyticsPage() {
  const [year, setYear] = useState(getCurrentYear());
  const [month, setMonth] = useState<number | "">("");
  const [day, setDay] = useState<number | "">("");
  const [analytics, setAnalytics] = useState<any[]>([]);

  const [engineerBundle, setEngineerBundle] = useState<any[]>([])
  const [engineerName, setEngineerName] = useState<string>("")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostSoldProduct, setMostSoldProduct] = useState<any | null>(null);
  const [leastSoldProduct, setLeastSoldProduct] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>(""); // Add payment method filter
  const [status, setStatus] = useState<string>(""); // Add status filter
  const [orders, setOrders] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState(0);


  const years = Array.from({ length: 1 }, (_, i) => getCurrentYear() - i);
function getDaysInMonth(year: number, month: number) {
  if (!year || !month) return [];
  return Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1);
}

// In your component:
const days = useMemo(() => {
  if (year && month) return getDaysInMonth(year, Number(month));
  return [];
}, [year, month]);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (year) params.append("year", String(year));
        if (month) params.append("month", String(month));
        if (day) params.append("day", String(day));
        if (paymentMethod) params.append("paymentMethod", paymentMethod);
        if (status) params.append("status", status);
        const res = await fetch(`/api/analytics/orders?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        
        setAnalytics(data.analytics || []);
        setMostSoldProduct(data.mostSoldProduct || null);
        setLeastSoldProduct(data.leastSoldProduct || null);

        // Add: setOrders from API
        setOrders(data.orders || []);

        // Calculate total value like completed-orders-view
        let value = 0;
        if (data.orders && Array.isArray(data.orders)) {
          value = data.orders.reduce((sum: number, order: any) =>
            sum + order.items.reduce((itemSum: number, item: any) => {
              if (item.type === "project-bundle" && item.products) {
                return itemSum + item.products.reduce((prodSum: number, prod: any) => prodSum + prod.price * item.quantity, 0);
              } else {
                return itemSum + (item.product?.price || 0) * item.quantity;
              }
            }, 0), 0);
        }
        setTotalValue(value);

        // Engineer private bundle (if logged as engineer/sub)
        try {
          const engRes = await fetch(`/api/analytics/engineer`)
          if (engRes.ok) {
            const engData = await engRes.json()
            setEngineerBundle(engData.bundle || [])
            setEngineerName(engData.engineer || "")
          }
        } catch {}
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [year, month, day, paymentMethod, status]); // Add status to deps

  // Memoize mostSoldProduct and leastSoldProduct
  const memoMostSoldProduct = useMemo(() => mostSoldProduct, [mostSoldProduct]);
  const memoLeastSoldProduct = useMemo(() => leastSoldProduct, [leastSoldProduct]);

  // Prepare chart data
  let chartData: ChartData<"bar"> = { labels: [], datasets: [] };
  let chartTitle = "Order Analytics (KD)";
  // Calculate total number of orders for the selected period
  const totalOrders = analytics.reduce((sum, a) => sum + (a.count || 0), 0);
  if (analytics.length > 0) {
    if (year && month && !day) {
      // Daily orders for a specific month
      chartData = {
        labels: Array.from({ length: 31 }, (_, i) => String(i + 1)),
        datasets: [
          {
            label: "Orders per Day",
            data: analytics.map((a) => a.count),
            backgroundColor: "#3b82f6",
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        ],
      };
      chartTitle = `${totalOrders} Orders in ${MONTHS[Number(month) - 1]} ${year} (KD ${totalValue.toFixed(2)})`;
    } else if (year && !month && !day) {
      // Monthly orders for a specific year
      chartData = {
        labels: MONTHS,
        datasets: [
          {
            label: "Orders per Month",
            data: analytics.map((a) => a.count),
            backgroundColor: "#3b82f6",
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        ],
      };
      chartTitle = `${totalOrders} Orders in ${year} (KD ${totalValue.toFixed(2)})`;
    } else if (year && month && day) {
      // Single day
      chartData = {
        labels: [String(day)],
        datasets: [
          {
            label: "Orders on Day",
            data: analytics.map((a) => a.count),
            backgroundColor: "#3b82f6",
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        ],
      };
      chartTitle = `Orders on ${MONTHS[Number(month) - 1]} ${day}, ${year} (KD ${totalValue.toFixed(2)})`;
    }
  }

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: "top" },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.raw}`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: month && !day ? "Day" : "Month" } },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        title: { display: true, text: "Number of Orders" },
      },
    },
  };

const [exporting, setExporting] = useState(false);


  function handleExportExcel() {
     setExporting(true);
    // Prepare data for Excel
    const data = orders.map((order: any) => {
 // Calculate total for each order based on product price and quantity
      const total = order.items.reduce((sum: number, item: any) => {
        if (item.type === "project-bundle" && item.products) {
          return (
            sum +
            item.products.reduce(
              (prodSum: number, prod: any) =>
                prodSum + (prod.price || 0) * item.quantity,
              0
            )
          );
        } else {
          return (
            sum +
            ((item.product?.price || 0) * item.quantity)
          );
        }
      }, 0);
      return {
        OrderID: order._id,
        Date: order.createdAt,
        Status: order.status,
        PaymentMethod: order.paymentMethod,
        Customer: order.customerInfo?.name || "",
        Email: order.customerInfo?.email || "",
        Phone: order.customerInfo?.phone || "",
        Address: `${order.customerInfo?.country || ""}, ${order.customerInfo?.city || ""}, ${order.customerInfo?.area || ""}`,
        Items: order.items
          .map((item: any) =>
            item.type === "project-bundle" && item.products
              ? item.products
                  .map(
                    (prod: any) =>
                      `${prod.en_name} (x${item.quantity}) KD${prod.price}`
                  )
                  .join("; ")
              : `${item.product?.en_name || ""} (x${item.quantity}) KD${item.product?.price || 0}`
          )
          .join(" | "),
        Total: total,
        NetProfit: total, // Use calculated total as net profit
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders-analytics.xlsx");
    setExporting(false);
  }

  function handleExportPDF() {
    setExporting(true);
    const doc = new jsPDF();

    orders.forEach((order: any, idx: number) => {
      if (idx > 0) doc.addPage();

      // --- HEADER ROW: Logo left, logo right (without background modification) ---
      doc.addImage('/amtronics-logo.jpg', 'JPEG', 14, 10, 28, 28);
      doc.addImage('/invoice-amtronics-logo-at-the-end.jpg', 'JPEG', 170, 10, 28, 28);

      // --- Rest of the header ---
      doc.setFontSize(16);
      doc.text(`Order Report`, 14, 45);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 52);

      // Order meta
      doc.setFontSize(12);
      doc.text(`Order ID: ${order._id}`, 14, 62);
      doc.setFontSize(10);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 68);
      doc.text(`Status: ${order.status}`, 14, 74);
      doc.text(`Payment: ${order.paymentMethod}`, 14, 80);

      // Customer info
      const custY = 88;
      doc.setFontSize(11);
      doc.text('Customer:', 14, custY);
      const customerLines = [
        `Name: ${order.customerInfo?.name || "N/A"}`,
        `Email: ${order.customerInfo?.email || "N/A"}`,
        `Phone: ${order.customerInfo?.phone || "N/A"}`,
        `Address: ${[order.customerInfo?.country, order.customerInfo?.city, order.customerInfo?.area].filter(Boolean).join(', ') || 'N/A'}`
      ];
      customerLines.forEach((line, i) => doc.text(line, 20, custY + 6 + i * 6));

      // Items table start position
      const tableStartY = custY + 6 + customerLines.length * 6 + 6;

      // Build rows: expand project-bundle items to show nested products
      const tableRows: any[] = [];
      order.items.forEach((item: any) => {
        if (item.type === "project-bundle" && Array.isArray(item.products)) {
          // Bundle header row
          tableRows.push([
            `Bundle: ${item.product?.en_name || "Project Bundle"}`,
            String(item.quantity),
            '-',
            '-'
          ]);
          // Each product inside bundle as its own row
          item.products.forEach((p: any) => {
            const unit = Number(p.price || 0);
            const total = unit * (item.quantity || 1);
            tableRows.push([
              `  - ${p.en_name || p.title || 'Product'}`,
              String(item.quantity),
              unit.toFixed(3),
              total.toFixed(3),
            ]);
          });
        } else {
          const product = item.product || {};
          const unit = Number(product.price || 0);
          const qty = Number(item.quantity || 0);
          const total = unit * qty;
          tableRows.push([
            product.en_name || product.title || "Product",
            String(qty),
            unit.toFixed(3),
            total.toFixed(3),
          ]);
        }
      });

      // AutoTable for items
      autoTable(doc, {
        startY: tableStartY,
        head: [['Item', 'Qty', 'Unit (KD)', 'Total (KD)']],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14, right: 14 }
      });

      // Calculate totals and place after table
      const finalY = (doc as any).lastAutoTable?.finalY || tableStartY + (tableRows.length + 2) * 6;
      let orderTotal = 0;
      order.items.forEach((item: any) => {
        if (item.type === "project-bundle" && Array.isArray(item.products)) {
          const q = Number(item.quantity || 0);
          orderTotal += item.products.reduce((s: number, p: any) => s + (Number(p.price || 0) * q), 0);
        } else {
          orderTotal += (Number(item.product?.price || 0) * Number(item.quantity || 0));
        }
      });

      doc.setFontSize(11);
      doc.text(`Order Total: KD ${orderTotal.toFixed(3)}`, 14, finalY + 12);

      // Optional notes or extra info
      if (order.notes) {
        doc.setFontSize(10);
        const notesY = finalY + 20;
        doc.text('Notes:', 14, notesY);
        doc.setFontSize(9);
        // wrap long notes
        const splitNotes = doc.splitTextToSize(order.notes, 180);
        doc.text(splitNotes, 14, notesY + 6);
      }

      // After adding all content, check if we need a new page for signatures
      let contentEndY = finalY + (order.notes ? 40 : 20); // Adjust based on whether notes exist
      const pageHeight = doc.internal.pageSize.getHeight();
      const boxHeight = 30;
      const margin = 20;
      const neededSpace = boxHeight + margin * 2;

      // If there isn't enough space, add a new page
      if (contentEndY + neededSpace > pageHeight - margin) {
        doc.addPage();
        // Reset contentEndY since we're on a new page
        contentEndY = margin;
      }

  // Inside handleExportPDF function, replace the signature box section:

// --- Signature boxes at bottom of page ---
const pageWidth = doc.internal.pageSize.getWidth();
const signatureConfig = {
  boxWidth: 35,   // Even smaller width
  boxHeight: 15,  // Same height as before
  margin: 10,     // Same margin
  bottomMargin: 15 // Distance from bottom of page
};

// Always position signatures at the bottom of the page
const yPos = pageHeight - signatureConfig.bottomMargin - signatureConfig.boxHeight;

// Company Signature (far left)
doc.setDrawColor(100);
doc.setLineWidth(0.5);
doc.rect(signatureConfig.margin, yPos, signatureConfig.boxWidth, signatureConfig.boxHeight);
doc.setFontSize(8);
doc.text("Signature", signatureConfig.margin + signatureConfig.boxWidth/2, yPos + signatureConfig.boxHeight/2 - 2, { align: "center" });
doc.text("&stamp", signatureConfig.margin + signatureConfig.boxWidth/2, yPos + signatureConfig.boxHeight/2 + 4, { align: "center" });

// Customer Signature (far right)
doc.rect(pageWidth - signatureConfig.margin - signatureConfig.boxWidth, yPos, signatureConfig.boxWidth, signatureConfig.boxHeight);
doc.text("Customer", pageWidth - signatureConfig.margin - signatureConfig.boxWidth/2, yPos + signatureConfig.boxHeight/2 - 2, { align: "center" });
doc.text("Signature", pageWidth - signatureConfig.margin - signatureConfig.boxWidth/2, yPos + signatureConfig.boxHeight/2 + 4, { align: "center" });
});

    doc.save("orders-detailed.pdf");
     setExporting(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-4">
            <Topleftmenu />
            <h1 className="text-xl md:text-3xl font-bold text-gray-900">Analytics </h1>
          </div>
         
        </div>

       

        {/* Controls */}
        <Card className="">
          <CardHeader>
            <CardTitle>Filter Orders by Date</CardTitle>
          </CardHeader>
          <div className="p-4 md:p-6 md:flex md:flex-row grid grid-cols-2  gap-4 md:gap-6 items-center">
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                className="border rounded px-2 py-1"
                value={year}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  setMonth("");
                  setDay("");
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                className="border rounded px-2 py-1"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value ? Number(e.target.value) : "");
                  setDay("");
                }}
              >
                <option value="">All</option>
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Day</label>
            <select
  className="border rounded px-2 py-1"
  value={day}
  onChange={(e) => setDay(e.target.value ? Number(e.target.value) : "")}
  disabled={!month}
>
  <option value="">All</option>
  {days.map((d) => (
    <option key={d} value={d}>
      {d}
    </option>
  ))}
</select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select
                className="border rounded px-2 py-1"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                className="border rounded px-2 py-1"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">All</option>
                <option value="knet">In shop (KNET)</option>
                <option value="cod">Cash on Delivery (COD)</option>
              </select>
            </div>
            
          </div>
        </Card>


        {/* Chart */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center flex-col md:flex-row gap-2">{chartTitle}  
              <div className="flex gap-2">
<button
  className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition text-sm flex flex-row gap-2 items-center disabled:opacity-50"
  onClick={handleExportExcel}
  disabled={orders.length === 0 || exporting }
  title="Export filtered orders to Excel"
>
  {exporting ? (
    <Loader2 size={14} className="animate-spin" />
  ) : (
    <Upload size={14} />
  )}
  {exporting  ? 'Exporting...' : 'Export Excel'}
</button>

<button
  className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition text-sm flex flex-row gap-2 items-center disabled:opacity-50"
  onClick={handleExportPDF}
  disabled={orders.length === 0 || exporting}
  title="Export filtered orders to PDF"
>
  {exporting ? (
    <Loader2 size={14} className="animate-spin" />
  ) : (
    <FileText size={14} />
  )}
  {exporting ? 'Exporting...' : 'Export PDF'}
</button>
            </div>
          </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">{error}</div>
            ) : analytics.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                No data found for selected period.
              </div>
            ) : (
              <div className="w-full max-w-4xl mx-auto">
                <Bar data={chartData} options={chartOptions} />
              </div>
            )}
          </CardContent>
        </Card>
        
         <LazyLoad>
          <div className="flex flex-col md:flex-row gap-4 items-start w-full">
            {memoMostSoldProduct && (
              <a
                href={`https://amtronics.co/products/${memoMostSoldProduct._id}`}
                target="_blank"
                className="border-blue-600 border-2 flex flex-col gap-2 p-4 rounded-lg hover:shadow-lg transition-shadow w-full md:w-auto"
              >
                <p>Most Sold Product</p>
                <div className="flex items-center gap-4">
                  <img
                    src={memoMostSoldProduct.image.split(",")[0]}
                    alt={memoMostSoldProduct.en_name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div>
                    <h2 className="text-lg font-semibold">{memoMostSoldProduct.en_name}</h2>
                    <p className="text-sm text-gray-600">Price: KD {memoMostSoldProduct.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      Sold Quantity: {memoMostSoldProduct.sold_quantity}
                    </p>
                  </div>
                </div>
              </a>
            )}
            {memoLeastSoldProduct && (
              <a
                href={`https://amtronics.co/products/${memoLeastSoldProduct._id}`}
                target="_blank"
                className="border-red-600 border-2 flex flex-col gap-2 p-4 rounded-lg hover:shadow-lg transition-shadow w-full md:w-auto"
              >
                <p>Least Sold Product</p>
                <div className="flex items-center gap-4">
                  <img
                    src={memoLeastSoldProduct.image.split(",")[0]}
                    alt={memoLeastSoldProduct.en_name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div>
                    <h2 className="text-lg font-semibold">{memoLeastSoldProduct.en_name}</h2>
                    <p className="text-sm text-gray-600">Price: KD {memoLeastSoldProduct.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      Sold Quantity: {memoLeastSoldProduct.sold_quantity}
                    </p>
                  </div>
                </div>
              </a>
            )}
          </div>
        </LazyLoad>
       

        {engineerBundle.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Private Bundle {engineerName ? `(Engineer: ${engineerName})` : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {engineerBundle.map((p) => (
                  <div key={p._id} className="border rounded p-3">
                    <div className="font-semibold text-sm mb-1">{p.en_name}</div>
                    {p.image && (
                      <img src={(p.image || '').split(',')[0]} alt={p.en_name} className="w-full h-28 object-cover rounded" />
                    )}
                    <div className="text-xs text-gray-600 mt-1">SKU: {p.sku}</div>
                    <div className="text-xs text-gray-600">Price: KD {Number(p.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}