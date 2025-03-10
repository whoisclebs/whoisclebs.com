import { Route, Routes } from "react-router"
import Home from "./pages/home"
import Layout from "./layout/layout"
import About from "./pages/about"
import NotFound from "./pages/404"
import Books from "./pages/books"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/books" element={<Books />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
