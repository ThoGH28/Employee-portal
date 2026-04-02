# Frontend Architecture & Setup Guide

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Setup Instructions](#setup-instructions)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Building & Deployment](#building--deployment)
6. [Performance Optimization](#performance-optimization)
7. [Troubleshooting](#troubleshooting)

## Project Structure

```
Employee-portal-frontend/
├── src/
│   ├── features/                    # Feature-based modules
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx       # Login component
│   │   │   └── LoginPage.module.css
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── LeaveRequestForm.tsx
│   │   │   └── Dashboard.module.css
│   │   ├── chatbot/
│   │   │   ├── ChatBot.tsx         # AI chatbot interface
│   │   │   └── ChatBot.module.css
│   │   ├── documents/
│   │   │   ├── DocumentSearch.tsx  # Document search
│   │   │   └── DocumentSearch.module.css
│   │   └── admin/
│   │       ├── AdminPanel.tsx      # Admin controls
│   │       └── AdminPanel.module.css
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx  # Route protection
│   │   │   ├── Layout.tsx          # App layout
│   │   │   └── Layout.module.css
│   │   ├── services/
│   │   │   ├── api.ts             # Axios client
│   │   │   ├── authService.ts     # Auth API
│   │   │   ├── employeeService.ts # Employee API
│   │   │   ├── chatService.ts     # Chat API
│   │   │   └── documentService.ts # Document API
│   │   ├── hooks/
│   │   │   └── queries.ts         # React Query hooks
│   │   ├── context/
│   │   │   └── store.ts           # Zustand stores
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── storage.ts         # LocalStorage helpers
│   │   │   └── helpers.ts         # Utility functions
│   │   └── styles/
│   │       ├── theme.ts           # Ant Design theme
│   │       └── index.css          # Global styles
│   ├── config/
│   │   ├── queryClient.ts         # React Query client
│   │   └── index.ts               # Config exports
│   ├── App.tsx                    # Root component
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global CSS
├── public/                         # Static assets
├── Dockerfile                      # Docker image
├── docker-compose.yml              # Docker Compose
├── nginx.conf                      # Nginx config
├── vite.config.ts                 # Vite configuration
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── .env.example                   # Example env vars
└── README.md                      # Documentation
```

## Setup Instructions

### Prerequisites
- Node.js 16+ (18+ recommended)
- npm or yarn package manager
- Git


### Local Development Setup

1. **Clone and install**
   ```bash
   cd Employee-portal-frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development if needed
   ```

3. **Start development server**
   ```bash
   npm run dev
   # Server runs on http://localhost:5173
   ```

4. **Open browser**
   - Navigate to http://localhost:5173
   - Use demo credentials: `demo@example.com / demo123`

## Development Workflow

### Code Organization

**Features Module Pattern**
```
feature/
├── ComponentName.tsx              # Main component
├── ComponentName.module.css       # Component styles
├── subcomponent/                  # Nested components
│   ├── SubComponent.tsx
│   └── SubComponent.module.css
└── index.ts                       # Public exports
```

**Component Template**
```typescript
import React from 'react'
import styles from './Component.module.css'

interface Props {
  // Props definition
}

export const Component: React.FC<Props> = ({ ...props }) => {
  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  )
}
```

### Adding New Features

1. **Create feature module**
   ```bash
   mkdir src/features/newfeature
   touch src/features/newfeature/NewFeature.tsx
   touch src/features/newfeature/NewFeature.module.css
   ```

2. **Define types** (if needed)
   ```typescript
   // Update src/shared/types/index.ts
   export interface NewFeatureData { ... }
   ```

3. **Create API service** (if needed)
   ```typescript
   // src/shared/services/newFeatureService.ts
   export const newFeatureService = { ... }
   ```

4. **Add React Query hooks** (if needed)
   ```typescript
   // Add to src/shared/hooks/queries.ts
   export const useNewFeature = () => { ... }
   ```

5. **Add route**
   ```typescript
   // Update src/App.tsx
   <Route path="/newfeature" element={<NewFeature />} />
   ```

### State Management Pattern

Use **Zustand** for global state:
```typescript
import { create } from 'zustand'

interface Store {
  count: number
  increment: () => void
}

export const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Usage
const { count, increment } = useStore()
```

Use **React Query** for server state:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource'],
  queryFn: () => api.get('/resource'),
})
```

## Testing

### Unit Testing Setup (Optional)
```bash
npm install --save-dev vitest @testing-library/react
```

### Component Testing Template
```typescript
import { render, screen } from '@testing-library/react'
import { Component } from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />)
    expect(screen.getByText('text')).toBeInTheDocument()
  })
})
```

## Building & Deployment

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run build
# Creates optimized dist/ folder

npm run preview  # Preview locally
```

### Docker Deployment

1. **Build image**
   ```bash
   docker build -t employee-portal-frontend .
   ```

2. **Run container**
   ```bash
   docker run -p 3000:80 employee-portal-frontend
   ```

3. **With Docker Compose**
   ```bash
   docker-compose up -d
   ```

### Nginx Deployment

1. **Copy built files**
   ```bash
   npm run build
   sudo cp -r dist/* /var/www/employee-portal/
   ```

2. **Configure Nginx**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/employee-portal
   sudo ln -s /etc/nginx/sites-available/employee-portal /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### CI/CD Pipeline (GitHub Actions Example)

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
```

## Performance Optimization

### Bundle Analysis
```bash
npm install --save-dev rollup-plugin-visualizer
# Check build/stats.html
```

### Code Splitting
Vite automatically handles route-based splitting via React Router.

### Caching Strategy
- Static assets: 365 days cache
- HTML: No cache (always fresh)
- API responses: React Query 5-min cache

### Lazy Loading Components
```typescript
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

const LazyComponent = lazy(() => import('./Component'))

export const App = () => (
  <Suspense fallback={<Spin />}>
    <LazyComponent />
  </Suspense>
)
```

### Image Optimization
```typescript
// Use Ant Design Image component
import { Image } from 'antd'

<Image src={url} preview width={200} />
```

## Troubleshooting

### Common Issues

#### 1. API Connection Fails
```
Error: Failed to fetch from http://localhost:8000
```
**Solution:**
- Ensure backend runs on port 8000
- Check VITE_API_BASE_URL in .env
- Verify CORS headers

#### 2. 401 Unauthorized
```
Error: Token expired
```
**Solution:**
- Token stored in localStorage
- Auto-refresh via interceptor
- Manual login if refresh fails

#### 3. Build Size Too Large
**Solution:**
- Check bundle: `npm run build -- --analyze`
- Split large components
- Use dynamic imports

#### 4. Slow Page Load
**Solution:**
- Enable gzip compression
- Use CDN for static assets
- Optimize images
- Profile in DevTools

### Debug Mode

Enable verbose logging:
```typescript
// In config/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onSuccess: () => console.log('Query success'),
      onError: () => console.error('Query error'),
    },
  },
})
```

## Best Practices

1. **Component Design**
   - Keep components small & focused
   - Extract logic to custom hooks
   - Use prop drilling sparingly

2. **API Integration**
   - Use service layer for all API calls
   - Centralize error handling
   - Implement loading states

3. **State Management**
   - Use Zustand for global state
   - Use React Query for server data
   - Use component state for local UI state

4. **Styling**
   - Use CSS Modules for component styles
   - Use Ant Design for common components
   - Keep global styles minimal

5. **Type Safety**
   - Define interfaces for all data
   - Use strict TypeScript config
   - Run type-check before commit

6. **Performance**
   - Monitor bundle size
   - Use React DevTools Profiler
   - Implement code splitting

## Resources

- [React Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Ant Design](https://ant.design)
- [React Query](https://tanstack.com/query)
- [TypeScript](https://www.typescriptlang.org)
- [Zustand](https://github.com/pmndrs/zustand)
