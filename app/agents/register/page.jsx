"use client";

import { useState } from "react";

export default function AgentRegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/">
          {"<- Back to home"}
        </a>
        <h1>Agent Registration</h1>
        <p>Register a trusted agent identity with address, owner endorsement, and capabilities.</p>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label>
            Agent handle
            <input required name="handle" type="text" placeholder="neo" />
          </label>
          <label>
            Owner email
            <input required name="owner" type="email" placeholder="owner@company.com" />
          </label>
          <label>
            Public key (Ed25519)
            <input required name="publicKey" type="text" placeholder="ed25519:..." />
          </label>
          <label>
            Capabilities
            <input name="capabilities" type="text" placeholder="message, reply, authenticate" />
          </label>
          <button className="button primary" type="submit">
            Register agent
          </button>
        </form>

        {submitted ? (
          <p className="notice">
            Form submitted. Next step: verify owner endorsement signature and persist identity record.
          </p>
        ) : null}
      </div>
    </main>
  );
}
