import React, { useState, useEffect } from 'react';
import { Wallet, PlusCircle, CreditCard, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Transaction Types
const TRANSACTION_TYPES = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  TRANSFER: 'Transfer',
};

// Initial Wallet Data
const INITIAL_WALLETS = [
  {
    id: 1,
    name: 'Personal Bank',
    balance: 5000,
    type: 'Checking',
  },
  {
    id: 2,
    name: 'Savings Account',
    balance: 10000,
    type: 'Savings',
  },
  {
    id: 3,
    name: 'Investment Fund',
    balance: 15000,
    type: 'Investment',
  },
];

const MultiWalletManager = () => {
  // State Management
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [transactions, setTransactions] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [newWalletForm, setNewWalletForm] = useState({
    name: '',
    balance: '',
    type: 'Checking',
  });
  const [transactionForm, setTransactionForm] = useState({
    type: TRANSACTION_TYPES.INCOME,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Calculate Total Metrics
  const calculateTotals = () => {
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
    const monthlyTransactions = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleString('default', { month: 'short' });
      const existing = acc.find((item) => item.month === month);

      if (existing) {
        if (transaction.type === TRANSACTION_TYPES.INCOME) {
          existing.income += transaction.amount;
        } else if (transaction.type === TRANSACTION_TYPES.EXPENSE) {
          existing.expense += transaction.amount;
        }
      } else {
        acc.push({
          month,
          income: transaction.type === TRANSACTION_TYPES.INCOME ? transaction.amount : 0,
          expense: transaction.type === TRANSACTION_TYPES.EXPENSE ? transaction.amount : 0,
        });
      }
      return acc;
    }, []);

    return { totalBalance, monthlyTransactions };
  };

  // Add New Wallet
  const handleAddWallet = () => {
    if (!newWalletForm.name || !newWalletForm.balance) return;

    const newWallet = {
      id: Date.now(),
      name: newWalletForm.name,
      balance: parseFloat(newWalletForm.balance),
      type: newWalletForm.type,
    };

    setWallets([...wallets, newWallet]);

    // Reset form
    setNewWalletForm({
      name: '',
      balance: '',
      type: 'Checking',
    });
  };

  // Add Transaction
  const handleAddTransaction = () => {
    if (!selectedWallet || !transactionForm.amount) return;

    const newTransaction = {
      ...transactionForm,
      id: Date.now(),
      walletId: selectedWallet.id,
      amount: parseFloat(transactionForm.amount),
    };

    // Update wallet balance
    const updatedWallets = wallets.map((wallet) => {
      if (wallet.id === selectedWallet.id) {
        switch (newTransaction.type) {
          case TRANSACTION_TYPES.INCOME:
            wallet.balance += newTransaction.amount;
            break;
          case TRANSACTION_TYPES.EXPENSE:
            wallet.balance -= newTransaction.amount;
            break;
          default:
            break;
        }
      }
      return wallet;
    });

    setWallets(updatedWallets);
    setTransactions([...transactions, newTransaction]);

    // Reset transaction form
    setTransactionForm({
      type: TRANSACTION_TYPES.INCOME,
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Render Component
  return (
    <div className="flex min-h-screen justify-center bg-gray-100 p-6">
      <div className="w-full max-w-5xl rounded-xl bg-white p-8 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="flex items-center text-2xl font-bold">
            <Wallet className="mr-2" /> Wallet Manager
          </h1>
        </div>

        {/* Total Overview */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="flex items-center rounded-lg bg-blue-50 p-4">
            <TrendingUp className="mr-3 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-xl font-bold text-green-600">
                ${calculateTotals().totalBalance.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center rounded-lg bg-green-50 p-4">
            <TrendingUp className="mr-3 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-xl font-bold text-blue-600">
                $
                {transactions
                  .filter((t) => t.type === TRANSACTION_TYPES.INCOME)
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center rounded-lg bg-red-50 p-4">
            <TrendingDown className="mr-3 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-xl font-bold text-red-600">
                $
                {transactions
                  .filter((t) => t.type === TRANSACTION_TYPES.EXPENSE)
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Wallets and Chart Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Wallets Column */}
          <div>
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <CreditCard className="mr-2" /> My Wallets
            </h2>

            {/* Add Wallet Form */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold">Add New Wallet</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Wallet Name"
                  value={newWalletForm.name}
                  onChange={(e) =>
                    setNewWalletForm({
                      ...newWalletForm,
                      name: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2"
                />
                <input
                  type="number"
                  placeholder="Initial Balance"
                  value={newWalletForm.balance}
                  onChange={(e) =>
                    setNewWalletForm({
                      ...newWalletForm,
                      balance: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2"
                />
                <select
                  value={newWalletForm.type}
                  onChange={(e) =>
                    setNewWalletForm({
                      ...newWalletForm,
                      type: e.target.value,
                    })
                  }
                  className="w-full rounded border p-2 md:col-span-2"
                >
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="Investment">Investment</option>
                </select>
                <button
                  onClick={handleAddWallet}
                  className="flex items-center justify-center rounded bg-blue-500 
                    p-2 text-white transition hover:bg-blue-600 md:col-span-2"
                >
                  <PlusCircle className="mr-2" /> Add Wallet
                </button>
              </div>
            </div>

            {/* Wallet List */}
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`cursor-pointer rounded-lg border p-4 ${
                    selectedWallet?.id === wallet.id
                      ? 'border-blue-500 bg-blue-100'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedWallet(wallet)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{wallet.name}</h3>
                      <p className="text-sm text-gray-600">{wallet.type}</p>
                    </div>
                    <span
                      className={`font-bold ${
                        wallet.balance > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ${wallet.balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Column */}
          <div>
            <h2 className="mb-4 flex items-center text-xl font-semibold">
              <BarChart2 className="mr-2" /> Monthly Overview
            </h2>
            <div className="h-96 rounded-lg bg-gray-50 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={calculateTotals().monthlyTransactions}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="income" fill="#10B981" name="Income" />
                  <Bar dataKey="expense" fill="#EF4444" name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Transaction Form */}
        {selectedWallet && (
          <div className="mt-6 rounded-lg bg-gray-50 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Add Transaction for {selectedWallet.name}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={transactionForm.type}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    type: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
              >
                {Object.values(TRANSACTION_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={transactionForm.amount}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    amount: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
              />

              <input
                type="text"
                placeholder="Description"
                value={transactionForm.description}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    description: e.target.value,
                  })
                }
                className="w-full rounded border p-2 md:col-span-2"
              />

              <input
                type="date"
                value={transactionForm.date}
                onChange={(e) =>
                  setTransactionForm({
                    ...transactionForm,
                    date: e.target.value,
                  })
                }
                className="w-full rounded border p-2"
              />

              <button
                onClick={handleAddTransaction}
                className="flex items-center justify-center rounded bg-blue-500 
                  p-2 text-white transition hover:bg-blue-600"
              >
                <PlusCircle className="mr-2" /> Add Transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiWalletManager;
