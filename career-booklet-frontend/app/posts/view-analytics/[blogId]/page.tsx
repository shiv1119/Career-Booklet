"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { fetchUserViews } from "@/app/api/blogs_services/route";
import { useSession } from "next-auth/react";
import { AnalyticsData } from "@/types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const timeRanges = [
  { label: "7d", value: { group_by: "daily", period: 7 } },
  { label: "15d", value: { group_by: "daily", period: 15 } },
  { label: "1m", value: { group_by: "monthly", period: 1 } },
  { label: "6m", value: { group_by: "monthly", period: 6 } },
  { label: "1y", value: { group_by: "yearly", period: 1 } },
  { label: "5y", value: { group_by: "yearly", period: 5 } },
  { label: "Max", value: { group_by: "yearly", period: 10 } },
];

const ViewAnalytics: React.FC = () => {
  const { blogId } = useParams();
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRanges[0].value); // Default: 7d
  const [percentageChange, setPercentageChange] = useState<number | null>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const queryParams: Record<string, string | number> = { ...selectedTimeRange };

        if (blogId) {
          queryParams.blog_id = Array.isArray(blogId) ? blogId[0] : blogId;
        }

        const result = await fetchUserViews({ token, queryParams });
        console.log("API Response:", result); // Add this log to inspect the response

        if (result && result.views) {
          setData(result.views);
        }

        if (result && result.percentage_change !== undefined) {
          setPercentageChange(result.percentage_change); // Set percentage change from API response
        }

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeRange, blogId, token]);

  const getXAxisDataKey = () => {
    const { group_by } = selectedTimeRange;
    if (group_by === "daily") return "day";
    if (group_by === "monthly") return "month";
    if (group_by === "yearly") return "year";
    return "";
  };

  const formatXAxisTick = (tick: number | string): string => {
    const { group_by } = selectedTimeRange;
    if (group_by === "yearly") {
      return `Year ${tick}`;
    }

    return tick.toString();
  };

  return (
    <div className="container mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">📊 Blog View Analytics</h1>
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((range) => (
            <button
              key={range.label}
              className={`px-3 py-1 border rounded ${
                selectedTimeRange.period === range.value.period &&
                selectedTimeRange.group_by === range.value.group_by
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setSelectedTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>

        <select
          value={chartType}
          onChange={(e) => setChartType(e.target.value as "line" | "bar")}
          className="p-2 border rounded"
        >
          <option value="line">📈 Line Chart</option>
          <option value="bar">📊 Bar Chart</option>
        </select>
      </div>
      <div className="text-center mb-4">
        {percentageChange !== null && (
          <p className={`font-bold ${percentageChange >= 0 ? "text-green-600" : "text-red-600"}`}>
            {percentageChange >= 0 ? "📈" : "📉"}{" "}
            {percentageChange.toFixed(2)}%{" "}
            {percentageChange >= 0 ? "Increase" : "Decrease"} in Views
          </p>
        )}
      </div>

      <div className="w-full h-96 bg-white shadow-xl rounded-lg pb-5 pt-8 pr-3 pl-2">
        {loading ? (
          <p className="text-center text-gray-600">Loading analytics...</p>
        ) : data.length === 0 ? (
          <p className="text-center text-red-500">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={data}>
                <XAxis
                  dataKey={getXAxisDataKey()}
                  tickFormatter={formatXAxisTick}
                  label={{ value: selectedTimeRange.group_by, position: "bottom" }}
                />
                <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="total_views" stroke="#8884d8" />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <XAxis
                  dataKey={getXAxisDataKey()}
                  tickFormatter={formatXAxisTick}
                  label={{ value: selectedTimeRange.group_by, position: "bottom" }}
                />
                <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="total_views" fill="#82ca9d" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ViewAnalytics;
