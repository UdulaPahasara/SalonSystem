import React from "react";
import PolicyPage from "./PolicyPage";

export default function CancellationPolicyPage() {
  return (
    <PolicyPage title="Cancellation Policy">
      <p>
        We understand plans change. To serve all clients fairly, please follow our cancellation
        guidelines when adjusting or cancelling appointments.
      </p>
      <h4>Standard appointments</h4>
      <ul>
        <li>Cancel or reschedule at least 24 hours before your appointment — no fee</li>
        <li>Less than 24 hours notice may incur a 50% service charge</li>
        <li>No-shows may be charged up to 100% of the booked service</li>
      </ul>
      <h4>Bridal & special packages</h4>
      <ul>
        <li>Require 72 hours notice for changes</li>
        <li>Deposits for bridal bookings are non-refundable within 7 days of the event date</li>
      </ul>
      <h4>How to cancel</h4>
      <p>
        Call +94 11 555 0100 or email bookings@lumieresalon.lk with your name, date, and
        service type.
      </p>
    </PolicyPage>
  );
}
