import { Route, Routes } from 'react-router-dom'

import { HomePage } from '../pages/HomePage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { RoomPage } from '../pages/RoomPage'

export function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<RoomPage />} path="/room/:roomId" />
      <Route element={<NotFoundPage />} path="*" />
    </Routes>
  )
}
