import React from "react";
import { Link } from "react-router-dom";
import "../index.css";

/* ── icon helpers (inline SVG keeps the page self-contained) ── */
const Icon = ({ children, size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
    </svg>
);

const IconClipboard = () => <Icon><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></Icon>;
const IconEyeOff = () => <Icon><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></Icon>;
const IconAlertTri = () => <Icon><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Icon>;
const IconBox = () => <Icon><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></Icon>;
const IconGitBranch = () => <Icon><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 01-9 9" /></Icon>;
const IconActivity = () => <Icon><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></Icon>;
const IconBell = () => <Icon><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></Icon>;
const IconBarChart = () => <Icon><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></Icon>;
const IconLayers = () => <Icon><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></Icon>;
const IconArrowRight = () => <Icon size={16}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Icon>;

export default function Landing() {
    return (
        <div className="lp">
            {/* ━━━━━━━━━━━━ NAVBAR ━━━━━━━━━━━━ */}
            <nav className="lp-nav">
                <div className="lp-nav-inner">
                    <div className="lp-brand">
                        <div className="lp-logo-icon">▦</div>
                        <span className="lp-brand-name">Electrolyte Solutions</span>
                    </div>

                    <div className="lp-links">
                        <a href="#features">Products</a>
                        <a href="#how">Workflow</a>
                        <a href="#features">Solutions</a>
                        <a href="#cta">Pricing</a>
                    </div>

                    <div className="lp-nav-actions">
                        <Link to="/login" className="lp-login-link">Log in</Link>
                        <Link to="/register" className="lp-btn lp-btn-accent">Register</Link>
                    </div>
                </div>
            </nav>

            {/* ━━━━━━━━━━━━ HERO ━━━━━━━━━━━━ */}
            <header className="lp-hero">
                <div className="lp-hero-inner">
                    <div className="lp-hero-text">
                        <span className="lp-eyebrow">INDUSTRIAL AUTOMATION 4.0</span>
                        <h1>Automated PCB<br />Component<br />Inventory System</h1>
                        <p className="lp-hero-sub">
                            Eliminate manual counting. Track every capacitor, resistor, and IC
                            from production to board assembly in real-time with enterprise-grade precision.
                        </p>
                        <div className="lp-hero-ctas">
                            <Link to="/login" className="lp-btn lp-btn-primary">Login to Dashboard</Link>
                            <Link to="/register" className="lp-btn lp-btn-outline">Register</Link>
                        </div>
                        <div className="lp-trust">
                            <div className="lp-trust-avatars">
                                <span className="lp-avatar-sm" style={{ background: '#7c3aed' }}>P</span>
                                <span className="lp-avatar-sm" style={{ background: '#0ea5e9' }}>K</span>
                                <span className="lp-avatar-sm" style={{ background: '#f97316' }}>S</span>
                            </div>
                            <span className="lp-trust-text">Trusted by 200+ SMT assembly lines worldwide</span>
                        </div>
                    </div>

                    <div className="lp-hero-visual">
                        {/* Dashboard mock illustration */}
                        <div className="lp-mock">
                            <div className="lp-mock-topbar">
                                <div className="lp-mock-dots"><span /><span /><span /></div>
                                <div className="lp-mock-tabs"><span className="active" /><span /><span /></div>
                            </div>
                            <div className="lp-mock-body">
                                <div className="lp-mock-sidebar">
                                    <div className="lp-mock-line w60" /><div className="lp-mock-line w80" /><div className="lp-mock-line w50" /><div className="lp-mock-line w70" />
                                </div>
                                <div className="lp-mock-content">
                                    <div className="lp-mock-cards-row">
                                        <div className="lp-mock-minicard" /><div className="lp-mock-minicard" /><div className="lp-mock-minicard" />
                                    </div>
                                    <div className="lp-mock-chart">
                                        <div className="lp-mock-bar" style={{ height: '60%', background: '#f97316' }} />
                                        <div className="lp-mock-bar" style={{ height: '80%', background: '#0b5fff' }} />
                                        <div className="lp-mock-bar" style={{ height: '45%', background: '#f97316' }} />
                                        <div className="lp-mock-bar" style={{ height: '90%', background: '#0b5fff' }} />
                                        <div className="lp-mock-bar" style={{ height: '55%', background: '#f97316' }} />
                                        <div className="lp-mock-bar" style={{ height: '70%', background: '#0b5fff' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ━━━━━━━━━━━━ COST SECTION ━━━━━━━━━━━━ */}
            <section className="lp-section lp-cost">
                <div className="lp-container">
                    <h2 className="lp-section-title">The Cost of Manual Tracking</h2>
                    <div className="lp-cost-grid">
                        {[
                            { icon: <IconClipboard />, title: "Manual Tracking Errors", text: "Human error in spreadsheets leads to inaccurate component counts, phantom inventory, and lost revenue through wasted stock." },
                            { icon: <IconEyeOff />, title: "Lack of Visibility", text: "Difficulty tracking component usage across multiple PCB revisions and production batches makes planning nearly impossible." },
                            { icon: <IconAlertTri />, title: "Stock Shortages", text: "Unexpected stockouts of critical ICs or passives halt production lines and lead to costly customer delivery delays." },
                        ].map((c, i) => (
                            <div className="lp-cost-card" key={i}>
                                <div className="lp-cost-icon">{c.icon}</div>
                                <h3>{c.title}</h3>
                                <p>{c.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━ FEATURES ━━━━━━━━━━━━ */}
            <section className="lp-section lp-features" id="features">
                <div className="lp-container">
                    <div className="lp-features-header">
                        <div>
                            <h2 className="lp-section-title" style={{ textAlign: 'left' }}>Engineered for Production Efficiency</h2>
                            <p className="lp-muted">Our system bridges the gap between PCB design and warehouse management through seamless, real-time software integration.</p>
                        </div>
                        <a href="#features" className="lp-explore-link">EXPLORE ALL FEATURES <IconArrowRight /></a>
                    </div>
                    <div className="lp-feature-grid">
                        {[
                            { icon: <IconBox />, title: "Automatic Stock Deduction", text: "Components are automatically deducted as boards move through the pick, place and assembly process." },
                            { icon: <IconGitBranch />, title: "PCB-to-Component Mapping", text: "Link entire BOM tables to individual board revisions for perfect traceability and data accuracy." },
                            { icon: <IconActivity />, title: "Real-Time Monitoring", text: "Track actual production activity across 24/7 shifts with instant visibility across multiple facilities." },
                            { icon: <IconBell />, title: "Low Stock Alerts", text: "Smart thresholds triggered when components fall below minimum levels. Get notified before it's too late." },
                            { icon: <IconBarChart />, title: "Operational Analytics", text: "Data-driven insights into component burn rates, supplier performance, and overall workflow." },
                            { icon: <IconLayers />, title: "ERP Integration", text: "Two-way communication with existing ERP, MRP, and custom enterprise planning systems." },
                        ].map((f, i) => (
                            <div className="lp-feature-card" key={i}>
                                <div className="lp-feature-icon">{f.icon}</div>
                                <h4>{f.title}</h4>
                                <p>{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━ HOW IT WORKS ━━━━━━━━━━━━ */}
            <section className="lp-section lp-how" id="how">
                <div className="lp-container">
                    <h2 className="lp-section-title">How it Works</h2>
                    <p className="lp-muted" style={{ textAlign: 'center', maxWidth: 520, margin: '0 auto 40px' }}>
                        Seamlessly integrate automation into your existing production flow.
                    </p>
                    <div className="lp-steps">
                        {[
                            { num: "1", title: "Define PCB Components", text: "Upload your BOM or use our visual editor to automatically map components to existing warehouse locations." },
                            { num: "2", title: "Record Production", text: "As boards are produced, scan the order or BOM. Boards count every part used in each production run." },
                            { num: "3", title: "Automatic Updates", text: "Inventory levels are instantly recalculated and auto-generated reorder alerts for critical components." },
                        ].map((s, i) => (
                            <div className="lp-step" key={i}>
                                <div className="lp-step-num">{s.num}</div>
                                <h4>{s.title}</h4>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━ CTA BAND ━━━━━━━━━━━━ */}
            <section className="lp-cta" id="cta">
                <div className="lp-container lp-cta-inner">
                    <h2>Start Managing Inventory Efficiently</h2>
                    <p>Join 500+ manufacturing engineers who have eliminated stockouts and missed production tracking.</p>
                    <div className="lp-hero-ctas" style={{ justifyContent: 'center' }}>
                        <Link to="/login" className="lp-btn lp-btn-accent">Access System</Link>
                        <a href="#cta" className="lp-btn lp-btn-outline-light">Speak with an Expert</a>
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━ FOOTER ━━━━━━━━━━━━ */}
            <footer className="lp-footer">
                <div className="lp-container lp-footer-inner">
                    <div className="lp-footer-brand">
                        <div className="lp-footer-logo">
                            <span className="lp-logo-icon small">▦</span>
                            <strong>Electrolyte Solutions</strong>
                        </div>
                        <p>The next generation of electronic component management, built for engineers, by engineers.</p>
                        <div className="lp-social">
                            <a href="#!" aria-label="LinkedIn">in</a>
                            <a href="#!" aria-label="Twitter">𝕏</a>
                        </div>
                    </div>

                    <div className="lp-footer-col">
                        <h5>PRODUCT</h5>
                        <a href="#features">Dashboard</a>
                        <a href="#features">Asset Tracking</a>
                        <a href="#features">Integrations</a>
                        <a href="#features">API Docs</a>
                    </div>

                    <div className="lp-footer-col">
                        <h5>SOLUTIONS</h5>
                        <a href="#features">SMT Assembly</a>
                        <a href="#features">Manual SMD</a>
                        <a href="#features">R&D Labs</a>
                        <a href="#features">Quality Control</a>
                    </div>

                    <div className="lp-footer-col">
                        <h5>SUPPORT</h5>
                        <a href="#!">Documentation</a>
                        <a href="#!">Help Center</a>
                        <a href="#!">System Status</a>
                        <a href="#!">Contact Sales</a>
                    </div>
                </div>

                <div className="lp-container lp-footer-bottom">
                    <span>© 2026 Electrolyte Solutions. All rights reserved.</span>
                    <div>
                        <a href="#!">Privacy Policy</a>
                        <a href="#!">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
