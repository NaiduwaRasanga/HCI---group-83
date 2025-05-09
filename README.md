# 3D Furniture Web Application

This is a web-based 3D furniture visualization application built with React and Three.js.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Setup Instructions

1. Download and extract the project files
2. Open terminal/command prompt in the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```
5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

- `/client` - Frontend React application
- `/models` - 3D furniture models
- `/public` - Static assets

## Features

- 3D furniture visualization
- Interactive furniture placement
- Multiple furniture categories
- Real-time preview

## Troubleshooting

If you encounter any issues:
1. Make sure all dependencies are installed correctly
2. Check if Node.js version is compatible
3. Clear npm cache if needed: `npm cache clean --force`

## Technology Stack

### Frontend
- React.js
- Three.js for 3D rendering
- Tailwind CSS for styling
- React Three Fiber for React integration with Three.js

### Backend
- Node.js/Express
- MongoDB for data storage
- JWT for authentication

## Project Structure

```
furniture-design-visualizer/
├── client/                 # React frontend
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # React components
│       ├── scenes/        # 3D scenes
│       ├── utils/         # Utility functions
│       └── assets/        # Static assets
├── server/                # Node.js/Express backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   └── middleware/       # Custom middleware
└── assets/               # 3D models and other assets
    └── models/           # Furniture 3D models
```

## Development Guidelines

### Git Commit Strategy
- Week 1: Project setup and basic structure
- Week 2: Authentication and user management
- Week 3: 3D visualization core features
- Week 4: Design management and UI polish
- Week 5: Testing and optimization

### 3D Model Integration
1. Place 3D models in `assets/models/` directory
2. Supported formats: OBJ, GLTF
3. Update model references in the scene components

## Dependencies

### Frontend
- React 18.2.0
- Three.js 0.159.0
- React Three Fiber 8.14.5
- Tailwind CSS 3.3.5

### Backend
- Express 4.18.2
- MongoDB
- JWT 9.0.2
- Mongoose 8.0.3

## License

ISC

## Credits

- Three.js community for 3D rendering capabilities
- React Three Fiber team for React integration
- All other open-source contributors 