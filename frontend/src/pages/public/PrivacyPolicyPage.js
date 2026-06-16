import React from "react";
import PolicyPage from "./PolicyPage";

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy">
      <p><strong>Last updated:</strong> {new Date().getFullYear()}</p>
      <p>
        Lumière Salon respects your privacy. We collect personal information such as your name,
        phone number, and email only when you book appointments, register for loyalty benefits,
        or contact us through our website.
      </p>
      <h4>Information we collect</h4>
      <ul>
        <li>Contact details (name, phone, email)</li>
        <li>Appointment history and service preferences</li>
        <li>Payment records related to salon services</li>
      </ul>
      <h4>How we use your information</h4>
      <ul>
        <li>To schedule and manage appointments</li>
        <li>To provide personalized service recommendations</li>
        <li>To send appointment reminders with your consent</li>
        <li>To improve our salon operations and customer experience</li>
      </ul>
      <h4>Data protection</h4>
      <p>
        We do not sell your personal data. Access is limited to authorized salon staff.
        We retain records only as long as needed for business and legal purposes.
      </p>
      <h4>Contact</h4>
      <p>For privacy requests, email hello@lumieresalon.lk.</p>
    </PolicyPage>
  );
}
