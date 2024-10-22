"use client";

import React from "react";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@nextui-org/react";
import { formatDate } from "@/helpers/date";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

type Trade = {
  id: string;
  userEmail: string;
  date: Timestamp;
  time: string;
  status: string;
  tradingPair: string;
  amount: number;
  iconUrl: string;
};

type HistoryProps = {
  loading: boolean;
  trades: Trade[];
};

export default function History({ loading, trades }: HistoryProps) {
  if (loading) {
    return (
      <div className="flex justify-center">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (trades.length === 0) {
    return <p className="text-gray">You haven&apos;t made any trades yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-light min-w-full">
        <thead>
          <tr className="text-gray-400 text-xs sm:text-sm border-b border-dashed border-gray">
            <th className="text-left p-2">Date</th>
            <th className="text-left p-2">Status</th>
            <th className="text-left p-2">Pair</th>
            <th className="text-right p-2">Profit</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-gray">
              <td className="p-2">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <div>
                    <div className="text-sm">
                      {formatDate(trade.date)}
                    </div>
                    <div className="text-gray-400 text-xs">{trade.time}</div>
                  </div>
                </div>
              </td>
              <td className="px-2">
                {trade.status === "Pending" ? (
                  <div className="flex items-center text-orange-500 text-sm">
                    <Clock size={16} className="mr-1" />
                    Pending
                  </div>
                ) : (
                  <div className="flex items-center text-green-500 text-sm">
                    <CheckCircle size={16} className="mr-1" />
                    Done
                  </div>
                )}
              </td>
              <td className="p-2">
                <div className="flex items-center">
                  {trade.iconUrl && (
                    <Image
                      width={16}
                      height={16}
                      src={trade.iconUrl}
                      alt={`${trade.tradingPair} icon`}
                      className="w-4 h-4 mr-1"
                    />
                  )}
                  <span className="text-sm">{trade.tradingPair}</span>
                </div>
              </td>
              <td className="text-right py-2">
                <div className="text-sm">{trade.amount} USDT</div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
