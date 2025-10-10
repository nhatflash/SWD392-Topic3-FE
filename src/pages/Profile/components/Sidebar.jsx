import React from 'react';
import PropTypes from 'prop-types';

const IconUser = (props) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A10.97 10.97 0 0112 15c2.21 0 4.26.7 5.879 1.904M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
);
const IconCar = (props) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 13l2-5.5A2 2 0 017 6h10a2 2 0 011.9 1.4L21 13m-3 4a1 1 0 100-2 1 1 0 000 2zM6 17a1 1 0 100-2 1 1 0 000 2zM3 13h18M7 6l1 7m8-7l-1 7"/></svg>
);
const IconMenu = (props) => (
  <svg className={props.className} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
);

const Sidebar = ({ active, onSelect, isOpen, onToggle, items: itemsProp, onBack, onLogout, showBack = true, showLogout = true }) => {
  const items = itemsProp && Array.isArray(itemsProp) && itemsProp.length > 0 ? itemsProp : [
    { key: 'profile', label: 'Thông tin cá nhân', icon: IconUser },
    { key: 'vehicles', label: 'Phương tiện', icon: IconCar },
  ];
  return (
    <aside
  className={`bg-[#0028b8] text-white transition-all duration-300 
  ${isOpen ? 'w-64' : 'w-20'} shadow h-screen fixed top-0 left-0 z-40`}
>
  <div className="flex items-center justify-between p-4">
    {isOpen && <h2 className="text-lg font-bold whitespace-nowrap">Hồ sơ</h2>}
    <button onClick={onToggle} className="text-white" aria-label="Toggle sidebar">
      <IconMenu className="w-6 h-6"/>
    </button>
  </div>

  <nav className="px-2 pb-4">
    {items.map(it => {
      const Icon = it.icon || (it.key === 'profile' ? IconUser : it.key === 'vehicles' ? IconCar : null);
      const isActive = active === it.key;
      return (
        <button
          key={it.key}
          onClick={() => onSelect(it.key)}
          className={`flex items-center gap-3 w-full p-2 rounded-md mb-2 
            ${isActive ? 'bg-white text-[#0028b8]' : 'hover:bg-[#001f8a]'}`}
        >
          {Icon && <Icon className={`w-5 h-5 ${isActive ? 'text-[#0028b8]' : 'text-white'}`} />}
          {isOpen && <span className="text-sm font-medium">{it.label}</span>}
        </button>
      );
    })}
  </nav>

  {(showBack || showLogout) && (
    <div className="mt-auto px-2 pb-4">
      {showBack && (
        <button onClick={onBack} className="flex items-center gap-3 w-full p-2 rounded-md mb-2 bg-white/10 hover:bg-white/20">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7 7-7M3 12h18"/>
          </svg>
          {isOpen && <span className="text-sm font-medium">Quay lại</span>}
        </button>
      )}
      {showLogout && (
        <button onClick={onLogout} className="flex items-center gap-3 w-full p-2 rounded-md bg-red-500/90 hover:bg-red-600">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"/>
          </svg>
          {isOpen && <span className="text-sm font-medium">Đăng xuất</span>}
        </button>
      )}
    </div>
  )}
</aside>

  );
};

Sidebar.propTypes = {
  active: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  isOpen: PropTypes.bool,
  onToggle: PropTypes.func,
  items: PropTypes.array,
  onBack: PropTypes.func,
  onLogout: PropTypes.func,
  showBack: PropTypes.bool,
  showLogout: PropTypes.bool,
};

export default Sidebar;



