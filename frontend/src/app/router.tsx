import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EditorPage from '../pages/EditorPage';
import ExplorePage from '../pages/ExplorePage';
import LoginPage from '../pages/LoginPage';
import PlayPage from '../pages/PlayPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/play" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'editor',
        element: <EditorPage />,
      },
      {
        path: 'play',
        element: <PlayPage />,
      },
      {
        path: 'explore',
        element: <ExplorePage />,
      },
    ],
  },
]);
