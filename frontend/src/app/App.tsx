// Root application component.
// Initializes the frontend routing system using React Router.

import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export default function App() {
  return <RouterProvider router={router} />;
}