import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiSearch, FiMapPin, FiBell, FiUser } from 'react-icons/fi';
import './NavBar.css';

export default function NavBar() {
  return (
    <nav className="bottom-nav">
      <NavItem to="/home" icon={<FiHome />} label="Home" />
      <NavItem to="/search" icon={<FiSearch />} label="Search" />
      <NavItem to="/tracking" icon={<FiMapPin />} label="Routes" />
      <NavItem to="/notifications" icon={<FiBell />} label="Notify" />
      <NavItem to="/profile" icon={<FiUser />} label="Profile" />
    </nav>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'bottom-nav-item' + (isActive ? ' bottom-nav-item-active' : '')
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
