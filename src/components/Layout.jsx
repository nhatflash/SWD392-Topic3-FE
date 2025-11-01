import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children, showFooter = true, showHeader = true }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {showHeader && <Header />}
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;