'use client';

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

export function RegistrationChart({ chartData }: {   data: Array<{ date: string; registrations: number }> }) {
    return (
        <ResponsiveContainer width="100%" height={350}>
            <RechartsBarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                />
                <Legend />
                <Bar dataKey="registrations" fill="var(--color-registrations)" radius={8} />
            </RechartsBarChart>
        </ResponsiveContainer>
    );
}
