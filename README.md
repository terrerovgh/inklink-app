# InkLink - Tattoo Artist & Studio Discovery Platform

🎨 **InkLink** is a modern web application that connects tattoo enthusiasts with talented artists and studios. Built with Next.js, TypeScript, Supabase, and OpenStreetMap integration.

## ✨ Features

- 🗺️ **Interactive Map**: Discover tattoo artists and studios near you using OpenStreetMap
- 👤 **User Profiles**: Separate profiles for clients, artists, and studios
- 🎨 **Portfolio Showcase**: Artists can display their work with detailed portfolios
- 📝 **Request System**: Clients can post tattoo requests and receive offers from artists
- 💬 **Messaging**: Direct communication between clients and artists
- ⭐ **Reviews & Ratings**: Community-driven feedback system
- 🔐 **Authentication**: Secure login with email, Google, and Facebook
- 💳 **Payment Integration**: Stripe and PayPal support for transactions
- 📱 **Responsive Design**: Optimized for desktop and mobile devices
- 🌍 **Geospatial Search**: Find artists within specific radius using PostGIS

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL with PostGIS extension
- **Authentication**: Supabase Auth
- **Maps**: React Leaflet with OpenStreetMap
- **UI Components**: React Bits (shadcn/ui compatible)
- **Payments**: Stripe, PayPal
- **File Storage**: Supabase Storage
- **Deployment**: Vercel

## ✅ Requisitos del sistema (System Requirements)

- Node.js 18 o superior
- pnpm 9.x (o npm/yarn, recomendado pnpm)
- Cuenta de Supabase y acceso al Dashboard
- Supabase CLI (opcional, para aplicar migraciones): https://supabase.com/docs/guides/cli
- Stripe account (para pagos) y Stripe CLI (opcional para webhooks)
- Cuenta de Desarrollador de PayPal (sandbox/production)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account
- Stripe account (for payments)
- PayPal developer account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inklink
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your configuration values in `.env.local`

4. **Set up Supabase**
   - Create a new Supabase project
   - Enable PostGIS extension in SQL Editor:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```
   - Run the database migrations:

     Option A — Supabase Dashboard (hosted):
     - Open SQL Editor and execute the SQL files in `supabase/migrations` en orden.

     Option B — Supabase CLI (proyectos enlazados):
     - Install CLI and login: `npm i -g supabase && supabase login`
     - Link your project: `supabase link --project-ref <your-project-ref>`
     - Push migrations: `supabase db push`

5. **Configure Authentication**
   - In Supabase Dashboard → Authentication → Settings
   - Add your site URL: `http://localhost:3000`
   - Configure OAuth providers (Google, Facebook)

6. **Start the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
inklink/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   ├── dashboard/       # User dashboard
│   │   └── profile/         # Artist/Studio profiles
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and configurations
│   ├── styles/              # Global styles and CSS
│   └── types/               # TypeScript type definitions
├── supabase/
│   └── migrations/          # Database migration files
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 🗄️ Database Schema

The application uses PostgreSQL with PostGIS for geospatial functionality:

- **users**: Base user information with location data
- **artists**: Artist-specific profiles and portfolios
- **studios**: Tattoo studio information and details
- **requests**: Client tattoo requests
- **offers**: Artist offers for requests
- **portfolio_items**: Artist portfolio pieces
- **reviews**: User reviews and ratings
- **messages**: Direct messaging system

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# ─── App & Site ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_SITE_VERIFICATION=

# ─── Supabase ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Server-only (NO exponer en el cliente)
SUPABASE_SERVICE_ROLE_KEY=

# ─── Maps / Tiles ────────────────────────────────────────────────────────────
NEXT_PUBLIC_MAPTILER_API_KEY=

# ─── Stripe ──────────────────────────────────────────────────────────────────
# Publishable key (cliente)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# Algunas rutas usan STRIPE_PUBLISHABLE_KEY en servidor; puedes duplicar el valor
STRIPE_PUBLISHABLE_KEY=
# Secret key (servidor)
STRIPE_SECRET_KEY=
# Webhook secret (opcional, para notificaciones)
STRIPE_WEBHOOK_SECRET=

# ─── PayPal ──────────────────────────────────────────────────────────────────
# Client ID para cliente (botones)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
# Credenciales de servidor
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
```

### Supabase Setup

1. **Create a new Supabase project**
2. **Enable PostGIS extension**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. **Run migrations**:
   ```bash
   pnpm supabase:migrate
   ```
4. **Configure Row Level Security (RLS)**:
   The migrations include RLS policies for secure data access.

### Authentication Providers

**Google OAuth**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add to Supabase Auth settings

**Facebook OAuth**:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app and get App ID/Secret
3. Add to Supabase Auth settings

## 🎨 UI Components

This project uses React Bits components via shadcn CLI:

```bash
# Install a component
npx shadcn@latest add https://reactbits.dev/r/Button-TS-TW

# Available components
- Button, Input, Card, Dialog
- Form, Select, Textarea
- Avatar, Badge, Separator
- And many more...
```

## 🗺️ Maps Integration

The application uses React Leaflet with OpenStreetMap:

- **Interactive map** with artist/studio markers
- **Clustering** for better performance
- **Geospatial search** within radius
- **Custom popups** with artist information
- **Location-based filtering**

## 💳 Payment Integration

### Stripe Setup
1. Create a Stripe account
2. Get your publishable and secret keys
3. Configure webhooks for payment events

### PayPal Setup
1. Create a PayPal developer account
2. Create a new app to get Client ID
3. Configure sandbox/live environment

## 🧪 Testing

Run the test suite:

```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy**:
   ```bash
   pnpm build
   ```

### Manual Deployment

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## 📝 API Documentation

### Authentication
- `POST /api/auth` - Login/Register/Logout
- `GET /api/auth` - Get current session

### Search
- `GET /api/search` - Search artists/studios by location
- Query parameters: `lat`, `lng`, `radius`, `type`

### Requests & Offers
- `GET /api/requests` - Get tattoo requests
- `POST /api/requests` - Create new request
- `GET /api/offers` - Get offers for requests
- `POST /api/offers` - Create new offer

### File Upload
- `POST /api/upload` - Upload images to Supabase Storage
- `DELETE /api/upload` - Delete uploaded files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/)
2. Search existing [issues](issues)
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [React Leaflet](https://react-leaflet.js.org/) - Map components
- [OpenStreetMap](https://www.openstreetmap.org/) - Map data
- [React Bits](https://reactbits.dev/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

**Made with ❤️ for the tattoo community**