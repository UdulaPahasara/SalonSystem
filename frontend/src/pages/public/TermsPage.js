import React from "react";
import PolicyPage from "./PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service">
      <p>
        By visiting Lumière Salon or using our booking channels, you agree to these terms.
        Services are provided to clients who arrive on time with valid contact information.
      </p>
      <h4>Appointments</h4>
      <p>
        Appointments are confirmed upon verbal, phone, or in-person booking. We reserve the
        right to refuse service in cases of unsafe behavior or policy violations.
      </p>
      <h4>Pricing</h4>
      <p>
        Prices listed on our Services page are guide prices. Final pricing may vary based on
        hair length, product usage, or additional treatments agreed with your stylist.
      </p>
      <h4>Liability</h4>
      <p>
        Please inform staff of allergies, sensitivities, or medical conditions before treatment.
        We are not liable for undisclosed conditions that affect service outcomes.
      </p>
    </PolicyPage>
  );
}
