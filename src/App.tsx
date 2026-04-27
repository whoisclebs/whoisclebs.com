import { Route, Routes } from "react-router"
import Home from "./pages/home"
import Layout from "./layout/layout"
import About from "./pages/about"
import NotFound from "./pages/404"
import Books from "./pages/books"
import Blog from "./pages/blog"
import BlogPost from "./pages/blog-post"
import Portfolio from "./pages/portfolio"
import Til from "./pages/til"
import TilPost from "./pages/til-post"
import Hobbies from "./pages/hobbies"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/books" element={<Books />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/hobbies" element={<Hobbies />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/til" element={<Til />} />
        <Route path="/til/:slug" element={<TilPost />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
