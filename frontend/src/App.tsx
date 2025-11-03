import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import SendLike from './pages/SendLike';
import ReceivedLikes from './pages/ReceivedLikes';
import SentLikes from './pages/SentLikes';
import Points from './pages/Points';
import Raffle from './pages/Raffle';
import Admin from './pages/Admin';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/send-like" element={<SendLike />} />
          <Route path="/received-likes" element={<ReceivedLikes />} />
          <Route path="/sent-likes" element={<SentLikes />} />
          <Route path="/points" element={<Points />} />
          <Route path="/raffle" element={<Raffle />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;