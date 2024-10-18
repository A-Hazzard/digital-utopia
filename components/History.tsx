import React from "react";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";

const trades = [
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Pending",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Pending",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Done",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Pending",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Done",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Done",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Done",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
  {
    date: "12/12/2023",
    time: "12:47",
    status: "Done",
    pair: "BTC • ETH",
    profit: "0.00210123BTC\n140.63USD",
  },
];

export default function History() {
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
          {trades.map((trade, index) => (
            <tr key={index} className="border-b border-gray">
              <td className="p-2">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2 text-gray-400" />
                  <div>
                    <div className="text-sm">{trade.date}</div>
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
                  <div className="relative w-6 h-6 mr-2">
                    <Image
                      src="/btc.svg"
                      alt="ETH"
                      className="w-5 h-5 rounded-full absolute bottom-0 -right-2"
                      width={20}
                      height={20}
                    />
                    <Image
                      src="/eth.svg"
                      alt="BTC"
                      className="w-5 h-5 rounded-full absolute top-0 left-0"
                      width={20}
                      height={20}
                    />
                  </div>
                  <span className="text-sm">{trade.pair}</span>
                </div>
              </td>
              <td className="text-right py-2">
                <div className="text-sm">{trade.profit.split("\n")[0]}</div>
                <div className="text-gray-400 text-xs">
                  {trade.profit.split("\n")[1]}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
