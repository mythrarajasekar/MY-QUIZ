// client/src/components/Layout.js
import React from "react";
import { Link } from "react-router-dom";

function Layout({ children }) {
  return (
    <div className="home-layout">
      <aside className="sidebar">
        <h2>My Quiz App</h2>
        <ul>
          <li><Link to="/">Dashboard</Link></li>
          <li><Link to="/admin/exams">Quizzes</Link></li>
          <li><Link to="/admin/reports">Reports</Link></li>
          <li><Link to="/user/reports">My Reports</Link></li>
          <li><Link to="/profile">Profile</Link></li>
        </ul>
        <div className="footer">© 2025 MyQuiz</div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
