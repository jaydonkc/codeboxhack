export function scoreMarker(score: number | null | undefined, selected: boolean) {
  const badge = document.createElement("div");
  badge.textContent = score == null ? "—" : score.toFixed(1);
  Object.assign(badge.style, {
    minWidth: "48px", height: "36px", padding: "0 9px", boxSizing: "border-box",
    borderRadius: "18px", border: "2px solid #fff9e9", color: "#fff9e9",
    background: selected ? "#d66940" : score == null ? "#50635a" : "#345c36",
    display: "flex", alignItems: "center", justifyContent: "center",
    font: "700 15px/20px system-ui, sans-serif", boxShadow: "0 2px 5px #0004",
    cursor: "pointer",
  });
  return badge;
}
