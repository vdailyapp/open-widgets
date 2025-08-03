import React, { useState } from 'react';
import {
  FiSend,
  FiDownload,
  FiRepeat,
  FiPlus,
  FiBell,
  FiMoon,
  FiSun,
  FiChevronDown,
} from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const BlockchainWalletWidget = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('Main Wallet');

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const portfolioData = [
    { name: 'ETH', value: 60, color: '#3498db' },
    { name: 'BTC', value: 30, color: '#f39c12' },
    { name: 'USDT', value: 10, color: '#2ecc71' },
  ];

  const tokens = [
    { name: 'Ethereum', symbol: 'ETH', balance: '2.5', value: '$4,500', change: '+5.2%' },
    { name: 'Bitcoin', symbol: 'BTC', balance: '0.1', value: '$3,800', change: '-1.8%' },
    { name: 'Tether', symbol: 'USDT', balance: '1000', value: '$1,000', change: '0%' },
  ];

  const transactions = [
    { id: 1, type: 'Received', amount: '0.5 ETH', date: '2023-04-15', status: 'Completed' },
    { id: 2, type: 'Sent', amount: '0.1 BTC', date: '2023-04-14', status: 'Pending' },
    { id: 3, type: 'Swapped', amount: '100 USDT to ETH', date: '2023-04-13', status: 'Completed' },
  ];

  return (
    <div
      className={`flex min-h-screen items-center justify-center p-4 ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}
    >
      <div
        className={`w-full max-w-4xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } overflow-hidden rounded-xl shadow-lg`}
      >
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Blockchain Wallet</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {isDarkMode ? <FiSun size={24} /> : <FiMoon size={24} />}
              </button>
              <div className="relative">
                <select
                  value={selectedWallet}
                  onChange={(e) => setSelectedWallet(e.target.value)}
                  className={`appearance-none ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                  } rounded-md border border-gray-300 py-2 pl-3 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option>Main Wallet</option>
                  <option>Savings Wallet</option>
                  <option>Trading Wallet</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <FiChevronDown size={18} />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
              <h2 className="mb-4 text-xl font-semibold">Portfolio Overview</h2>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">$9,300</p>
                  <p className="text-sm text-gray-500">Total Balance</p>
                </div>
                <div className="h-24 w-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={40}
                        fill="#8884d8"
                      >
                        {portfolioData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex justify-between">
                {portfolioData.map((item) => (
                  <div key={item.name} className="flex items-center">
                    <div
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`flex items-center justify-center rounded-lg p-4 ${
                    isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white transition duration-200`}
                >
                  <FiSend className="mr-2" /> Send
                </button>
                <button
                  className={`flex items-center justify-center rounded-lg p-4 ${
                    isDarkMode
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-green-500 hover:bg-green-600'
                  } text-white transition duration-200`}
                >
                  <FiDownload className="mr-2" /> Receive
                </button>
                <button
                  className={`flex items-center justify-center rounded-lg p-4 ${
                    isDarkMode
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-purple-500 hover:bg-purple-600'
                  } text-white transition duration-200`}
                >
                  <FiRepeat className="mr-2" /> Swap
                </button>
                <button
                  className={`flex items-center justify-center rounded-lg p-4 ${
                    isDarkMode
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-orange-500 hover:bg-orange-600'
                  } text-white transition duration-200`}
                >
                  <FiPlus className="mr-2" /> Add Token
                </button>
              </div>
            </div>
          </div>

          <div className={`mb-8 rounded-xl p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h2 className="mb-4 text-xl font-semibold">Token List</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <th className="pb-3 text-left">Token</th>
                    <th className="pb-3 text-right">Balance</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-right">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr
                      key={token.symbol}
                      className="border-t border-gray-200 dark:border-gray-600"
                    >
                      <td className="py-4">
                        <div className="flex items-center">
                          <div
                            className={`mr-3 flex h-8 w-8 items-center justify-center rounded-full ${
                              isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                            }`}
                          >
                            {token.symbol.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{token.name}</p>
                            <p
                              className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}
                            >
                              {token.symbol}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right">{token.balance}</td>
                      <td className="text-right">{token.value}</td>
                      <td
                        className={`text-right ${
                          token.change.startsWith('+')
                            ? 'text-green-500'
                            : token.change.startsWith('-')
                            ? 'text-red-500'
                            : ''
                        }`}
                      >
                        {token.change}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
            <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between rounded-lg p-4 ${
                    isDarkMode ? 'bg-gray-600' : 'bg-white'
                  }`}
                >
                  <div>
                    <p className="font-medium">{tx.type}</p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {tx.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{tx.amount}</p>
                    <p
                      className={`text-sm ${
                        tx.status === 'Completed' ? 'text-green-500' : 'text-yellow-500'
                      }`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainWalletWidget;
