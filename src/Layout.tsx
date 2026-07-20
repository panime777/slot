import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { machines, getMachine } from './machines';
import type { Machine } from './engine/types';
import './App.css';

export interface OutletContext {
  machine: Machine;
}

export default function Layout() {
  const { machineId } = useParams();
  const machine = (machineId && getMachine(machineId)) || machines[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const switchMachine = (id: string) => {
    setMenuOpen(false);
    navigate(`/${id}/tool`);
  };

  return (
    <div className="app">
      <header>
        <div>
          <h1>設定判別ツール</h1>
          <p className="machine-name">{machine.name}</p>
        </div>
        <button
          className="menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="機種を選択"
          aria-expanded={menuOpen}
        >
          ☰
        </button>
      </header>
      {menuOpen && (
        <nav className="machine-menu">
          {machines.map((m) => (
            <button
              key={m.id}
              className={m.id === machine.id ? 'active' : ''}
              onClick={() => switchMachine(m.id)}
            >
              {m.name}
            </button>
          ))}
        </nav>
      )}
      <nav className="page-tabs">
        <NavLink to={`/${machine.id}/tool`} className={({ isActive }) => (isActive ? 'active' : '')}>
          判別ツール
        </NavLink>
        <NavLink to={`/${machine.id}/points`} className={({ isActive }) => (isActive ? 'active' : '')}>
          設定差ポイント
        </NavLink>
        <NavLink to={`/${machine.id}/history`} className={({ isActive }) => (isActive ? 'active' : '')}>
          履歴
        </NavLink>
      </nav>
      <Outlet key={machine.id} context={{ machine } satisfies OutletContext} />
    </div>
  );
}
