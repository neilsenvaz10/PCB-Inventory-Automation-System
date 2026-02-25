import React from "react";
import "../index.css";

export default function Also() {
  return (
    <div className="also-page">
      <header className="also-hero">
        <div className="container">
          <div className="hero-left">
            <div className="eyebrow">INDUSTRIAL AUTOMATION 4.0</div>
            <h1>Electrolyte Solutions Inventory System</h1>
            <p className="lead">
              Eliminate manual counting. Track every capacitor, resistor, and IC
              from production to board assembly in real-time with enterprise-
              grade precision.
            </p>
            <div className="hero-ctas">
              <button className="btn primary">Login to Dashboard</button>
              <button className="btn secondary">View System Features</button>
            </div>
            <div className="trust">
              Trusted by 200+ SMT assembly lines worldwide
            </div>
          </div>
          <div className="hero-right">
            <div className="mock-window" />
          </div>
        </div>
      </header>

      <section className="cost container">
        <h2>The Cost of Manual Tracking</h2>
        <div className="cards">
          <div className="card">
            <h3>Manual Tracking Errors</h3>
            <p>
              Human error in spreadsheets leads to inaccurate component counts,
              phantom inventory, and lost revenue through wasted stock.
            </p>
          </div>
          <div className="card">
            <h3>Lack of Visibility</h3>
            <p>
              Difficulty tracking component usage across multiple PCB revisions
              and production batches makes planning nearly impossible.
            </p>
          </div>
          <div className="card">
            <h3>Stock Shortages</h3>
            <p>
              Unexpected stockouts of critical ICs or passives halt production
              lines and lead to costly customer delivery delays.
            </p>
          </div>
        </div>
      </section>

      <section className="features container">
        <h2>Engineered for Production Efficiency</h2>
        <div className="feature-grid">
          <div className="feature">Automatic Stock Deduction</div>
          <div className="feature">PCB-to-Component Mapping</div>
          <div className="feature">Real-Time Monitoring</div>
          <div className="feature">Low Stock Alerts</div>
          <div className="feature">Operational Analytics</div>
          <div className="feature">ERP Integration</div>
        </div>
      </section>

      <section className="how container">
        <h2>How it Works</h2>
        <div className="steps">
          <div className="step">1 Define PCB Components</div>
          <div className="step">2 Record Production</div>
          <div className="step">3 Automatic Updates</div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <h2>Start Managing Inventory Efficiently</h2>
          <p>Join 500+ manufacturing engineers who have eliminated stockouts.</p>
          <div className="hero-ctas">
            <button className="btn primary">Access System</button>
            <button className="btn secondary">Speak with an Expert</button>
          </div>
        </div>
      </section>

      <footer className="page-footer container">
        <div className="footer-left">
          <strong>Electrolyte Solutions</strong>
          <p>The next generation of electronic component management.</p>
        </div>
        <div className="footer-links">
          <div>Product</div>
          <div>Solutions</div>
          <div>Support</div>
        </div>
      </footer>
    </div>
  );
}
