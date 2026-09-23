import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useAppState } from '../../state/AppState';

// ── 20 MINE NODES distributed across the three levels ──────────────────────
const MINE_NODES = [
  // Surface nodes (y near 0) - Section A
  { id: 'N01', label: 'N01', x: -800, y:  -20, z: -500, zone: 'North Surface Sector A',  depth: 'Surface',   section: 'A' },
  { id: 'N02', label: 'N02', x: -400, y:  -15, z: -400, zone: 'West Surface Sector A',   depth: 'Surface',   section: 'A' },
  { id: 'N03', label: 'N03', x:    0, y:  -25, z: -100, zone: 'Central Surface Hub',     depth: 'Surface',   section: 'A' },
  { id: 'N04', label: 'N04', x:  400, y:  -18, z:  200, zone: 'East Surface Sector B',   depth: 'Surface',   section: 'B' },
  { id: 'N05', label: 'N05', x:  800, y:  -22, z:  400, zone: 'South Surface Sector B',  depth: 'Surface',   section: 'B' },

  // Mid-depth nodes (y = -120m) - Section A & B
  { id: 'N06', label: 'N06', x: -800, y: -120, z: -300, zone: 'North Panel Entrance',    depth: '~120m',    section: 'A' },
  { id: 'N07', label: 'N07', x: -600, y: -120, z:    0, zone: 'West Panel Corridor 1',   depth: '~120m',    section: 'A' },
  { id: 'N08', label: 'N08', x: -400, y: -120, z:  300, zone: 'West Panel Corridor 2',   depth: '~120m',    section: 'A' },
  { id: 'N09', label: 'N09', x: -200, y: -120, z: -300, zone: 'Central Panels Drift A',  depth: '~120m',    section: 'A' },
  { id: 'N10', label: 'N10', x:    0, y: -120, z:    0, zone: 'Central Shaft Crossing',  depth: '~120m',    section: 'B' },
  { id: 'N11', label: 'N11', x:  200, y: -120, z:  300, zone: 'East Panel Corridor 1',   depth: '~120m',    section: 'B' },
  { id: 'N12', label: 'N12', x:  400, y: -120, z: -300, zone: 'East Panel Corridor 2',   depth: '~120m',    section: 'B' },
  { id: 'N13', label: 'N13', x:  600, y: -120, z:    0, zone: 'East Heading Workings',   depth: '~120m',    section: 'B' },

  // Deep seam nodes (y = -180m) - Section C
  { id: 'N14', label: 'N14', x: -600, y: -180, z: -200, zone: 'Deep Seam — West Heading',     depth: '~180m',    section: 'C' },
  { id: 'N15', label: 'N15', x: -400, y: -180, z:  200, zone: 'Deep Seam — West Face Workings',depth: '~180m',    section: 'C' },
  { id: 'N16', label: 'N16', x: -200, y: -180, z: -200, zone: 'Deep Seam — Central Main',     depth: '~180m',    section: 'C' },
  { id: 'N17', label: 'N17', x:    0, y: -180, z:  200, zone: 'Deep Seam — Central Crossing', depth: '~180m',    section: 'C' },
  { id: 'N18', label: 'N18', x:  200, y: -180, z: -200, zone: 'Deep Seam — East Heading',     depth: '~180m',    section: 'C' },
  { id: 'N19', label: 'N19', x:  400, y: -180, z:  200, zone: 'Deep Seam — East Face Workings',depth: '~180m',    section: 'C' },
  { id: 'N20', label: 'N20', x:  600, y: -180, z:    0, zone: 'Deep Seam — South Working Face',depth: '~180m',    section: 'C' },
];

// Gateway on surface
const GATEWAY = { id: 'GW', x: 0, y: 0, z: 0 };

// Mesh connections (gateway hub + node-to-node links)
const CONNECTIONS = [
  // Surface to Gateway
  ['GW','N03'],
  ['N01','N02'], ['N02','N03'], ['N03','N04'], ['N04','N05'],
  // Shaft down links (surface to mid)
  ['N02','N07'], ['N03','N10'], ['N04','N12'],
  // Mid level panel connections
  ['N06','N07'], ['N07','N08'], ['N08','N11'], ['N09','N10'], ['N10','N11'], ['N11','N13'], ['N12','N13'],
  // Shaft down links (mid to deep)
  ['N07','N14'], ['N10','N17'], ['N13','N20'],
  // Deep level panel connections
  ['N14','N15'], ['N15','N16'], ['N16','N17'], ['N17','N18'], ['N18','N19'], ['N19','N20'],
];

// Color scheme per section
const SECTION_COLORS = {
  A: '#c2ab8f',  // ember
  B: '#38bdf8',  // sky blue
  C: '#a78bfa',  // purple deep
};

// Get node telemetry status (for color overrides)
function getNodeStatus(nodeId, telemetry) {
  const tNode = telemetry?.find(n => n.id === nodeId);
  return tNode?.status || 'NORMAL';
}

function statusColor(status) {
  if (status === 'CRITICAL') return '#f87171'; // neon red
  if (status === 'WATCH') return '#fbbf24';    // neon yellow
  return '#10b981'; // neon emerald
}

// Procedural Mine Tunnels Segment Generator
const MINE_TUNNELS = [];
// 1. Shafts (vertical cylinders)
MINE_TUNNELS.push([{ x: -600, y: 0, z: -400 }, { x: -600, y: -180, z: -400 }]);
MINE_TUNNELS.push([{ x: 0, y: 0, z: 0 }, { x: 0, y: -180, z: 0 }]);
MINE_TUNNELS.push([{ x: 600, y: 0, z: 400 }, { x: 600, y: -180, z: 400 }]);

// 2. Mid level corridors (y = -120)
for (let z of [-300, 0, 300]) {
  MINE_TUNNELS.push([{ x: -800, y: -120, z }, { x: 800, y: -120, z }]);
}
for (let x = -800; x <= 800; x += 200) {
  MINE_TUNNELS.push([{ x, y: -120, z: -300 }, { x, y: -120, z: 300 }]);
}
// Mid level panel extraction grids (dense parallel drifts)
for (let z of [-450, -420, -390, -360]) {
  MINE_TUNNELS.push([{ x: -600, y: -120, z }, { x: -200, y: -120, z }]);
}
for (let z of [330, 360, 390, 420]) {
  MINE_TUNNELS.push([{ x: 200, y: -120, z }, { x: 600, y: -120, z }]);
}

// 3. Deep level corridors (y = -180)
for (let z of [-200, 200]) {
  MINE_TUNNELS.push([{ x: -700, y: -180, z }, { x: 700, y: -180, z }]);
}
for (let x = -600; x <= 600; x += 200) {
  MINE_TUNNELS.push([{ x, y: -180, z: -200 }, { x, y: -180, z: 200 }]);
}
// Deep level panel grids
for (let z of [-100, -50, 0, 50, 100]) {
  MINE_TUNNELS.push([{ x: -500, y: -180, z }, { x: 100, y: -180, z }]);
  MINE_TUNNELS.push([{ x: 100, y: -180, z }, { x: 500, y: -180, z }]);
}

// 3D → 2D projection helpers with Panning support
function project(x, y, z, rotX, rotY, scale, cx, cy, panX = 0, panY = 0) {
  // Rotate around Y axis
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  // Rotate around X axis
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  // Perspective
  const fov = 900;
  const pz = z2 + fov;
  const sx = cx + (x1 * fov) / pz * scale + panX;
  const sy = cy + (y2 * fov) / pz * scale + panY;
  return { sx, sy, depth: pz };
}

function getNodeById(id) {
  if (id === 'GW') return GATEWAY;
  return MINE_NODES.find(n => n.id === id);
}

// Returns tunnel segments that are spatially associated with a given node
// A segment is "associated" when the node's (x,z) lies between (or near) the
// segment's two endpoints on the same depth plane (y tolerance ±80).
function getNodeTunnels(node) {
  const tol = 30; // tight: node must lie almost exactly on the segment
  return MINE_TUNNELS.filter(([p1, p2]) => {
    // Must be on a similar depth plane
    const yMid = (p1.y + p2.y) / 2;
    if (Math.abs(node.y - yMid) > 80) return false;

    // Point-to-segment distance in XZ plane
    const ax = p2.x - p1.x, az = p2.z - p1.z;
    const bx = node.x - p1.x, bz = node.z - p1.z;
    const lenSq = ax * ax + az * az;
    if (lenSq === 0) return false;
    const t = Math.max(0, Math.min(1, (bx * ax + bz * az) / lenSq));
    const closestX = p1.x + t * ax;
    const closestZ = p1.z + t * az;
    const dist = Math.sqrt((node.x - closestX) ** 2 + (node.z - closestZ) ** 2);
    return dist < tol;
  });
}


export default function MineMap() {
  const { isAnomaly, telemetry, groundCondition } = useAppState();

  // 3D canvas state
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const rotRef = useRef({ x: -0.45, y: 0.5 });
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ active: false, lastX: 0, lastY: 0 });
  const scaleRef = useRef(0.7);
  const autoRotRef = useRef(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [showCoverage, setShowCoverage] = useState(true);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const projCacheRef = useRef({});
  const tickRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const rotX = rotRef.current.x;
    const rotY = rotRef.current.y;
    const scale = scaleRef.current;
    const panX = panRef.current.x;
    const panY = panRef.current.y;

    tickRef.current += 0.012;
    const t = tickRef.current;

    // Dark Holographic Black Background
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, W, H);

    // Neon Cyan Holographic Grid Floor (Surface y=0)
    ctx.save();
    const gridSize = 300, gridCount = 8;
    for (let gi = -gridCount; gi <= gridCount; gi++) {
      for (let gj = -gridCount; gj <= gridCount; gj++) {
        const gx = gi * gridSize, gz = gj * gridSize;
        const p = project(gx, 0, gz, rotX, rotY, scale, cx, cy, panX, panY);
        if (gi < gridCount) {
          const p2 = project(gx + gridSize, 0, gz, rotX, rotY, scale, cx, cy, panX, panY);
          ctx.beginPath();
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(p2.sx, p2.sy);
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
        if (gj < gridCount) {
          const p3 = project(gx, 0, gz + gridSize, rotX, rotY, scale, cx, cy, panX, panY);
          ctx.beginPath();
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(p3.sx, p3.sy);
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // Ground level boundary ring (Holographic Cyan Glow)
    ctx.save();
    const ringPoints = 60;
    const ringR = 1300;
    ctx.beginPath();
    for (let ri = 0; ri < ringPoints; ri++) {
      const angle = (ri / ringPoints) * Math.PI * 2;
      const rx = Math.cos(angle) * ringR, rz = Math.sin(angle) * ringR;
      const rp = project(rx, 0, rz, rotX, rotY, scale, cx, cy, panX, panY);
      if (ri === 0) ctx.moveTo(rp.sx, rp.sy);
      else ctx.lineTo(rp.sx, rp.sy);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(34, 211, 238, ${0.12 + 0.04 * Math.sin(t)})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Depth planes (semi-transparent horizontal slabs)
    for (const [depth, opacity, color] of [[-120, 0.04, '56,189,248'], [-180, 0.03, '167,139,250']]) {
      ctx.save();
      ctx.beginPath();
      const pts = [[-1200, -1200], [1200, -1200], [1200, 1200], [-1200, 1200]];
      pts.forEach(([px, pz], pi) => {
        const pp = project(px, depth, pz, rotX, rotY, scale, cx, cy, panX, panY);
        if (pi === 0) ctx.moveTo(pp.sx, pp.sy);
        else ctx.lineTo(pp.sx, pp.sy);
      });
      ctx.closePath();
      ctx.fillStyle = `rgba(${color},${opacity})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${color},0.12)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
      ctx.restore();
    }

    // ── DRAW PROCEDURAL GLOWING MINE TUNNELS (Holographic Wireframes) ──
    ctx.save();
    MINE_TUNNELS.forEach(([p1, p2]) => {
      const proj1 = project(p1.x, p1.y, p1.z, rotX, rotY, scale, cx, cy, panX, panY);
      const proj2 = project(p2.x, p2.y, p2.z, rotX, rotY, scale, cx, cy, panX, panY);

      // Distinguish Completed Development vs Planned Panels
      const isMain = p1.y === -120 ? (p1.z === -300 || p1.z === 0 || p1.z === 300) : (p1.z === -200 || p1.z === 200);
      const isVertical = p1.x === p2.x && p1.z === p2.z;

      let glowColor = 'rgba(14, 165, 233, 0.07)'; // sky blue glow
      let coreColor = 'rgba(56, 189, 248, 0.35)';  // sky blue core

      if (isMain || isVertical) {
        // Main tunnels: Neon Cyan
        glowColor = 'rgba(34, 211, 238, 0.12)';
        coreColor = 'rgba(34, 211, 238, 0.6)';
      } else {
        // Auxiliary planned panels: Darker Blue
        glowColor = 'rgba(59, 130, 246, 0.05)';
        coreColor = 'rgba(59, 130, 246, 0.25)';
      }

      // Glow pass
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(proj1.sx, proj1.sy);
      ctx.lineTo(proj2.sx, proj2.sy);
      ctx.stroke();

      // Sharp Core pass
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(proj1.sx, proj1.sy);
      ctx.lineTo(proj2.sx, proj2.sy);
      ctx.stroke();
    });
    ctx.restore();

    // ── HOVER HIGHLIGHT: Glowing pipe segments for hovered node ──────────────
    if (hoveredNode) {
      const hStatus = getNodeStatus(hoveredNode.id, telemetry);
      const hColor = hStatus === 'CRITICAL' ? '248,113,113'
                   : hStatus === 'WATCH'    ? '251,191,36'
                   :                          '16,185,129'; // emerald green
      const highlightTunnels = getNodeTunnels(hoveredNode);

      highlightTunnels.forEach(([p1, p2]) => {
        const proj1 = project(p1.x, p1.y, p1.z, rotX, rotY, scale, cx, cy, panX, panY);
        const proj2 = project(p2.x, p2.y, p2.z, rotX, rotY, scale, cx, cy, panX, panY);

        ctx.save();

        // Outer wide glow
        ctx.beginPath();
        ctx.moveTo(proj1.sx, proj1.sy);
        ctx.lineTo(proj2.sx, proj2.sy);
        ctx.strokeStyle = `rgba(${hColor}, 0.18)`;
        ctx.lineWidth = 10;
        ctx.stroke();

        // Mid glow
        ctx.beginPath();
        ctx.moveTo(proj1.sx, proj1.sy);
        ctx.lineTo(proj2.sx, proj2.sy);
        ctx.strokeStyle = `rgba(${hColor}, 0.35)`;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Bright core line (the "pipe" itself)
        ctx.beginPath();
        ctx.moveTo(proj1.sx, proj1.sy);
        ctx.lineTo(proj2.sx, proj2.sy);
        ctx.strokeStyle = `rgba(${hColor}, 0.9)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const allPoints = { GW: project(GATEWAY.x, GATEWAY.y, GATEWAY.z, rotX, rotY, scale, cx, cy, panX, panY) };
    MINE_NODES.forEach(n => {
      allPoints[n.id] = project(n.x, n.y, n.z, rotX, rotY, scale, cx, cy, panX, panY);
    });
    projCacheRef.current = allPoints;

    // Draw active RF communication connections (animated dashed beams)
    CONNECTIONS.forEach(([a, b]) => {
      const pa = allPoints[a], pb = allPoints[b];
      if (!pa || !pb) return;
      ctx.save();
      const statusA = getNodeStatus(a, telemetry);
      const statusB = getNodeStatus(b, telemetry);
      const isAnomConn = statusA === 'CRITICAL' || statusB === 'CRITICAL';
      const dashOffset = -(t * 12) % 16;
      ctx.beginPath();
      ctx.moveTo(pa.sx, pa.sy);
      ctx.lineTo(pb.sx, pb.sy);
      ctx.setLineDash([5, 8]);
      ctx.lineDashOffset = dashOffset;
      ctx.strokeStyle = isAnomConn
        ? `rgba(248,113,113,${0.35 + 0.15 * Math.sin(t * 3)})`
        : 'rgba(34,211,238,0.18)';
      ctx.lineWidth = isAnomConn ? 1.4 : 0.8;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    });

    // Draw sensor coverage rings/ellipses projected in 3D
    if (showCoverage) {
      MINE_NODES.forEach(n => {
        const isHovered = hoveredNode?.id === n.id;
        const status = getNodeStatus(n.id, telemetry);
        const isCrit = status === 'CRITICAL';
        const isWatch = status === 'WATCH';
        const numPoints = 24;
        const R = isHovered ? 140 : 110;

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2;
          const px = n.x + Math.cos(angle) * R;
          const pz = n.z + Math.sin(angle) * R;
          const pProj = project(px, n.y, pz, rotX, rotY, scale, cx, cy, panX, panY);
          if (i === 0) ctx.moveTo(pProj.sx, pProj.sy);
          else ctx.lineTo(pProj.sx, pProj.sy);
        }
        ctx.closePath();

        const baseColor = isCrit ? '248,113,113' : isWatch ? '251,191,36' : '34,211,238';
        const fillOpacity = isHovered ? 0.08 : 0.02;
        const lineOpacity = isHovered ? 0.35 : 0.12;

        ctx.fillStyle = `rgba(${baseColor}, ${fillOpacity})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${baseColor}, ${lineOpacity})`;
        ctx.lineWidth = isHovered ? 1.2 : 0.6;
        ctx.setLineDash([3, 5]);
        ctx.stroke();
        ctx.restore();
      });
    }

    // Vertical structural depth dashed guides from node down to floor
    MINE_NODES.forEach(n => {
      const pDeep = allPoints[n.id];
      const pSurf = project(n.x, 0, n.z, rotX, rotY, scale, cx, cy, panX, panY);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pDeep.sx, pDeep.sy);
      ctx.lineTo(pSurf.sx, pSurf.sy);
      ctx.setLineDash([1, 5]);
      ctx.strokeStyle = 'rgba(56,189,248,0.12)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.restore();
    });

    // Draw Gateway unit (large hub center)
    const gp = allPoints['GW'];
    ctx.save();
    const gwPulse = 0.75 + 0.25 * Math.sin(t * 2);
    ctx.beginPath();
    ctx.arc(gp.sx, gp.sy, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#051820';
    ctx.fill();
    ctx.strokeStyle = `rgba(34,211,238,${gwPulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Pulse ring
    ctx.beginPath();
    ctx.arc(gp.sx, gp.sy, 18 + 4 * Math.sin(t), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(34,211,238,${0.2 * gwPulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GW', gp.sx, gp.sy);
    ctx.fillStyle = 'rgba(34,211,238,0.7)';
    ctx.font = '7px JetBrains Mono, monospace';
    ctx.fillText('Gateway', gp.sx, gp.sy + 18);
    ctx.restore();

    // Sort nodes by depth for painter's algorithm
    const sortedNodes = [...MINE_NODES].sort((a, b) => {
      const da = allPoints[a.id]?.depth ?? 0;
      const db = allPoints[b.id]?.depth ?? 0;
      return db - da;
    });

    // Draw sensor nodes
    sortedNodes.forEach(n => {
      const p = allPoints[n.id];
      const status = getNodeStatus(n.id, telemetry);
      const secColor = SECTION_COLORS[n.section];
      const sCol = statusColor(status);
      const isHovered = hoveredNode?.id === n.id;
      const isCrit = status === 'CRITICAL';

      const radius = isHovered ? 10 : 8;
      const pulse = isCrit ? (0.6 + 0.4 * Math.sin(t * 4)) : 1;

      ctx.save();

      // Glow halo on critical alert nodes
      if (isCrit) {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, radius + 6 + 3 * Math.sin(t * 4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(248,113,113,${0.15 * pulse})`;
        ctx.fill();
      }

      // Section colored backdrop halo
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, radius + 3, 0, Math.PI * 2);
      ctx.fillStyle = secColor + '18';
      ctx.fill();

      // Draw node spheres
      const grad = ctx.createRadialGradient(p.sx - 2, p.sy - 2, 0, p.sx, p.sy, radius);
      grad.addColorStop(0, isHovered ? '#ffffff' : '#e0f2fe');
      grad.addColorStop(1, n.section === 'C' ? '#1e1b4b' : n.section === 'B' ? '#0c1a24' : '#1c100b');
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = sCol;
      ctx.lineWidth = isCrit ? 2.0 * pulse : 1.2;
      ctx.stroke();

      // Top corner state dot
      ctx.beginPath();
      ctx.arc(p.sx + radius - 2, p.sy - radius + 2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = sCol;
      ctx.fill();

      // Label text
      ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(224,242,254,0.9)';
      ctx.font = `bold 7px JetBrains Mono, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.id.replace('N', ''), p.sx, p.sy);

      // Section identifier indicator
      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '6px JetBrains Mono, monospace';
      ctx.fillText(`§${n.section}`, p.sx, p.sy + radius + 8);

      ctx.restore();
    });

    // Holographic pointer cards for top nodes (e.g. N01, N03, N05)
    [MINE_NODES[0], MINE_NODES[2], MINE_NODES[4]].forEach((n, i) => {
      const p = allPoints[n.id];
      if (!p) return;
      const offX = i === 0 ? -70 : i === 1 ? 0 : 70;
      const offY = -45;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p.sx, p.sy);
      ctx.lineTo(p.sx + offX * 0.5, p.sy + offY * 0.6);
      ctx.lineTo(p.sx + offX, p.sy + offY);
      ctx.strokeStyle = 'rgba(34,211,238,0.22)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      const lw = 70;
      ctx.fillStyle = 'rgba(5,7,12,0.9)';
      ctx.strokeStyle = 'rgba(34,211,238,0.3)';
      ctx.lineWidth = 0.8;
      roundRect(ctx, p.sx + offX - lw / 2, p.sy + offY - 16, lw, 16, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 7px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(n.id + ' · ' + n.depth, p.sx + offX, p.sy + offY - 6);
      ctx.restore();
    });

    // Render 3D Legend panel overlay (bottom-left)
    ctx.save();
    ctx.fillStyle = 'rgba(5,7,12,0.85)';
    roundRect(ctx, 10, H - 100, 195, 90, 4);
    ctx.fill();
    ctx.strokeStyle = 'rgba(34,211,238,0.18)';
    ctx.lineWidth = 0.8;
    roundRect(ctx, 10, H - 100, 195, 90, 4);
    ctx.stroke();
    ctx.font = '7px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    [
      ['#c2ab8f', 'Section A — Surface Monitor (Orange)'],
      ['#38bdf8', 'Section B — Mid Level ~120m (Sky)'],
      ['#a78bfa', 'Section C — Deep Seam ~180m (Purple)'],
      ['#10b981', 'Status: NOMINAL / SAFE'],
      ['#fbbf24', 'Status: WATCHING Precursor'],
      ['#f87171', 'Status: BREACH / CRITICAL'],
    ].forEach(([col, lbl], li) => {
      ctx.beginPath();
      ctx.arc(20, H - 88 + li * 13, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.fillStyle = 'rgba(148,163,184,0.8)';
      ctx.fillText(lbl, 30, H - 85 + li * 13);
    });
    ctx.restore();

    // Stats panel (top-right overlay)
    ctx.save();
    const statsLines = [
      `NODES: 20 / 20 ACTIVE`,
      `DEPTH SEAMS: Jharia-I / II`,
      `DEFORMATION SPAN: ~2.4 km`,
      `GRID MODE: ISOMETRIC HOLOGRAPHIC`,
    ];
    ctx.font = '7.5px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    statsLines.forEach((s, si) => {
      ctx.fillStyle = 'rgba(34,211,238,0.5)';
      ctx.fillText(s, W - 12, 50 + si * 12);
    });
    ctx.restore();

    animFrameRef.current = requestAnimationFrame(draw);
  }, [telemetry, hoveredNode, showCoverage]);

  // Handle auto-rotate triggers
  useEffect(() => {
    const autoId = setInterval(() => {
      if (autoRotRef.current && !dragRef.current.active) {
        rotRef.current.y += 0.0025;
      }
    }, 16);
    return () => clearInterval(autoId);
  }, []);

  // Run render loop
  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Handle canvas sizing dynamically
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = 480;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, []);

  // Drag interaction handler (Left: Rotate, Shift/Right-click: Pan)
  const onMouseDown = (e) => {
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    autoRotRef.current = false;
  };

  const onMouseMove = (e) => {
    if (dragRef.current.active) {
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;

      // Shift key or right click handles camera panning
      if (e.shiftKey || e.button === 2 || e.buttons === 2) {
        panRef.current.x += dx;
        panRef.current.y += dy;
      } else {
        // Standard rotation
        rotRef.current.y += dx * 0.007;
        rotRef.current.x += dy * 0.007;
      }

      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
    }

    // Interactive tooltip hit test
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found = null;
    MINE_NODES.forEach(n => {
      const p = projCacheRef.current[n.id];
      if (!p) return;
      const dist = Math.sqrt((mx - p.sx) ** 2 + (my - p.sy) ** 2);
      if (dist < 14) found = n;
    });
    setHoveredNode(found);
    if (found) setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const onMouseUp = () => { dragRef.current.active = false; };
  const onWheel = (e) => {
    e.preventDefault();
    scaleRef.current = Math.max(0.3, Math.min(1.8, scaleRef.current - e.deltaY * 0.0006));
    autoRotRef.current = false;
  };

  // Touch triggers
  const onTouchStart = (e) => {
    const t = e.touches[0];
    dragRef.current = { active: true, lastX: t.clientX, lastY: t.clientY };
    autoRotRef.current = false;
  };
  const onTouchMove = (e) => {
    if (!dragRef.current.active) return;
    const t = e.touches[0];
    const dx = t.clientX - dragRef.current.lastX;
    const dy = t.clientY - dragRef.current.lastY;
    rotRef.current.y += dx * 0.007;
    rotRef.current.x += dy * 0.007;
    dragRef.current.lastX = t.clientX;
    dragRef.current.lastY = t.clientY;
  };
  const onTouchEnd = () => { dragRef.current.active = false; };

  // Calculate 2D dynamic paths for SVG
  const rfConnections2D = useMemo(() => {
    return CONNECTIONS.map(([a, b], idx) => {
      const nodeA = a === 'GW' ? GATEWAY : MINE_NODES.find(n => n.id === a);
      const nodeB = b === 'GW' ? GATEWAY : MINE_NODES.find(n => n.id === b);
      if (!nodeA || !nodeB) return null;

      // Map node 3D coordinates to SVG viewBox 800 x 520
      const ax = 400 + (nodeA.x / 1000) * 330;
      const ay = 260 + (nodeA.z / 800) * 200;
      const bx = 400 + (nodeB.x / 1000) * 330;
      const by = 260 + (nodeB.z / 800) * 200;

      const statusA = getNodeStatus(a, telemetry);
      const statusB = getNodeStatus(b, telemetry);
      const isCrit = statusA === 'CRITICAL' || statusB === 'CRITICAL';

      return (
        <line
          key={idx}
          x1={ax}
          y1={ay}
          x2={bx}
          y2={by}
          stroke={isCrit ? 'rgba(248,113,113,0.45)' : 'rgba(34,211,238,0.12)'}
          strokeWidth={isCrit ? 1.5 : 0.8}
          strokeDasharray={isCrit ? '3,3' : '4,5'}
        />
      );
    });
  }, [telemetry]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── 3D HOLOGRAPHIC MINE MODEL ────────────────────────────────── */}
      <div className="holo-panel" style={{ padding: 0, border: '1px solid rgba(34,211,238,0.18)' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(34,211,238,0.15)',
          background: '#040409',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#22d3ee', fontFamily: 'var(--mono)' }}>
              ⬢ 3D GEOTECHNICAL HOLOGRAM — Volume Seam Mesh
            </div>
            <div style={{ fontSize: 10, color: 'rgba(148,163,184,0.6)', fontFamily: 'var(--mono)', marginTop: 2 }}>
              Interactive · 20 Active Sensors · 3 Depth Seams · {isAnomaly ? '⚠ MULTI-NODE TELEMETRY WARNING' : '● Core Structural Safety Nominal'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              style={{
                fontSize: 9, fontFamily: 'var(--mono)',
                color: showCoverage ? '#22d3ee' : 'rgba(148,163,184,0.6)',
                background: showCoverage ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${showCoverage ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.08)'}`,
                padding: '4px 8px', borderRadius: 4, cursor: 'pointer'
              }}
              onClick={() => { setShowCoverage(!showCoverage); }}
            >
              {showCoverage ? 'COVERAGE: ON' : 'COVERAGE: OFF'}
            </button>
            <button
              style={{
                fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(34,211,238,0.7)',
                background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
                padding: '4px 8px', borderRadius: 4, cursor: 'pointer'
              }}
              onClick={() => { autoRotRef.current = !autoRotRef.current; }}
            >
              AUTO-ROTATE
            </button>
            <button
              style={{
                fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(34,211,238,0.7)',
                background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
                padding: '4px 8px', borderRadius: 4, cursor: 'pointer'
              }}
              onClick={() => { scaleRef.current += 0.15; }}
            >
              + ZOOM
            </button>
            <button
              style={{
                fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(34,211,238,0.7)',
                background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
                padding: '4px 8px', borderRadius: 4, cursor: 'pointer'
              }}
              onClick={() => { scaleRef.current = Math.max(0.3, scaleRef.current - 0.15); }}
            >
              − ZOOM
            </button>
            <button
              style={{
                fontSize: 9, fontFamily: 'var(--mono)', color: 'rgba(34,211,238,0.7)',
                background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
                padding: '4px 8px', borderRadius: 4, cursor: 'pointer'
              }}
              onClick={() => { rotRef.current = { x: -0.45, y: 0.5 }; scaleRef.current = 0.7; panRef.current = { x:0, y:0 }; }}
            >
              RESET
            </button>
          </div>
        </div>

        <div className="mine-3d-container" style={{ borderRadius: 0, background: '#020205', border: 'none' }} onContextMenu={(e)=>e.preventDefault()}>
          <canvas
            ref={canvasRef}
            className="mine-3d-canvas"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          />
          {/* Instructions Overlay */}
          <div className="mine-3d-overlay" style={{ color: 'rgba(34,211,238,0.5)' }}>
            DRAG TO ROTATE · SHIFT+DRAG TO PAN · SCROLL TO ZOOM · HOVER NODE TO INSPECT
          </div>

          {/* Node detailed Tooltip */}
          {hoveredNode && (
            <div
              className="mine-node-tooltip"
              style={{
                left: tooltipPos.x, top: tooltipPos.y,
                background: 'rgba(4,6,12,0.96)',
                border: '1px solid rgba(34,211,238,0.4)',
                boxShadow: '0 0 10px rgba(34,211,238,0.15)',
              }}
            >
              <div style={{ color: '#22d3ee', fontWeight: 700, marginBottom: 4 }}>
                {hoveredNode.id} — {hoveredNode.zone}
              </div>
              <div>Layer Depth: {hoveredNode.depth}</div>
              <div>Section: Sector {hoveredNode.section}</div>
              <div>Status: {getNodeStatus(hoveredNode.id, telemetry)}</div>
              <div style={{ color: statusColor(getNodeStatus(hoveredNode.id, telemetry)), fontWeight: 700, marginTop: 4 }}>
                ● {getNodeStatus(hoveredNode.id, telemetry)}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic scrollable sensor list panel */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(34,211,238,0.12)',
          background: '#040409',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          maxHeight: '140px',
          overflowY: 'auto',
        }}>
          {MINE_NODES.map(n => {
            const status = getNodeStatus(n.id, telemetry);
            const secColor = SECTION_COLORS[n.section];
            const isHovered = hoveredNode?.id === n.id;
            return (
              <div
                key={n.id}
                onMouseEnter={() => setHoveredNode(n)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  background: isHovered ? 'rgba(34,211,238,0.08)' : 'rgba(34,211,238,0.02)',
                  border: `1px solid ${isHovered ? 'rgba(34,211,238,0.4)' : status === 'CRITICAL' ? 'rgba(248,113,113,0.3)' : status === 'WATCH' ? 'rgba(251,191,36,0.25)' : 'rgba(34,211,238,0.1)'}`,
                  borderRadius: 4, padding: '5px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'var(--mono)', color: secColor }}>
                    {n.id}
                  </span>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: statusColor(status), display: 'inline-block',
                    boxShadow: status === 'CRITICAL' ? `0 0 5px ${statusColor(status)}` : 'none'
                  }} />
                </div>
                <div style={{ fontSize: 7.5, color: 'rgba(148,163,184,0.6)', fontFamily: 'var(--mono)' }}>
                  {n.depth}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2D MAP + INFO ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16 }}>
        {/* Map */}
        <div className="panel" style={{ border: '1px solid rgba(34,211,238,0.12)', background: '#020205' }}>
          <div className="flex-between mb-16">
            <div>
              <div className="panel-title" style={{ color: '#e2e8f0' }}>West Bokaro Coalfield — Dynamic Panel Map (2D Grid)</div>
              <div className="panel-desc" style={{ color: 'rgba(148,163,184,0.6)' }}>Geotechnical sensor coverage overlays · Active working levels</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#22d3ee', background: 'rgba(34,211,238,0.06)', padding: '3px 8px', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 3 }}>DYNAMIC COORDINATES</span>
              {isAnomaly && <span style={{ fontSize: 10, fontFamily: 'var(--mono)', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '3px 8px', borderRadius: 3, fontWeight: 700 }}>HAZARD DETECTED</span>}
            </div>
          </div>

          <div className="map-wrapper" style={{ border: '1px solid rgba(34,211,238,0.08)' }}>
            <svg viewBox="0 0 800 520" className="map-svg">
              <defs>
                <pattern id="cyanGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(34,211,238,0.03)" strokeWidth="1" />
                </pattern>
                {isAnomaly && (
                  <>
                    <radialGradient id="heatWide" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="heatCore" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                    </radialGradient>
                  </>
                )}
              </defs>

              {/* Background */}
              <rect width="800" height="520" fill="#020205" />
              <rect width="800" height="520" fill="url(#cyanGrid)" />

              <text x="14" y="18" style={{ fontSize: 9, fontFamily: 'var(--mono)', fill: 'rgba(34,211,238,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SENSOR COVERAGE PLOTS — WEST BOKARO COALFIELD</text>
              <text x="14" y="510" style={{ fontSize: 9, fontFamily: 'var(--mono)', fill: 'rgba(148,163,184,0.3)' }}>Dynamic projection maps · Seam Seam Coordinates · STRATA Technologies</text>

              {/* Compass */}
              <g transform="translate(750,50)">
                <circle r="18" fill="rgba(4,6,12,0.9)" stroke="rgba(34,211,238,0.25)" strokeWidth="1.5" />
                <text x="0" y="-6" textAnchor="middle" style={{ fontSize: 10, fontFamily: 'var(--mono)', fill: '#22d3ee', fontWeight: 'bold' }}>N</text>
                <line x1="0" y1="-15" x2="0" y2="-6" stroke="#22d3ee" strokeWidth="1.5" />
              </g>

              {/* Panel outlines (Seam boundaries) */}
              <g fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="1.2">
                <rect x="60" y="60" width="300" height="160" />
                <rect x="420" y="60" width="310" height="160" />
                <rect x="60" y="260" width="670" height="200" />
              </g>

              <text x="72" y="82" style={{ fontSize: 10, fontFamily: 'var(--mono)', fill: 'rgba(251,146,60,0.5)' }}>SECTOR A (NORTH SURFACE MONITORS)</text>
              <text x="432" y="82" style={{ fontSize: 10, fontFamily: 'var(--mono)', fill: 'rgba(56,189,248,0.5)' }}>SECTOR B (MID LEVEL WORKINGS)</text>
              <text x="72" y="280" style={{ fontSize: 10, fontFamily: 'var(--mono)', fill: 'rgba(167,139,250,0.5)' }}>SECTOR C (DEEP SEAM PILLARS)</text>

              {/* Anomaly heat contour */}
              {isAnomaly && (
                <g>
                  {/* Contour around N02 (West Surface Sector A) */}
                  <ellipse cx="270" cy="180" rx="90" ry="60" fill="url(#heatWide)" />
                  <ellipse cx="270" cy="180" rx="45" ry="30" fill="url(#heatCore)" />
                  {/* Contour around N08 (Mid Level) */}
                  <ellipse cx="270" cy="335" rx="90" ry="60" fill="url(#heatWide)" />
                  <ellipse cx="270" cy="335" rx="45" ry="30" fill="url(#heatCore)" />
                  <text x="72" y="440" style={{ fontSize: 10, fontFamily: 'var(--mono)', fill: '#f87171', fontWeight: 'bold' }}>⚠ GEOTECHNICAL STRAIN Breach Contours Detected</text>
                </g>
              )}

              {/* RF Connections */}
              {rfConnections2D}

              {/* Gateway in 2D */}
              <g transform="translate(400, 260)">
                <rect x="-12" y="-9" width="24" height="18" rx="2" fill="#04060c" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" />
                <text y="3" textAnchor="middle" style={{ fontSize: 7.5, fill: '#22d3ee', fontFamily: 'var(--mono)', fontWeight: 'bold' }}>GW</text>
              </g>

              {/* Render dynamic coordinates nodes */}
              {telemetry.map(n => {
                const mn = MINE_NODES.find(node => node.id === n.id);
                if (!mn) return null;
                const svgX = 400 + (mn.x / 1000) * 330;
                const svgY = 260 + (mn.z / 800) * 200;
                const isCrit = n.status === 'CRITICAL';
                const isWatch = n.status === 'WATCH';
                const col = isCrit ? 'var(--red)' : isWatch ? 'var(--yellow)' : 'var(--green)';

                return (
                  <g key={n.id} transform={`translate(${svgX}, ${svgY})`}>
                    {/* Coverage Radius indicators */}
                    <circle r="30" fill="none" stroke={col} strokeWidth="0.6" strokeDasharray="2,3" opacity="0.25" />
                    {isCrit && <circle r="45" fill="none" stroke="var(--red)" strokeWidth="1" strokeDasharray="2,2" opacity="0.5" />}

                    {/* Sensor dot */}
                    <circle r="6" fill="#04060c" stroke={col} strokeWidth="1.5" />
                    <text y="2" textAnchor="middle" style={{ fontSize: 6, fill: 'white', fontFamily: 'var(--mono)', fontWeight: 'bold' }}>
                      {mn.id.replace('N', '')}
                    </text>
                  </g>
                );
              })}

              {/* Scale indicator */}
              <g transform="translate(600,490)">
                <line x1="0" y1="0" x2="80" y2="0" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
                <line x1="0" y1="-5" x2="0" y2="5" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
                <line x1="80" y1="-5" x2="80" y2="5" stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" />
                <text x="40" y="-8" textAnchor="middle" style={{ fontSize: 8, fontFamily: 'var(--mono)', fill: 'rgba(148,163,184,0.4)' }}>~500 m (scale)</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Legend & info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="panel" style={{ border: '1px solid rgba(34,211,238,0.12)', background: '#020205' }}>
            <div className="panel-title" style={{ marginBottom: 14, color: '#e2e8f0' }}>Sensor Legend</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { shape: 'rect', color: 'rgba(34,211,238,0.8)', label: 'LoRa Base Gateway' },
                { shape: 'circle', color: 'var(--green)', label: 'Node — Safe / Active' },
                { shape: 'circle', color: 'var(--yellow)', label: 'Node — Alert Watch' },
                { shape: 'circle', color: 'var(--red)', label: 'Node — Critical Stress' },
                { shape: 'line', color: 'rgba(34,211,238,0.4)', label: 'RF Signal Link' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                  {item.shape === 'rect' && <span style={{ width: 15, height: 12, background: item.color, display: 'inline-block', borderRadius: 2, flexShrink: 0 }} />}
                  {item.shape === 'circle' && <span style={{ width: 12, height: 12, background: item.color, borderRadius: '50%', display: 'inline-block', border: '1.5px solid rgba(34,211,238,0.3)', flexShrink: 0 }} />}
                  {item.shape === 'line' && <span style={{ width: 15, height: 2, display: 'inline-block', flexShrink: 0, borderTop: '1.5px dashed rgba(34,211,238,0.4)' }} />}
                  <span style={{ color: 'rgba(148,163,184,0.8)', fontFamily: 'var(--mono)', fontSize: 10.5 }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ border: '1px solid rgba(34,211,238,0.12)', background: '#020205' }}>
            <div className="panel-title" style={{ marginBottom: 12, color: '#e2e8f0' }}>Panel Infrastructure</div>
            {[
              { label: 'Mining Site', value: 'West Bokaro, Seam II' },
              { label: 'Layer Depth', value: '0 – 180 m bgl' },
              { label: 'Total Nodes', value: '20 Active Mesh' },
              { label: 'Panel Area', value: '~2.4 km Span' },
              { label: 'System Health', value: '98.9% NOMINAL' },
              { label: 'RF Band', value: 'LoRa 433 MHz' },
              { label: 'Breach Status', value: isAnomaly ? 'WARNING ACTIVE' : 'NOMINAL', hi: isAnomaly },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, paddingBottom: 7, marginBottom: 7, borderBottom: '1px solid rgba(34,211,238,0.08)' }}>
                <span style={{ color: 'rgba(148,163,184,0.6)', fontFamily: 'var(--mono)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: r.hi ? 'var(--red)' : '#f8fafc' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div className="panel" style={{ border: '1px solid rgba(34,211,238,0.12)', background: '#020205' }}>
            <div className="panel-title" style={{ marginBottom: 10, color: '#e2e8f0' }}>Subsidence Indicators</div>
            {[{ label: 'N02 Surface Tilt', val: `${telemetry[1].tilt.toFixed(2)}°`, warn: isAnomaly }, { label: 'N08 Seam Strain', val: `${telemetry[7].strain.toFixed(2)}%`, warn: isAnomaly }, { label: 'Active Alerts', val: isAnomaly ? '3 ALARMS' : '0 ACTIVE', warn: isAnomaly }].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 8 }}>
                <span style={{ color: 'rgba(148,163,184,0.6)', fontFamily: 'var(--mono)' }}>{r.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: r.warn ? 'var(--red)' : '#10b981' }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Canvas round-rectangle helper ──────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
