export const rs = (n) =>
  `Rs. ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
