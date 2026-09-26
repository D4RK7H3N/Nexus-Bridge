import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import { Shell } from './components/layout/Shell'
import { Traffic } from './routes/Traffic'
import { Endpoints } from './routes/Endpoints'
import { Mesh } from './routes/Mesh'
import { MeshBackends } from './routes/MeshBackends'
import { MeshScaler } from './routes/MeshScaler'
import { Gov } from './routes/Gov'

const router = createHashRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/traffic" replace /> },
      { path: 'traffic', element: <Traffic /> },
      { path: 'endpoints', element: <Endpoints /> },
      {
        path: 'mesh',
        element: <Mesh />,
        children: [
          { index: true, element: <Navigate to="/mesh/backends" replace /> },
          { path: 'backends', element: <MeshBackends /> },
          { path: 'scaler', element: <MeshScaler /> },
        ],
      },
      { path: 'gov', element: <Gov /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
