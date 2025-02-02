"use client";
import React, { useState, useEffect } from "react";
import { fetchUserViews, fetchTopUserBlogs } from "@/app/api/blogs_services/route";
import { useSession } from "next-auth/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ViewData {
  day?: string;
  month?: string;
  year?: string;
  total_views: number;
}

interface BlogData {
  title: string;
  views_by_period: { group: string; total_views: number }[];
}

interface TimeRange {
  label: string;
  value: { group_by: "daily" | "monthly" | "yearly"; period: number };
}

const timeRanges: TimeRange[] = [
  { label: "7d", value: { group_by: "daily", period: 7 } },
  { label: "15d", value: { group_by: "daily", period: 15 } },
  { label: "1m", value: { group_by: "monthly", period: 1 } },
  { label: "6m", value: { group_by: "monthly", period: 6 } },
  { label: "1y", value: { group_by: "yearly", period: 1 } },
  { label: "5y", value: { group_by: "yearly", period: 5 } },
  { label: "Max", value: { group_by: "yearly", period: 10 } },
];

const Dashboard: React.FC = () => {
  const [userViews, setUserViews] = useState<ViewData[]>([]);
  const [topBlogs, setTopBlogs] = useState<BlogData[]>([]);
  const [loadingViews, setLoadingViews] = useState(true);
  const [loadingTopBlogs, setLoadingTopBlogs] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRanges[0].value);
  const [selectedTopBlogsRange, setSelectedTopBlogsRange] = useState(timeRanges[0].value);
  const [graphTypeViews, setGraphTypeViews] = useState<"line" | "bar" | "area">("line");
  const [graphTypeBlogs, setGraphTypeBlogs] = useState<"line" | "bar" | "area">("line");
  const [percentageChange, setPercentageChange] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  useEffect(() => {
    if (!token) return;

    const fetchViews = async () => {
      setLoadingViews(true);
      try {
        const result = await fetchUserViews({ token, queryParams: selectedTimeRange });
        console.log(result)
        if (result?.views) {
          setUserViews(result.views);
          setPercentageChange(result?.percentage_change || 0);
          setTotalViews(result?.total_views_current || 0);
          console.log(result?.total_views_current);
        }
      } catch (error) {
        console.error("Error fetching user views:", error);
      } finally {
        setLoadingViews(false);
      }
    };

    fetchViews();
  }, [token, selectedTimeRange]);

  useEffect(() => {
    if (!token) return;

    const fetchTopBlogs = async () => {
      setLoadingTopBlogs(true);
      try {
        const result = await fetchTopUserBlogs({ token, queryParams: selectedTopBlogsRange });
        if (result?.top_5_blogs) {
          setTopBlogs(result.top_5_blogs);
        }
      } catch (error) {
        console.error("Error fetching top blogs:", error);
      } finally {
        setLoadingTopBlogs(false);
      }
    };

    fetchTopBlogs();
  }, [token, selectedTopBlogsRange]);

  const getXAxisDataKey = () => {
    return selectedTimeRange.group_by === "daily"
      ? "day"
      : selectedTimeRange.group_by === "monthly"
      ? "month"
      : "year";
  };

  const topBlogsData = topBlogs.map((blog) => ({
    title: blog.title,
    views: blog.views_by_period.map((view) => ({
      period: view.group,
      total_views: view.total_views,
    })),
  }));

  const groupedData = topBlogsData.reduce<{ [key: string]: any }>((acc, blog) => {
    blog.views.forEach((view) => {
      if (!acc[view.period]) {
        acc[view.period] = { period: view.period };
      }
      acc[view.period][blog.title] = view.total_views;
    });
    return acc;
  }, {});

  const sortedGroupedData = Object.values(groupedData)
    .map((item) => ({ period: item.period, ...item }))
    .sort((a, b) => new Date(`${a.period} 2024`).getTime() - new Date(`${b.period} 2024`).getTime());
  const lineColors = ["#4f46e5", "#e11d48", "#10b981", "#f59e0b", "#6366f1"];

  return (
    <div className="container mx-auto min-h-screen px-1 pb-6 pt-1 dark:text-white">
      <h1 className="text-lg font-bold mb-8 text-center px-5 py-4  shadow-lg rounded-md dark:bg-gray-900 dark:shadow-gray-700">📊 Dashboard</h1>
      <div className="w-full bg-white shadow-lg rounded-lg py-5 px-4 dark:bg-gray-900 dark:shadow-gray-700 mb-8">
        <h2 className="text-md font-semibold text-center mb-4 dark:text-gray-200">Total Blog Views Analytics</h2>

        <div className="flex justify-between mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Range:</label>
            <select
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-800 dark:text-white rounded"
              onChange={(e) => setSelectedTimeRange(JSON.parse(e.target.value))}
              value={JSON.stringify(selectedTimeRange)}
            >
              {timeRanges.map((range) => (
                <option key={range.label} value={JSON.stringify(range.value)}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Graph Type:</label>
            <select
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-800 dark:text-white rounded"
              onChange={(e) => setGraphTypeViews(e.target.value as "line" | "bar" | "area")}
              value={graphTypeViews}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="area">Area</option>
            </select>
          </div>
        </div>

        <div className="mb-6 text-center">
          {loadingViews ? (
            <div className="animate-pulse w-full h-full flex flex-col items-center justify-center">
              <div className="w-full flex flex-col mx-auto justify-center items-center gap-1 mb-4">
                <div className="w-48 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                <div className="w-40 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              </div>
              <div className="w-full h-100 flex justify-center items-center gap-4">
                <div className="w-4 h-28 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
                <div className="w-11/12 h-72 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
              </div>
              <div className="flex justify-between w-full mt-3 px-16">
                <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
          ) : (
            <>
              {percentageChange !== null && (
                <h3 className="text-sm font-medium">
                  📈 {percentageChange >= 0 ? "Increase" : "Decrease"} in Views:{" "}
                  <span className={percentageChange >= 0 ? "text-green-500" : "text-red-500"}>
                    {percentageChange.toFixed(2)}%
                  </span>
                </h3>
              )}
              {totalViews !== null && (
                <h3 className="text-sm font-medium">
                  📊 Total Views: <span className="text-blue-500">{totalViews}</span>
                </h3>
              )}
            </>
          )}
        </div>

        {loadingViews ? (
          <p className="text-center"></p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            {graphTypeViews === "line" ? (
              <LineChart data={userViews}>
                <XAxis dataKey={getXAxisDataKey()} />
                <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  wrapperStyle={{ backgroundColor: "#333" }}
                  contentStyle={{
                    fontSize: '11px',
                    backgroundColor: '#2D3748',
                    color: '#E2E8F0',
                    borderRadius: '4px',
                    border: '1px solid #4A5568',
                  }}
                  itemStyle={{
                    color: '#E2E8F0',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_views"
                  stroke="#4f46e5"
                  strokeWidth={1}
                  dot={{ r: 2, strokeWidth: 2, fill: "#ffffff" }}
                />
              </LineChart>
            ) : graphTypeViews === "bar" ? (
              <BarChart data={userViews}>
                <XAxis dataKey={getXAxisDataKey()} />
                <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  wrapperStyle={{ backgroundColor: "#333" }}
                  contentStyle={{
                    fontSize: '11px',
                    backgroundColor: '#2D3748',
                    color: '#E2E8F0',
                    borderRadius: '4px',
                    border: '1px solid #4A5568',
                  }}
                  itemStyle={{
                    color: '#E2E8F0',
                  }}
                />
                <Bar dataKey="total_views" fill="#4f46e5" />
              </BarChart>
            ) : (
              <AreaChart data={userViews}>
                <XAxis dataKey={getXAxisDataKey()} />
                <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  wrapperStyle={{ backgroundColor: "#333" }}
                  contentStyle={{
                    fontSize: '11px',
                    backgroundColor: '#2D3748',
                    color: '#E2E8F0',
                    borderRadius: '4px',
                    border: '1px solid #4A5568',
                  }}
                  itemStyle={{
                    color: '#E2E8F0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total_views"
                  stroke="#4f46e5"
                  fillOpacity={0.3}
                  fill="#4f46e5"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      <div className="w-full bg-white shadow-lg rounded-lg py-5 px-4 dark:bg-gray-900 dark:shadow-gray-700">
        <h2 className="text-md font-semibold text-center mb-4 dark:text-gray-200">Top 5 Blogs Views Analytics</h2>

        <div className="flex justify-between mb-6">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Range:</label>
            <select
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-800 dark:text-white rounded"
              onChange={(e) => setSelectedTopBlogsRange(JSON.parse(e.target.value))}
              value={JSON.stringify(selectedTopBlogsRange)}
            >
              {timeRanges.map((range) => (
                <option key={range.label} value={JSON.stringify(range.value)}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Graph Type:</label>
            <select
              className="text-sm ml-2 p-1 bg-gray-200 dark:bg-gray-800 dark:text-white rounded"
              onChange={(e) => setGraphTypeBlogs(e.target.value as "line" | "bar" | "area")}
              value={graphTypeBlogs}
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
              <option value="area">Area</option>
            </select>
          </div>
        </div>

        {loadingTopBlogs ? (
          <div className="animate-pulse w-full h-full flex flex-col items-center justify-center">
          <div className="w-full h-100 flex justify-center items-center gap-4">
            <div className="w-4 h-28 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            <div className="w-11/12 h-72 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          </div>
          <div className="flex justify-between w-full mt-3 px-16">
            <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
            <div className="h-3 w-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="w-full flex flex-col mx-auto justify-center items-center gap-1 m-4">
            <div className="w-10/12 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            <div className="w-8/12 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            <div className="w-10/12 h-4 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
          </div>
        </div>
        ) : (
        <ResponsiveContainer width="100%" height={400}>
        {graphTypeBlogs === "line" ? (
            <LineChart data={sortedGroupedData}>
            <XAxis dataKey="period" />
            <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
            <Tooltip
                wrapperStyle={{ backgroundColor: "#333" }}
                contentStyle={{
                fontSize: '11px',
                backgroundColor: '#2D3748',
                color: '#E2E8F0',
                borderRadius: '4px',
                border: '1px solid #4A5568',
                }}
                itemStyle={{
                color: '#E2E8F0',
                }}
            />
            
            <Legend
                wrapperStyle={{ fontSize: '13px' }}
                formatter={(value) => {
                const blog = topBlogsData.find((blog) => blog.title === value);
                const totalViews = blog?.views.reduce((sum, view) => sum + view.total_views, 0);
                return `${value} (${totalViews})`; 
                }}
            />
            {topBlogsData.map((blog, index) => (
                <Line
                key={index}
                type="monotone"
                dataKey={blog.title}
                stroke={lineColors[index % lineColors.length]}
                strokeWidth={2}
                dot={{ r: 2, strokeWidth: 2, fill: "#ffffff" }}
                />
            ))}
            </LineChart>
        ) : graphTypeBlogs === "bar" ? (
            <BarChart data={sortedGroupedData}>
            <XAxis dataKey="period" />
            <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
            <Tooltip
                wrapperStyle={{ backgroundColor: "#333" }}
                contentStyle={{
                fontSize: '11px',
                backgroundColor: '#2D3748',
                color: '#E2E8F0',
                borderRadius: '4px',
                border: '1px solid #4A5568',
                }}
                itemStyle={{
                color: '#E2E8F0',
                }}
            />
            <Legend
                wrapperStyle={{ fontSize: '13px' }}
                formatter={(value) => {
                const blog = topBlogsData.find((blog) => blog.title === value);
                const totalViews = blog?.views.reduce((sum, view) => sum + view.total_views, 0);
                return `${value} (${totalViews})`;
                }}
            />
            {topBlogsData.map((blog, index) => (
                <Bar
                key={index}
                dataKey={blog.title}
                fill={lineColors[index % lineColors.length]}
                />
            ))}
            </BarChart>
        ) : graphTypeBlogs === "area" ? (
            <AreaChart data={sortedGroupedData}>
            <XAxis dataKey="period" />
            <YAxis label={{ value: "Views", angle: -90, position: "insideLeft" }} />
            <Tooltip
                wrapperStyle={{ backgroundColor: "#333" }}
                contentStyle={{
                backgroundColor: '#2D3748',
                color: '#E2E8F0',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid #4A5568',
                }}
                itemStyle={{
                color: '#E2E8F0',
                }}
            />
            <Legend
                wrapperStyle={{ fontSize: '13px' }}
                formatter={(value) => {
                const blog = topBlogsData.find((blog) => blog.title === value);
                const totalViews = blog?.views.reduce((sum, view) => sum + view.total_views, 0);
                return `${value} (${totalViews})`;
                }}
            />
            {topBlogsData.map((blog, index) => (
                <Area
                key={index}
                type="monotone"
                dataKey={blog.title}
                stroke={lineColors[index % lineColors.length]}
                fill={lineColors[index % lineColors.length]}
                fillOpacity={0.3}
                />
            ))}
            </AreaChart>
        ): <p></p>}
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
