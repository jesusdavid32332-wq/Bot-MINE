import React from 'react';

interface Icon3DProps {
  className?: string;
  size?: number;
}

// Reusable SVG Filter Definition for 3D Specular and Ambient Occlusion
export const Global3DDefs: React.FC = () => (
  <svg width="0" height="0" className="absolute -z-10 opacity-0 pointer-events-none">
    <defs>
      {/* Gold metallic gradient */}
      <linearGradient id="goldGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="25%" stopColor="#fbbf24" />
        <stop offset="65%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>

      {/* Gold highlight bevel */}
      <linearGradient id="goldBevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#fde68a" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#b45309" stopOpacity="0.9" />
      </linearGradient>

      {/* Cyber Cyan / Sapphire gradient */}
      <linearGradient id="cyanGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="30%" stopColor="#38bdf8" />
        <stop offset="70%" stopColor="#0284c7" />
        <stop offset="100%" stopColor="#0c4a6e" />
      </linearGradient>

      {/* Obsidian glass plate gradient */}
      <linearGradient id="obsidianGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" stopOpacity="0.95" />
        <stop offset="50%" stopColor="#0f172a" stopOpacity="0.98" />
        <stop offset="100%" stopColor="#020617" stopOpacity="1" />
      </linearGradient>

      {/* Emerald jewel gradient */}
      <linearGradient id="emeraldGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a7f3d0" />
        <stop offset="35%" stopColor="#34d399" />
        <stop offset="75%" stopColor="#059669" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>

      {/* Deep Violet / Royal Purple gradient */}
      <linearGradient id="purpleGrad3D" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e9d5ff" />
        <stop offset="35%" stopColor="#c084fc" />
        <stop offset="75%" stopColor="#7e22ce" />
        <stop offset="100%" stopColor="#3b0764" />
      </linearGradient>

      {/* 3D Soft Drop Shadow Filter */}
      <filter id="shadow3D" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
      </filter>
      <filter id="glowGold" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
  </svg>
);

// 1. DASHBOARD 3D ICON (Isometric multi-layer diamond grid with gold floating cubes)
export const DashboardIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    {/* Base Plate Shadow */}
    <ellipse cx="16" cy="27" rx="12" ry="4" fill="#000000" fillOpacity="0.4" />
    {/* Bottom Isometric Platform */}
    <path
      d="M16 19L27 13.5L16 8L5 13.5L16 19Z"
      fill="url(#obsidianGlass)"
      stroke="url(#cyanGrad3D)"
      strokeWidth="1.2"
    />
    <path
      d="M5 13.5V17L16 22.5V19L5 13.5Z"
      fill="#0f172a"
      stroke="#1e293b"
      strokeWidth="0.8"
    />
    <path
      d="M27 13.5V17L16 22.5V19L27 13.5Z"
      fill="#020617"
      stroke="#1e293b"
      strokeWidth="0.8"
    />
    {/* Floating Golden Diamond Block 1 */}
    <path
      d="M16 4L22 7L16 10L10 7L16 4Z"
      fill="url(#goldGrad3D)"
      filter="url(#shadow3D)"
    />
    <path d="M10 7V10.5L16 13.5V10L10 7Z" fill="#b45309" />
    <path d="M22 7V10.5L16 13.5V10L22 7Z" fill="#78350f" />
    {/* Top Highlight Shine */}
    <path d="M16 4.5L20.5 6.8L16 9L11.5 6.8L16 4.5Z" fill="#ffffff" fillOpacity="0.35" />
    {/* Mini Cyan Indicator Core */}
    <circle cx="16" cy="14" r="1.5" fill="#38bdf8" filter="url(#shadow3D)" />
  </svg>
);

// 2. MENSAJES AUTOMÁTICOS 3D ICON (Volumetric glowing speech bubble with golden reply wings)
export const MessagesIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    {/* Ambient shadow */}
    <ellipse cx="15" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Back volumetric glow */}
    <circle cx="17" cy="14" r="11" fill="url(#cyanGrad3D)" fillOpacity="0.15" />
    {/* Main 3D Bubble Body */}
    <path
      d="M6 8C6 5.23858 8.23858 3 11 3H22C24.7614 3 27 5.23858 27 8V18C27 20.7614 24.7614 23 22 23H13L7 28V22.5C6.38 21.8 6 20.9 6 20V8Z"
      fill="url(#obsidianGlass)"
      stroke="url(#cyanGrad3D)"
      strokeWidth="1.4"
      filter="url(#shadow3D)"
    />
    {/* Specular Highlight Arc */}
    <path
      d="M8.5 7C8.5 5.6 9.6 4.5 11 4.5H22C23.4 4.5 24.5 5.6 24.5 7V10C24.5 10 18 8 11 9C9 9.3 8.5 7.5 8.5 7Z"
      fill="#ffffff"
      fillOpacity="0.25"
    />
    {/* Gold Embossed Chat Lines */}
    <rect x="10" y="8" width="11" height="2.5" rx="1.25" fill="url(#goldGrad3D)" />
    <rect x="10" y="13" width="7" height="2.5" rx="1.25" fill="url(#goldGrad3D)" opacity="0.85" />
    {/* Interactive 3D Gold Action Dot */}
    <circle cx="21" cy="14.25" r="1.5" fill="url(#cyanGrad3D)" />
  </svg>
);

// 3. FLUJO DE CONVERSACIONES 3D ICON (Branching pipeline nodes with metallic connector cables)
export const FlowIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="11" ry="3.5" fill="#000000" fillOpacity="0.4" />
    {/* Volumetric Pipeline Tubes */}
    <path
      d="M16 11V16M16 16L9 21M16 16L23 21"
      stroke="url(#cyanGrad3D)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 11V16M16 16L9 21M16 16L23 21"
      stroke="#ffffff"
      strokeWidth="0.8"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />
    {/* Top Root Sphere (Gold) */}
    <circle cx="16" cy="7" r="5" fill="url(#goldGrad3D)" filter="url(#shadow3D)" />
    <circle cx="14.5" cy="5.5" r="1.8" fill="#ffffff" fillOpacity="0.6" />
    {/* Left Child Sphere (Cyan Glass) */}
    <circle cx="9" cy="22" r="4.5" fill="url(#cyanGrad3D)" filter="url(#shadow3D)" />
    <circle cx="7.8" cy="20.8" r="1.5" fill="#ffffff" fillOpacity="0.7" />
    {/* Right Child Sphere (Emerald Jewel) */}
    <circle cx="23" cy="22" r="4.5" fill="url(#emeraldGrad3D)" filter="url(#shadow3D)" />
    <circle cx="21.8" cy="20.8" r="1.5" fill="#ffffff" fillOpacity="0.7" />
  </svg>
);

// 4. SEGUIMIENTO DE IDs 3D ICON (3D Shield with Gold Keyhole & Security Bevel)
export const IdTrackingIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="28" rx="10" ry="3" fill="#000000" fillOpacity="0.5" />
    {/* 3D Shield Outer Shell */}
    <path
      d="M16 3L26 7.5V16C26 21.8 21.7 27 16 28.5C10.3 27 6 21.8 6 16V7.5L16 3Z"
      fill="url(#obsidianGlass)"
      stroke="url(#goldGrad3D)"
      strokeWidth="1.5"
      filter="url(#shadow3D)"
    />
    {/* Inner Shield Facet */}
    <path
      d="M16 5.5L23.5 9V15.5C23.5 20 20.3 24.2 16 25.5C11.7 24.2 8.5 20 8.5 15.5V9L16 5.5Z"
      fill="url(#cyanGrad3D)"
      fillOpacity="0.25"
      stroke="#38bdf8"
      strokeWidth="0.8"
    />
    {/* Specular Shield Gloss */}
    <path
      d="M16 5.5L23.5 9V15C23.5 16.5 22.8 18 21.5 19L16 5.5Z"
      fill="#ffffff"
      fillOpacity="0.18"
    />
    {/* Embossed ID Badge Plaque */}
    <rect x="11.5" y="11" width="9" height="7" rx="1.5" fill="url(#goldGrad3D)" filter="url(#shadow3D)" />
    <circle cx="16" cy="13.5" r="1.2" fill="#0f172a" />
    <path d="M14.5 16.5C14.5 15.8 15.2 15.3 16 15.3C16.8 15.3 17.5 15.8 17.5 16.5H14.5Z" fill="#0f172a" />
  </svg>
);

// 5. AUTOMATIZACIONES / CONDICIONES 3D ICON (Intermeshed gold gear with cyan circuit pulse)
export const AutomationsIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Large Beveled Gear */}
    <path
      d="M14 3H18L18.5 6.2C19.4 6.6 20.2 7.1 20.9 7.7L24 6.5L26.5 9.5L24.3 11.9C24.6 12.8 24.8 13.7 24.8 14.7L28 16V20L24.8 21.3C24.8 22.3 24.6 23.2 24.3 24.1L26.5 26.5L24 29.5L20.9 28.3C20.2 28.9 19.4 29.4 18.5 29.8L18 33H14L13.5 29.8C12.6 29.4 11.8 28.9 11.1 28.3L8 29.5L5.5 26.5L7.7 24.1C7.4 23.2 7.2 22.3 7.2 21.3L4 20V16L7.2 14.7C7.2 13.7 7.4 12.8 7.7 11.9L5.5 9.5L8 6.5L11.1 7.7C11.8 7.1 12.6 6.6 13.5 6.2L14 3Z"
      transform="scale(0.85) translate(3, 1)"
      fill="url(#obsidianGlass)"
      stroke="url(#goldGrad3D)"
      strokeWidth="1.4"
      filter="url(#shadow3D)"
    />
    {/* Specular Inner Ring */}
    <circle cx="16" cy="15.5" r="6" fill="url(#cyanGrad3D)" fillOpacity="0.2" stroke="url(#cyanGrad3D)" strokeWidth="1" />
    {/* Golden Center Core Bearing */}
    <circle cx="16" cy="15.5" r="3.2" fill="url(#goldGrad3D)" />
    <circle cx="15.2" cy="14.7" r="1.1" fill="#ffffff" fillOpacity="0.75" />
  </svg>
);

// 6. FOTOGRAFÍAS Y VÍDEOS 3D ICON (3D Camera Lens Prism with Optical Glass Reflection)
export const MediaIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="11" ry="3.5" fill="#000000" fillOpacity="0.4" />
    {/* 3D Camera Body */}
    <rect
      x="4"
      y="8"
      width="24"
      height="17"
      rx="4"
      fill="url(#obsidianGlass)"
      stroke="url(#cyanGrad3D)"
      strokeWidth="1.3"
      filter="url(#shadow3D)"
    />
    {/* Top Turret Prism / Flash */}
    <path d="M11 8L13 5H19L21 8H11Z" fill="#0f172a" stroke="url(#goldGrad3D)" strokeWidth="1" />
    <circle cx="23" cy="11.5" r="1.5" fill="url(#goldGrad3D)" />
    {/* Volumetric Refractive Lens Outer Ring */}
    <circle cx="16" cy="16.5" r="6.5" fill="#0b1324" stroke="url(#goldGrad3D)" strokeWidth="1.2" />
    {/* Optical Glass Deep Lens with Cyan gradient */}
    <circle cx="16" cy="16.5" r="4.5" fill="url(#cyanGrad3D)" />
    {/* Lens Flare / Specular Glint */}
    <path
      d="M14 13.5C15 13.2 16.5 13.5 17.5 14.5C18.2 15.2 18.5 16.2 18.5 17"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeOpacity="0.8"
    />
  </svg>
);

// 7. TUTORIALES 3D ICON (3D Graduation Cap with Gold Tassel & Floating Knowledge Hologram)
export const TutorialsIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* 3D Mortarboard Rhombus Top */}
    <path
      d="M16 6L28 11.5L16 17L4 11.5L16 6Z"
      fill="url(#obsidianGlass)"
      stroke="url(#goldGrad3D)"
      strokeWidth="1.3"
      filter="url(#shadow3D)"
    />
    {/* Top Specular Shine */}
    <path d="M16 7L24 10.7L16 14.5L8 10.7L16 7Z" fill="#ffffff" fillOpacity="0.12" />
    {/* Cap Skull Base */}
    <path
      d="M9 14.5V19C9 22.5 12.1 24.5 16 24.5C19.9 24.5 23 22.5 23 19V14.5L16 17.8L9 14.5Z"
      fill="url(#cyanGrad3D)"
      fillOpacity="0.3"
      stroke="#38bdf8"
      strokeWidth="0.8"
    />
    {/* Golden Tassel & Cord with Depth */}
    <path d="M16 11.5L25 15V22.5" stroke="url(#goldGrad3D)" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="25" cy="23.5" r="2" fill="url(#goldGrad3D)" />
  </svg>
);

// 8. USUARIOS 3D ICON (Dual Metallic Chrome/Gold Avatars with Volumetric Depth)
export const UsersIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="11" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Secondary Background User (Cyan glass) */}
    <circle cx="21" cy="10" r="3.5" fill="url(#cyanGrad3D)" fillOpacity="0.7" />
    <path
      d="M17 22C17 18.5 19 16.5 22.5 16.5C24.5 16.5 26.5 18 26.5 21"
      stroke="url(#cyanGrad3D)"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.8"
    />

    {/* Primary Foreground User Head (Golden Sphere) */}
    <circle cx="12" cy="10" r="4.5" fill="url(#goldGrad3D)" filter="url(#shadow3D)" />
    <circle cx="10.8" cy="8.6" r="1.5" fill="#ffffff" fillOpacity="0.65" />

    {/* Primary Foreground User Body (Volumetric Obsidian Coat) */}
    <path
      d="M5 24C5 19 8.2 16 12.5 16C16.8 16 20 19 20 24V25H5V24Z"
      fill="url(#obsidianGlass)"
      stroke="url(#goldGrad3D)"
      strokeWidth="1.3"
      filter="url(#shadow3D)"
    />
    {/* Chest Golden Lapel Highlight */}
    <path d="M12.5 16.5V21" stroke="url(#goldGrad3D)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 9. CONVERSACIONES 3D ICON (Dual Intersecting Speech Spheres with Glowing Pulse)
export const ConversationsIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Left Back Bubble (Cyan) */}
    <circle cx="13" cy="13" r="8" fill="url(#cyanGrad3D)" filter="url(#shadow3D)" />
    <circle cx="11" cy="10.5" r="2.5" fill="#ffffff" fillOpacity="0.5" />
    {/* Right Front Bubble (Gold Metallic) */}
    <circle cx="20" cy="17" r="7" fill="url(#goldGrad3D)" filter="url(#shadow3D)" />
    <circle cx="18" cy="14.8" r="2.2" fill="#ffffff" fillOpacity="0.7" />
    {/* 3 Dialogue dots inside front bubble */}
    <circle cx="17.5" cy="17" r="0.9" fill="#78350f" />
    <circle cx="20" cy="17" r="0.9" fill="#78350f" />
    <circle cx="22.5" cy="17" r="0.9" fill="#78350f" />
  </svg>
);

// 10. SOPORTE 3D ICON (3D Spherical Headset with Gold Arc & Sapphire Earcups)
export const SupportIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Center Support Orb */}
    <circle cx="16" cy="16" r="6" fill="url(#obsidianGlass)" stroke="url(#cyanGrad3D)" strokeWidth="1.2" />
    <path d="M14.5 13.5C14.5 12.5 15.2 11.8 16.2 11.8C17.2 11.8 17.8 12.5 17.8 13.5C17.8 15 16.2 15.5 16.2 16.8" stroke="url(#goldGrad3D)" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="16.2" cy="18.5" r="0.8" fill="url(#goldGrad3D)" />

    {/* 3D Headband Arc */}
    <path
      d="M7 16C7 10 11 6 16 6C21 6 25 10 25 16"
      stroke="url(#goldGrad3D)"
      strokeWidth="2.5"
      strokeLinecap="round"
      filter="url(#shadow3D)"
    />
    {/* Left Earcup */}
    <rect x="5" y="14" width="4" height="7" rx="2" fill="url(#cyanGrad3D)" filter="url(#shadow3D)" />
    {/* Right Earcup */}
    <rect x="23" y="14" width="4" height="7" rx="2" fill="url(#cyanGrad3D)" filter="url(#shadow3D)" />
  </svg>
);

// 11. ENLACES 3D ICON (Interlocked 3D Metallic Chain Rings with Specular Chrome Luster)
export const LinksIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Left Gold Ring Torus */}
    <path
      d="M15 10L11 6C8.8 3.8 5.2 3.8 3 6C0.8 8.2 0.8 11.8 3 14L7 18"
      stroke="url(#goldGrad3D)"
      strokeWidth="3.2"
      strokeLinecap="round"
      filter="url(#shadow3D)"
    />
    <path
      d="M15 10L11 6C8.8 3.8 5.2 3.8 3 6"
      stroke="#ffffff"
      strokeWidth="1"
      strokeLinecap="round"
      strokeOpacity="0.6"
    />

    {/* Right Cyan Ring Torus */}
    <path
      d="M17 22L21 26C23.2 28.2 26.8 28.2 29 26C31.2 23.8 31.2 20.2 29 18L25 14"
      stroke="url(#cyanGrad3D)"
      strokeWidth="3.2"
      strokeLinecap="round"
      filter="url(#shadow3D)"
    />

    {/* Center Locking Link Bar */}
    <path
      d="M11 21L21 11"
      stroke="url(#goldGrad3D)"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

// 12. CONFIGURACIÓN DEL BOT 3D ICON (Robotic Cylinder Head with Cyan Sensor & Gold Antennas)
export const BotConfigIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Antenna Beam */}
    <path d="M16 4V8" stroke="url(#goldGrad3D)" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="3.5" r="2" fill="url(#cyanGrad3D)" />
    {/* Robot Head Outer Helmet */}
    <rect
      x="6"
      y="8"
      width="20"
      height="17"
      rx="5"
      fill="url(#obsidianGlass)"
      stroke="url(#cyanGrad3D)"
      strokeWidth="1.4"
      filter="url(#shadow3D)"
    />
    {/* Visor Screen Glass */}
    <rect x="9" y="12" width="14" height="6" rx="3" fill="#060d1f" stroke="url(#goldGrad3D)" strokeWidth="0.8" />
    {/* Glowing Cyan Optic Sensors */}
    <circle cx="13" cy="15" r="1.8" fill="url(#cyanGrad3D)" />
    <circle cx="19" cy="15" r="1.8" fill="url(#cyanGrad3D)" />
    {/* Subtle Mouth Grille */}
    <line x1="12" y1="21" x2="20" y2="21" stroke="url(#goldGrad3D)" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 13. CONFIGURACIÓN GENERAL 3D ICON (Deep Knurled Master Gear with Central Gold Jewel)
export const GeneralConfigIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Outer 3D Cog Teeth Ring */}
    <circle
      cx="16"
      cy="16"
      r="11"
      fill="url(#obsidianGlass)"
      stroke="url(#goldGrad3D)"
      strokeWidth="2"
      strokeDasharray="4 2.5"
      filter="url(#shadow3D)"
    />
    {/* Recessed Middle Plate */}
    <circle cx="16" cy="16" r="7.5" fill="#0f172a" stroke="url(#cyanGrad3D)" strokeWidth="1" />
    {/* Core Golden Beveled Jewel */}
    <circle cx="16" cy="16" r="4" fill="url(#goldGrad3D)" filter="url(#shadow3D)" />
    <circle cx="14.8" cy="14.8" r="1.2" fill="#ffffff" fillOpacity="0.75" />
  </svg>
);

// 14. TELEGRAM MENÚ ADMIN 3D ICON (Telegram Jet / Paperplane in 3D Gold & Cyan Diamond)
export const TelegramAdminIcon3D: React.FC<Icon3DProps> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 overflow-visible transition-transform duration-200 group-hover:scale-105 ${className}`}
  >
    <ellipse cx="16" cy="27" rx="10" ry="3" fill="#000000" fillOpacity="0.4" />
    {/* Circular 3D Base Badge */}
    <circle cx="16" cy="15.5" r="12" fill="url(#obsidianGlass)" stroke="url(#cyanGrad3D)" strokeWidth="1.3" filter="url(#shadow3D)" />
    {/* 3D Paper Plane in Gold Gradient */}
    <path
      d="M9 15.5L23 9L19.5 22L15.5 17.5L9 15.5Z"
      fill="url(#goldGrad3D)"
      filter="url(#shadow3D)"
    />
    <path
      d="M15.5 17.5L14.5 21L17 19"
      fill="#b45309"
    />
    {/* Specular Plane Wing Shine */}
    <path
      d="M9.5 15.5L22.5 9.5L16 16.5L9.5 15.5Z"
      fill="#ffffff"
      fillOpacity="0.3"
    />
  </svg>
);
