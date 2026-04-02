# Employee Portal Frontend

Modern React frontend for an AI-powered employee portal with comprehensive features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── features/              # Feature modules
│   ├── auth/             # Authentication (login, logout)
│   ├── dashboard/        # Dashboard & leave requests
│   ├── chatbot/          # AI chatbot interface
│   ├── documents/        # Document search
│   └── admin/            # Admin panel
├── shared/               # Shared resources
│   ├── components/       # Reusable components
│   ├── services/         # API service layer
│   ├── hooks/            # Custom React hooks
│   ├── context/          # State management (Zustand)
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   └── styles/           # Global styles
├── config/               # Configuration
├── App.tsx              # Root component
└── main.tsx             # Entry point
```

## 🎯 Features

### Authentication
- Login with email/password
- JWT token management
- Protected routes
- Auto-logout on token expiry

### Dashboard
- Employee information display
- Leave balance tracking
- Leave request form
- HR announcements feed

### AI Chatbot
- Conversation management
- Real-time messaging
- Message streaming support
- Conversation history

### Document Search
- AI-powered semantic search
- Document snippets
- Relevance scoring
- Download functionality

### Admin Panel
- Document upload
- Document management
- Bulk operations

## 🛠 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Ant Design** - Component library
- **React Query** - Data fetching & caching
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Routing

## 🔧 Development

### Environment Setup

Create `.env.development` or copy from `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_ENABLE_ADMIN=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_DOCUMENT_SEARCH=true
```

### API Integration

The frontend connects to the Django backend at `http://localhost:8000`:

- **Authentication**: `/api/auth/login/`, `/api/auth/me/`
- **Employees**: `/api/employees/`
- **Leave**: `/api/leaves/`
- **Announcements**: `/api/announcements/`
- **Chat**: `/api/chat/conversations/`
- **Documents**: `/api/documents/`, `/api/search/`

### Scripts

```bash
npm run dev          # Start dev server on :5173
npm run build        # Production build
npm run preview      # Preview built app
npm run lint         # Run ESLint
npm run type-check   # TypeScript check
```

## 🎨 Component Architecture

### Feature Components
Each feature has its own folder with:
- Main component
- Sub-components
- Styling (CSS modules)
- Types (if any)

### Shared Components
- `ProtectedRoute` - Route protection
- `Layout` - Main app layout
- Reusable UI components

### Custom Hooks
- `useCurrentUser()` - Get logged-in user
- `useEmployeeProfile()` - Get employee profile
- `useMyLeaveRequests()` - Get leave requests
- `useAnnouncements()` - Get announcements

### State Management
- **Zustand Stores**: `useAuthStore`, `useChatStore`
- **React Query**: Server-side caching
- **localStorage**: Token persistence

## 🚀 Deployment

### Build
```bash
npm run build
```

### Production Server
The built files in `dist/` can be served by:
- Nginx
- Apache
- Docker
- CDN + API Gateway

### Docker

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📝 API Client

All API calls use the centralized `axios` instance with:
- Auth token injection
- Error handling
- Request/response logging
- Automatic retry

## 🔒 Security

- JWT tokens stored in localStorage
- Protected routes with `ProtectedRoute` component
- Admin-only routes with `AdminRoute` component
- CORS-enabled API proxy in dev

## 📈 Performance

- Code splitting by route
- Lazy loading components
- React Query caching
- CSS modules for style scoping
- Vite optimizations

## 🐛 Troubleshooting

### API Connection Failed
- Verify backend is running on `http://localhost:8000`
- Check CORS settings in backend
- Update `VITE_API_BASE_URL` in `.env`

### Login Not Working
- Check credentials
- Verify backend auth endpoints
- Check browser console for errors

### Slow Performance
- Clear browser cache
- Check React Query DevTools
- Profile with Chrome DevTools

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Ant Design Components](https://ant.design/components/overview/)
- [React Query Docs](https://tanstack.com/query/latest)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

MIT License
