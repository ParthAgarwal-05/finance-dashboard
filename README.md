# My Finance Dashboard

A comprehensive personal finance management tool built with Next.js, Supabase, and Tailwind CSS. Track your transactions, manage your investment portfolio, and visualize your financial health with intuitive charts.

## 🚀 Features

- **Transaction Management**: Easily add, edit, and delete income and expense transactions.
- **Categorization**: Organize your spending with smart icons and categories (Food, Transport, Rent, Salary, etc.).
- **Investment Portfolio**: Track your stocks and mutual funds in a dedicated dashboard.
- **Interactive Visualizations**: View your spending distribution and investment performance using Recharts.
- **Authentication**: Secure login and session management powered by Supabase Auth.
- **Dark Mode**: Toggle between light and dark themes for a comfortable viewing experience.
- **Search & Filter**: Quickly find transactions by description or filter by month and year.
- **Excel Export**: Export your financial data to Excel files using `xlsx`.

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Data Export**: [SheetJS (xlsx)](https://sheetjs.com/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd my-finance-dashboard
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase Project Settings > API.

### 4. Database Setup
Ensure your Supabase database has the necessary tables (e.g., `transactions`, `investments`). You may need to set up Row Level Security (RLS) policies to allow users to manage their own data.

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

- `src/app`: Next.js App Router pages and API routes.
- `src/components`: Reusable UI components (Auth, Portfolio, Charts, etc.).
- `src/hooks`: Custom React hooks for data fetching and state management.
- `src/lib`: Utility functions and third-party library configurations (Supabase client).
- `public`: Static assets like icons and images.

## 📜 License

This project is licensed under the MIT License.
