import React from "react";

export default function Card({ title, value, children, className = "" }) {
  return (
    <div className={`card ${className}`}>
      <div className="card-header">
        <h4>{title}</h4>
      </div>
      <div className="card-body">
        {value !== undefined && <div className="card-value">{value}</div>}
        {children}
      </div>
    </div>
  );
}
