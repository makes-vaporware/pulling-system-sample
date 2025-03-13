import { useState } from "react";
import "./App.css";
import ProductOrderPage from "./components/ProductOrderPage";
import ProjectPage from "./components/ProjectPage";

const App = () => {
  const [currentPage, setCurrentPage] = useState("productOrders");

  const renderPage = () => {
    switch (currentPage) {
      case "productOrders":
        return <ProductOrderPage />;
      case "projects":
        return <ProjectPage />;
      // case "parts":
      //   return <PartsPage />;
      default:
        return <ProductOrderPage />;
    }
  };

  return (
    <main className="container">
      <div>
        <button onClick={() => setCurrentPage("productOrders")}>
          Product Orders
        </button>
        <button onClick={() => setCurrentPage("projects")}>Projects</button>
        <button>Parts</button>
      </div>

      <div>{renderPage()}</div>
    </main>
  );
};

export default App;
