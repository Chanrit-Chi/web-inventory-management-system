# Authentication with Better-Auth

This application uses [Better-Auth](https://better-auth.com) for authentication.

## Features

- ✅ Email & Password authentication
- ✅ Secure session management
- ✅ Protected routes
- ✅ User signup and login
- ✅ Password validation (minimum 8 characters)
- ✅ Auto sign-in after registration
- ✅ Role-based access control (SELLER, ADMIN, MANAGER)

## Setup

1. **Install dependencies** (already done):

   ```bash
   npm install better-auth
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   Required variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `BETTER_AUTH_SECRET`: A random secret key (generate with `openssl rand -base64 32`)
   - `BETTER_AUTH_URL`: Your application URL (http://localhost:3000 for development)

3. **Database Setup**:
   The Prisma schema is already configured with the required tables. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

## Usage

### Authentication Pages

- **Login/Signup**: `/user_auth`
- **Dashboard**: `/dashboard` (protected route)

### Components

1. **Login Form** (`components/ui/login-form.tsx`):
   - Email and password login
   - Error handling
   - Loading states

2. **Signup Form** (`components/ui/signup-form.tsx`):
   - User registration with name, email, and password
   - Password confirmation
   - Validation

3. **User Navigation** (`components/auth/user-nav.tsx`):
   - Display user info
   - Sign out button

4. **Protected Route** (`components/auth/auth-provider.tsx`):
   - Wrapper for protected pages
   - Automatic redirect to login if not authenticated

### Using Authentication in Your App

#### Check if user is logged in:

```tsx
"use client";

import { useSession } from "@/lib/auth-client";

export function MyComponent() {
  const { data: session, isPending } = useSession();

  if (isPending) return <div>Loading...</div>;
  if (!session) return <div>Please log in</div>;

  return <div>Hello, {session.user.name}!</div>;
}
```

#### Protect a page:

```tsx
import { ProtectedRoute } from "@/components/auth/auth-provider";

export default function ProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

#### Sign out:

```tsx
import { authClient } from "@/lib/auth-client";

const handleSignOut = async () => {
  await authClient.signOut();
  router.push("/user_auth");
};
```

## Configuration

### Server Configuration (`lib/auth.ts`)

The server-side configuration includes:

- PostgreSQL database adapter with Prisma
- Email/password authentication
- Session management (7 day expiry)
- Session cookie caching
- User roles support

### Client Configuration (`lib/auth-client.ts`)

The client-side configuration connects to the Better-Auth API at `/api/auth`.

## Security Features

- ✅ Password hashing
- ✅ Secure session tokens
- ✅ HTTP-only cookies
- ✅ CSRF protection
- ✅ Session expiration
- ✅ Cookie caching for performance

## Testing

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/user_auth`

3. Create a new account:
   - Enter your name, email, and password
   - Click "Create Account"
   - You'll be automatically signed in and redirected

4. Test login:
   - Sign out using the user menu
   - Go back to `/user_auth`
   - Login with your credentials

## Database Schema

The authentication system uses these tables:

- `user`: Stores user information (id, name, email, role, etc.)
- `session`: Manages user sessions
- `account`: Stores account credentials and OAuth data
- `verification`: Handles email verification tokens

## Permission Seeding Workflow

This project uses `prisma/seed-permissions.ts` to create/update permission data.

### When you should run it

Run permission seeding when you:

- Add a new RBAC resource (example: `shipment`)
- Add a new CRUD permission key (example: `shipment:create`)
- Add a new feature permission key (example: `analytics:read`)
- Change role/group access rules in `ResourceMatrix` or `FeatureAccess`

### When you usually don't need it

- UI-only feature changes that don't introduce new permission keys
- Refactors that keep permission names and matrix rules unchanged

### Command

```bash
npm run seed:permissions
```

### Why rerunning is safe

The seed script uses `upsert`, so rerunning it updates/ensures required records exist without creating duplicates.

## Troubleshooting

### "Database connection error"

- Check your `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev` to create tables

### "Session not found"

- Clear your browser cookies
- Check that `BETTER_AUTH_SECRET` is set in `.env`

### "Auto sign-in not working"

- This is configured in `lib/auth.ts` with `autoSignIn: true`
- Make sure you've saved the latest configuration

## Next Steps

- Add email verification
- Implement password reset
- Add OAuth providers (Google, GitHub, etc.)
- Add two-factor authentication
- Customize user roles and permissions
