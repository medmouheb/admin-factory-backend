const { createCanvas } = require("@napi-rs/canvas");

/**
 * Helper to round rectangles on canvas
 */
function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/**
 * Chart 1: Répartition de la production par Shift (Matin, Après-midi, Nuit)
 */
function generateShiftChart(shifts, dateStr) {
  const width = 900;
  const height = 440;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Header Banner
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#4C1D95");
  gradient.addColorStop(1, "#7C3AED");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 60);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("RÉPARTITION DE LA PRODUCTION PAR SHIFT", 24, 37);

  ctx.fillStyle = "#E9D5FF";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Date : ${dateStr}`, width - 24, 37);

  // Plot Area
  const chartX = 85;
  const chartY = 95;
  const chartW = width - 130;
  const chartH = height - 170;

  const totalCodesAll = shifts.reduce((acc, s) => acc + (s.tcodes || 0), 0) || 1;
  const maxVal = Math.max(
    ...shifts.map((s) => Math.max(s.tcodes || 0, s.hu || 0)),
    10
  );
  const step = Math.ceil(maxVal / 5);
  const yMax = Math.max(step * 5, 10);

  // Grid lines
  ctx.strokeStyle = "#F1F5F9";
  ctx.lineWidth = 1;
  ctx.font = "12px Arial, sans-serif";
  ctx.fillStyle = "#64748B";
  ctx.textAlign = "right";

  for (let i = 0; i <= 5; i++) {
    const val = (yMax / 5) * i;
    const y = chartY + chartH - i * (chartH / 5);
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartW, y);
    ctx.stroke();
    ctx.fillText(String(Math.round(val)), chartX - 12, y + 4);
  }

  // Draw Bars
  const groupWidth = chartW / shifts.length;
  const barWidth = 48;
  const gap = 14;

  shifts.forEach((s, idx) => {
    const groupCenterX = chartX + idx * groupWidth + groupWidth / 2;
    const tcodeX = groupCenterX - barWidth - gap / 2;
    const huX = groupCenterX + gap / 2;

    const tcodeH = Math.max(4, ((s.tcodes || 0) / yMax) * chartH);
    const huH = Math.max(4, ((s.hu || 0) / yMax) * chartH);

    // T-Codes Bar (Purple gradient)
    const gT = ctx.createLinearGradient(0, chartY + chartH - tcodeH, 0, chartY + chartH);
    gT.addColorStop(0, "#8B5CF6");
    gT.addColorStop(1, "#6D28D9");
    ctx.fillStyle = gT;
    roundRect(ctx, tcodeX, chartY + chartH - tcodeH, barWidth, tcodeH, 6);
    ctx.fill();

    // Value above T-Codes
    ctx.fillStyle = "#4C1D95";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(s.tcodes || 0), tcodeX + barWidth / 2, chartY + chartH - tcodeH - 8);

    // HU Bar (Emerald gradient)
    const gH = ctx.createLinearGradient(0, chartY + chartH - huH, 0, chartY + chartH);
    gH.addColorStop(0, "#10B981");
    gH.addColorStop(1, "#059669");
    ctx.fillStyle = gH;
    roundRect(ctx, huX, chartY + chartH - huH, barWidth, huH, 6);
    ctx.fill();

    // Value above HU
    ctx.fillStyle = "#065F46";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(s.hu || 0), huX + barWidth / 2, chartY + chartH - huH - 8);

    // Shift Label & Subtitle
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 14px Arial, sans-serif";
    ctx.fillText(s.name, groupCenterX, chartY + chartH + 24);

    ctx.fillStyle = "#64748B";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(s.hours || "", groupCenterX, chartY + chartH + 40);

    // Percentage badge
    const pct = Math.round(((s.tcodes || 0) / totalCodesAll) * 100);
    ctx.fillStyle = "#EDE9FE";
    roundRect(ctx, groupCenterX - 30, chartY + chartH + 48, 60, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#6D28D9";
    ctx.font = "bold 11px Arial, sans-serif";
    ctx.fillText(`${pct}% prod`, groupCenterX, chartY + chartH + 62);
  });

  // Legend at bottom
  const legY = height - 20;
  ctx.textAlign = "left";

  // T-Codes legend
  ctx.fillStyle = "#8B5CF6";
  roundRect(ctx, width / 2 - 150, legY - 12, 16, 16, 4);
  ctx.fill();
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillText("Total T-Codes", width / 2 - 126, legY);

  // HU legend
  ctx.fillStyle = "#10B981";
  roundRect(ctx, width / 2 + 25, legY - 12, 16, 16, 4);
  ctx.fill();
  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 12px Arial, sans-serif";
  ctx.fillText("Total HU Préparés", width / 2 + 49, legY);

  return canvas.toBuffer("image/png");
}

/**
 * Chart 2: Top Opérateurs (Classement de production)
 */
function generateTopOperatorsChart(operators, dateStr) {
  const width = 900;
  const height = 460;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Header Banner
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  gradient.addColorStop(0, "#0F766E");
  gradient.addColorStop(1, "#0D9488");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, 60);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("CLASSEMENT DES TOP OPÉRATEURS", 24, 37);

  ctx.fillStyle = "#CCFBF1";
  ctx.font = "bold 13px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Production du ${dateStr}`, width - 24, 37);

  // Up to top 8 operators
  const topList = operators.slice(0, 8);
  if (topList.length === 0) {
    ctx.fillStyle = "#64748B";
    ctx.font = "14px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Aucune donnée d'opérateur pour cette date", width / 2, height / 2);
    return canvas.toBuffer("image/png");
  }

  const maxCodes = Math.max(...topList.map((op) => op.totalCodes || 0), 1);

  const startY = 85;
  const rowHeight = 42;
  const barMaxW = width - 360;

  topList.forEach((op, index) => {
    const y = startY + index * rowHeight;

    // Rank pill
    ctx.fillStyle = index === 0 ? "#F59E0B" : index === 1 ? "#94A3B8" : index === 2 ? "#D97706" : "#E2E8F0";
    roundRect(ctx, 24, y + 4, 30, 24, 6);
    ctx.fill();

    ctx.fillStyle = index < 3 ? "#FFFFFF" : "#475569";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`#${index + 1}`, 39, y + 20);

    // Operator Matricule & Name
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 13px Arial, sans-serif";
    ctx.textAlign = "left";
    const label = op.name ? `${op.matricule} - ${op.name}` : op.matricule;
    ctx.fillText(label.slice(0, 24), 65, y + 21);

    // Bar background
    const barX = 260;
    const barW = Math.max(12, ((op.totalCodes || 0) / maxCodes) * barMaxW);

    ctx.fillStyle = "#F1F5F9";
    roundRect(ctx, barX, y + 6, barMaxW, 20, 6);
    ctx.fill();

    // Bar fill gradient
    const g = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    g.addColorStop(0, "#0D9488");
    g.addColorStop(1, "#14B8A6");
    ctx.fillStyle = g;
    roundRect(ctx, barX, y + 6, barW, 20, 6);
    ctx.fill();

    // Value labels
    ctx.fillStyle = "#0F766E";
    ctx.font = "bold 12px Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${op.totalCodes} T-Codes`, barX + barW + 12, y + 21);

    // HU badge
    ctx.fillStyle = "#64748B";
    ctx.font = "11px Arial, sans-serif";
    ctx.fillText(`(${op.totalHU || 0} HU)`, barX + barW + 95, y + 21);
  });

  return canvas.toBuffer("image/png");
}

module.exports = {
  generateShiftChart,
  generateTopOperatorsChart,
};
