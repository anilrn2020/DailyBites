# Today's Special - Restaurant Deals App

## Overview

Today's Special is a restaurant deals discovery platform that connects local restaurants with customers looking for limited-time food offers. The application features a dual-sided marketplace where customers can browse and discover restaurant deals while restaurant owners can create and manage their promotional offerings through a comprehensive dashboard.

The platform emphasizes location-based deal discovery, real-time deal tracking with time-remaining counters, and social features like favorites and reviews. The design draws inspiration from food delivery platforms like DoorDash and Uber Eats, combined with deal discovery apps like Groupon.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a **React-based Single Page Application (SPA)** built with Vite for fast development and optimized builds. The frontend follows a component-driven architecture with clear separation of concerns:

- **UI Components**: Built using shadcn/ui component library with Radix UI primitives for accessibility
- **State Management**: React Query (TanStack Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system and dark/light theme support
- **Forms**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture  
The backend implements a **Node.js Express server** with TypeScript, following RESTful API principles:

- **Server Framework**: Express.js with session-based authentication
- **Database Layer**: Drizzle ORM for type-safe database operations
- **API Structure**: Modular route handlers with middleware for authentication and authorization
- **Data Validation**: Zod schemas shared between frontend and backend for consistent validation

### Data Storage Solutions
The application uses **PostgreSQL** as the primary database with the following key design decisions:

- **ORM Choice**: Drizzle ORM selected for its TypeScript-first approach and zero-runtime overhead
- **Schema Design**: Relational model with tables for users, restaurants, deals, favorites, and analytics
- **Session Storage**: PostgreSQL-based session storage for authentication state
- **Geospatial Support**: Latitude/longitude coordinates for location-based restaurant discovery

### Authentication and Authorization
The system implements **role-based access control** with two primary user types:

- **Session-based Authentication**: Express sessions with PostgreSQL storage for persistence
- **User Roles**: Customer and restaurant owner roles with different access permissions
- **Route Protection**: Middleware-based authorization for protected endpoints
- **Profile Management**: Separate user profiles with role-specific features

### Design System and UI Architecture
The application follows a **design system approach** with consistent visual patterns:

- **Color Palette**: Vibrant orange-red primary colors for appetite appeal
- **Typography**: Inter for body text, Poppins for headings and restaurant names
- **Component Library**: Reusable UI components with consistent spacing and styling
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Theme Support**: Light and dark mode with CSS custom properties

## External Dependencies

### Core Framework Dependencies
- **React 18** with TypeScript for component-based UI development
- **Vite** for fast development server and optimized production builds
- **Express.js** for backend server framework with TypeScript support

### Database and ORM
- **Neon Database** (@neondatabase/serverless) for managed PostgreSQL hosting
- **Drizzle ORM** for type-safe database operations and migrations
- **connect-pg-simple** for PostgreSQL session storage

### UI and Styling
- **shadcn/ui** component library built on Radix UI primitives
- **Radix UI** for accessible, unstyled UI components
- **Tailwind CSS** for utility-first styling approach
- **Lucide React** for consistent icon system

### State Management and Data Fetching
- **TanStack React Query** for server state management, caching, and synchronization
- **React Hook Form** with **@hookform/resolvers** for form state management
- **Zod** for runtime type validation and schema definition

### Payment Processing
- **Stripe** integration (@stripe/stripe-js, @stripe/react-stripe-js) for subscription management and payment processing

### Development and Build Tools
- **TypeScript** for type safety across frontend and backend
- **ESBuild** for fast backend bundling in production
- **PostCSS** with Autoprefixer for CSS processing
- **Wouter** for lightweight client-side routing

### Authentication and Session Management
- **express-session** for server-side session management
- **Session storage** integrated with PostgreSQL for persistence across server restarts

The architecture prioritizes type safety, developer experience, and scalability while maintaining a clean separation between customer-facing features and restaurant management functionality.