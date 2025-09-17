import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import ToolsSection from './components/Tools/ToolsSection';
import Modal from './components/Modal/Modal';
import FAQ from './components/FAQ/FAQ';
import Footer from './components/Footer/Footer';
import { ThemeProvider } from './context/ThemeContext';
import './styles/main.css';

function App() {
  const [currentTool, setCurrentTool] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize PDF.js worker
  useEffect(() => {
    if (typeof window.pdfjsLib !== 'undefined') {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }, []);

  const openTool = (toolId) => {
    setCurrentTool(toolId);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setCurrentTool(null);
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <ThemeProvider>
      <div className="App">
        <Header />
        <main>
          <Hero />
          <ToolsSection onOpenTool={openTool} />
          <FAQ />
        </main>
        <Footer onOpenTool={openTool} />

        {isModalOpen && currentTool && (
          <Modal
            toolId={currentTool}
            onClose={closeModal}
          />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;