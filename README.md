# Salon Management Frontend

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)

A modern, high-performance frontend application for the Salon Management System, built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

---

## 🌟 Overview

The **Salon Management Frontend** is designed to provide an intuitive, responsive, and seamless experience for both salon clients and administrators. It interfaces with the backend APIs to handle user authentication, appointment scheduling, service browsing, and dashboard analytics.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Package Manager**: [Bun](https://bun.sh/)
- **Type Checking**: [TypeScript](https://www.typescriptlang.org/)

## 🛠️ Features

- **Responsive Design**: Mobile-first architecture ensuring perfect layouts across all devices.
- **Accessible UI**: Utilizing Radix UI primitives for WAI-ARIA compliant components.
- **Robust Forms**: Type-safe form validation using Zod and React Hook Form.
- **Dynamic Animations**: Smooth page transitions and micro-interactions powered by Framer Motion.
- **Dark/Light Mode**: Built-in theme switching (`next-themes`).

## ⚙️ Getting Started

### Prerequisites

Make sure you have [Bun](https://bun.sh/) installed on your machine.
If you prefer, you can also use `npm`, `yarn`, or `pnpm`.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Salon-Management-Frontend
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and configure your variables based on `.env.example` (or refer to the list below):

   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
   # NEXT_PUBLIC_API_URL=https://salon-management-server.onrender.com/api/v1 # Production

   # Environment
   NODE_ENV=development

   # Authentication Secrets
   JWT_SECRET=your-jwt-secret
   ACCESS_TOKEN_SECRET=your-access-token-secret
   REFRESH_TOKEN_SECRET=your-refresh-token-secret
   ```

   | Variable | Description | Default / Example |
   | :--- | :--- | :--- |
   | `NEXT_PUBLIC_API_URL` | The base URL for the backend API | `http://localhost:5000/api/v1` |
   | `NODE_ENV` | The environment mode | `development` |
   | `JWT_SECRET` | Secret key for JWT signing | `your-jwt-secret` |
   | `ACCESS_TOKEN_SECRET` | Secret key for Access Token | `your-access-token-secret` |
   | `REFRESH_TOKEN_SECRET`| Secret key for Refresh Token | `your-refresh-token-secret` |

4. **Run the development server:**
   ```bash
   bun dev
   ```

5. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```plaintext
├── public/             # Static assets (images, icons)
├── src/                
│   ├── app/            # Next.js App Router (Pages & Layouts)
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utility functions and configurations
│   ├── types/          # TypeScript type definitions
│   └── hooks/          # Custom React hooks
├── components.json     # shadcn/ui or radux component configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── next.config.ts      # Next.js configuration
```

## 📜 Available Scripts

- `bun run dev`: Starts the development server.
- `bun run build`: Builds the application for production.
- `bun run start`: Runs the compiled production server.
- `bun run lint`: Lints the codebase using ESLint.

## 🤝 Contributing

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
