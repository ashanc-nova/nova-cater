import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import OrderDetails from './pages/OrderDetails'
import MyOrders from './pages/MyOrders'
import OrderSummary from './pages/OrderSummary'

export default function App() {
  return (
    <>
      {/* Decorative background orbs */}
      <div className="orb orb-primary w-[600px] h-[600px] -top-[200px] -right-[200px]"></div>
      <div className="orb orb-secondary w-[500px] h-[500px] top-[60%] -left-[150px]"></div>
      <div className="orb orb-primary w-[400px] h-[400px] bottom-[10%] right-[10%] opacity-10"></div>

      <div className="relative z-10">
        <Header />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Home />} />
          <Route path="/order-details" element={<OrderDetails />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/order-summary" element={<OrderSummary />} />
        </Routes>

        <Footer />
      </div>
    </>
  )
}
