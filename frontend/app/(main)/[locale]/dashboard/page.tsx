"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import useUserData from "@/hooks/useUserData";
import { get } from "@/lib/fetcher";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  SVGProps,
  useMemo,
} from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import dayjs from "dayjs";
import CalendarHeatmap, {
  ReactCalendarHeatmapValue,
} from "react-calendar-heatmap";
import { getRecentYearRange } from "@/lib/date-format";

export type DashboardData = {
  views: number;
  posts: number;
  likes: number | null;
  comments: number;
  bookmarks: number;
  categories: {
    id: number;
    title: string;
    slug: string;
    post_count: number;
  }[];
  monthly_posts: {
    month: string; // ISO 格式的日期时间字符串
    count: number;
  }[];
  popular_posts: {
    id: number;
    slug: string;
    date: string; // ISO 格式的日期时间字符串
    like_count: number;
    image: string;
  }[];
  category_likes: {
    title: string;
    like_count: number;
  }[];
  daily_posts: {
    day: string; // ISO 格式的日期时间字符串
    count: number;
  }[];
};

export default function Dashboard() {
  const t = useTranslations();
  const userData = useUserData();
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      get<DashboardData>(`/author/dashboard/stats/${userData?.user_id}/`),
  });

  const totalCategories = useMemo(() => {
    return data?.categories.length || 0;
  }, [data?.categories]);

  const chartConfig = {
    count: {
      label: "Posts",
      color: "var(--color-primary-700)",
    },
  } satisfies ChartConfig;

  const renderRectClass = (
    value: ReactCalendarHeatmapValue<string> | undefined,
  ) => {
    if (!value) {
      return "color-empty";
    }
    switch (value.count) {
      case 0:
        return "color-empty";
      case 1 <= value.count && value.count <= 3:
        return "color-scale-low";
      case 4 <= value.count && value.count <= 7:
        return "color-scale-mid";
      case 8 <= value.count && value.count <= 10:
        return "color-scale-high";
      default:
        return "color-scale-highest";
    }
  };

  const renderRectElement = (
    element: SVGProps<SVGRectElement>,
    value: ReactCalendarHeatmapValue<string> | undefined,
    index: number,
  ): ReactNode => {
    if (isValidElement(element) && element.type === "rect") {
      return cloneElement(element as ReactElement<SVGProps<SVGRectElement>>, {
        rx: 3,
        ry: 3,
        key: value?.date || index,
      });
    }
    return element as ReactElement<SVGProps<SVGRectElement>>;
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-6 gap-4 auto-rows-auto mt-8">
        <div className="col-span-4 row-span-1 py-4">
          <CalendarHeatmap
            startDate={dayjs().subtract(365, "day").format("YYYY/MM/DD")}
            endDate={dayjs().format("YYYY/MM/DD")}
            values={
              data?.daily_posts?.map((item) => ({
                date: dayjs(item.day).format("YYYY/MM/DD"),
                count: item.count,
              })) || []
            }
            classForValue={renderRectClass}
            transformDayElement={renderRectElement}
            titleForValue={(value) =>
              value ? `${value.count} posts on ${value.date}` : ""
            }
          />
        </div>
        <Card className="col-span-4 row-span-1">
          <CardHeader className="items-center pb-0">
            <CardTitle>Recent 1 year Posts</CardTitle>
            <CardDescription>{getRecentYearRange()}</CardDescription>
          </CardHeader>
          <ChartContainer config={chartConfig} className="max-h-[260px] h-auto">
            <BarChart accessibilityLayer data={data?.monthly_posts}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => dayjs(value).format("YYYY/M")}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-primary-200)" radius={4} />
            </BarChart>
          </ChartContainer>
        </Card>
        <Card className="col-span-2 row-span-1">
          <CardHeader className="items-center pb-0">
            <CardTitle>All Categories</CardTitle>
            <CardDescription>{getRecentYearRange()}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[260px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={data?.categories}
                  dataKey="post_count"
                  nameKey="title"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-3xl font-bold"
                            >
                              {totalCategories.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              Categories
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
