import React from 'react';

const DashboardHero = ({ title, subtitle, role, name, children }) => {
  const label = name || 'User';
  return (
    <section className="can-dash-hero">
      <div className="can-dash-hero-copy">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
        {children ? <div className="can-dash-hero-actions">{children}</div> : null}
      </div>
      <div className="can-dash-hero-user">
        <div className="can-dash-hero-meta">
          {role ? <span className="can-dash-role">{role}</span> : null}
          <div className="can-dash-welcome">Welcome back,</div>
          <div className="can-dash-name">{label}</div>
        </div>
        <div className="can-dash-avatar" aria-hidden="true">
          {label.charAt(0).toUpperCase()}
        </div>
      </div>
    </section>
  );
};

export default DashboardHero;
