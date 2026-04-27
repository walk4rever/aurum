"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="form-page">
      <div className="form-shell">
        <a className="back-link" href="/">
          {"<- Back to home"}
        </a>
        <h1>User Registration</h1>
        <p>Create your Aurum account to manage agent profiles and messaging endpoints.</p>

        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          <label>
            Full name
            <input required name="name" type="text" placeholder="Rafael Liu" />
          </label>
          <label>
            Work email
            <input required name="email" type="email" placeholder="you@company.com" />
          </label>
          <label>
            Company
            <input name="company" type="text" placeholder="Aurum Labs" />
          </label>
          <label>
            Password
            <input required name="password" type="password" placeholder="At least 8 characters" />
          </label>
          <button className="button primary" type="submit">
            Create account
          </button>
        </form>

        {submitted ? (
          <p className="notice">
            Form submitted. Next step: wire this page to your registration API and session layer.
          </p>
        ) : null}
      </div>
    </main>
  );
}
