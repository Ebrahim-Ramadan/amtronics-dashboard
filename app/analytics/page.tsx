"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
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
  // "July",
  // "August",
  // "September",
  // "October",
  // "November",
  // "December",
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


  const years = Array.from({ length: 1 }, (_, i) => getCurrentYear() - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (year) params.append("year", String(year));
        if (month) params.append("month", String(month));
        if (day) params.append("day", String(day));
        const res = await fetch(`/api/analytics/orders?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const data = await res.json();
        setAnalytics(data.analytics || []);
        setMostSoldProduct(data.mostSoldProduct || null);
        setLeastSoldProduct(data.leastSoldProduct || null);

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
  }, [year, month, day]);

  // Prepare chart data
  let chartData: ChartData<"bar"> = { labels: [], datasets: [] };
  let chartTitle = "Order Analytics";

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
      chartTitle = `Orders in ${MONTHS[Number(month) - 1]} ${year}`;
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
      chartTitle = `Orders in ${year}`;
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
      chartTitle = `Orders on ${MONTHS[Number(month) - 1]} ${day}, ${year}`;
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
        <Card>
          <CardHeader>
            <CardTitle>Filter Orders by Date</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-4 items-center">
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
          </CardContent>
        </Card>



        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{chartTitle}</CardTitle>
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
        
   <div className="flex flex-col md:flex-row gap-4 items-start w-fit">
 {/* Most Sold Product Card */}
        {mostSoldProduct && (
          <Card className="max-w-md mx-auto border-blue-600 border-2">
            <CardHeader>
              <CardTitle>Most Sold Product</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <img
                src={mostSoldProduct.image.split(",")[0]}
                alt={mostSoldProduct.en_name}
                className="w-20 h-20 object-cover rounded"
              />
              <div>
                <h2 className="text-lg font-semibold">{mostSoldProduct.en_name}</h2>
                <p className="text-sm text-gray-600">Price: KD {mostSoldProduct.price.toFixed(2)}</p>
                <p className="text-sm text-gray-600">
                  Sold Quantity: {mostSoldProduct.sold_quantity}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
          {leastSoldProduct && (
  <Card className="max-w-md mx-auto border-red-600 border-2">
    <CardHeader>
      <CardTitle>Least Sold Product</CardTitle>
    </CardHeader>
    <CardContent className="flex items-center gap-4">
      <img
        src={leastSoldProduct.image.split(",")[0]}
        alt={leastSoldProduct.en_name}
        className="w-20 h-20 object-cover rounded"
      />
      <div>
        <h2 className="text-lg font-semibold">{leastSoldProduct.en_name}</h2>
        <p className="text-sm text-gray-600">Price: KD {leastSoldProduct.price.toFixed(2)}</p>
        <p className="text-sm text-gray-600">
          Sold Quantity: {leastSoldProduct.sold_quantity}
        </p>
      </div>
    </CardContent>
  </Card>
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