"use client";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { monthlyData, loanTypeData, bankDisbursementData } from "@/lib/data";

function formatLakh(value: number) {
  return `₹${(value / 100000).toFixed(1)}L`;
}

interface ChartProps {
  data?: any[];
}

export function MonthlyApplicationsChart({ data }: ChartProps) {
  const chartData = data || monthlyData;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Monthly Applications & Disbursals</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="applications" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 4 }} name="Applications" />
          <Line type="monotone" dataKey="disbursed" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} name="Disbursed" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LoanTypeChart({ data }: ChartProps) {
  const chartData = data || loanTypeData;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Loan Type Distribution</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry: any, index: number) => (
              <Cell key={index} fill={entry.color || ["#3B82F6", "#6366F1", "#22C55E", "#F59E0B", "#06B6D4"][index % 5]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BankDisbursementChart({ data }: ChartProps) {
  const chartData = data || bankDisbursementData;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Bank-wise Disbursement</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={32}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="bank" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatLakh} tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v) => formatLakh(Number(v))}
            contentStyle={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="amount" name="Disbursed" radius={[6, 6, 0, 0]}>
            {chartData.map((_: any, i: number) => (
              <Cell key={i} fill={["#3B82F6", "#6366F1", "#22C55E", "#F59E0B", "#06B6D4"][i % 5]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
