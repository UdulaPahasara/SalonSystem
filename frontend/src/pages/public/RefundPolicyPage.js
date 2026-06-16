import React from "react";
import PolicyPage from "./PolicyPage";

export default function RefundPolicyPage() {
  return (
    <PolicyPage title="Refund Policy">
      <p>
        We want you to leave feeling beautiful and satisfied. If you are unhappy with a service,
        please speak with our front desk within 48 hours of your visit.
      </p>
      <h4>Eligible adjustments</h4>
      <ul>
        <li>Service correction by the same stylist within 7 days, where feasible</li>
        <li>Partial credit for retail products returned unopened within 14 days</li>
      </ul>
      <h4>Non-refundable items</h4>
      <ul>
        <li>Completed chemical treatments once processed</li>
        <li>Opened skincare or haircare retail products</li>
        <li>Gift vouchers after redemption has begun</li>
      </ul>
      <h4>Processing</h4>
      <p>
        Approved refunds for prepaid services are processed within 7–10 business days to the
        original payment method where possible.
      </p>
    </PolicyPage>
  );
}
