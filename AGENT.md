# agent.md

## Project Overview

This project is an **offline-first invoice generator Progressive Web App (PWA)** built with **React, Vite, TypeScript, Tailwind CSS, Dexie (IndexedDB), and jsPDF**.

The goal of the app is to allow freelancers and small businesses to **quickly create, preview, and download professional invoices** directly from their device without requiring an account or internet connection.

The application must work reliably on **mobile, tablet, and desktop** and should be installable as a PWA.

---

## Core App Structure

The application has **three main tabs**:

1. **Dashboard**
2. **Invoices**
3. **Settings**

### Dashboard

Displays:

* Greeting message
* Invoice statistics
* Preview list of recent invoices
* Floating Action Button (FAB) to create a new invoice

### Invoices

Displays the **complete invoice history** stored locally.

Users can:

* Open invoice preview
* Download PDF
* Share invoice
* Duplicate invoice
* Delete invoice

### Settings

Allows configuration of:

* Business information
* Logo upload
* Currency
* Payment methods
* Default tax settings

---

## Invoice Creation Flow

Invoices are created via the **Floating Action Button on the Dashboard**.

The creation flow is a **step-based process**:

1. Client Information
2. Invoice Items
3. Payment Method, Notes & Refund policy
4. Review & Generate Invoice


On **desktop**, the creation screen should show a **full screen viewport layout**:


On **mobile**, the preview should open as a **full screen viewport layout too**.

The preview must always reflect the final invoice layout.

---

## Storage

All data must be stored locally using **Dexie (IndexedDB)**.

Tables include:

* invoices
* settings
* paymentMethods
* assets (for logos if needed)

The app must function **offline** for all core features.

---

## PDF Generation

Invoices must be exported as PDF using:

* jsPDF
* jspdf-autotable

The generated PDF should **match the preview layout as closely as possible**.

---

## Coding Principles

The agent must always follow these principles:

### Clean Code

* Write **readable and maintainable code**
* Use clear variable and component names
* Avoid unnecessary complexity

### Component Structure

* Use **small reusable components**
* Separate UI components from logic where possible
* Organize components logically in folders

### TypeScript Best Practices

* Use proper typing
* Avoid `any`
* Define reusable types where needed

### React Best Practices

* Use functional components
* Use React hooks properly
* Avoid unnecessary re-renders
* Keep components focused on one responsibility

### Styling

Use **Tailwind CSS** with clean class organization.

Avoid:

* inline styles
* duplicated styling logic

---

## Code Quality

Before finishing any implementation, the agent must:

* Recheck code for **errors or broken logic**
* Ensure code compiles without warnings
* Ensure components are **properly typed**
* Remove unused imports
* Confirm consistent formatting

---

## UX Expectations

The interface should feel:

* Minimal
* Fast
* Professional
* Easy to use

Users should be able to **generate an invoice in under one minute**.

---

## Important Rules

* Do not introduce unnecessary libraries.
* Follow the existing architecture of the project.
* Maintain consistent file structure.
* Prioritize simplicity and reliability over complexity.

If unsure about a design or implementation choice, prefer the **simpler and more maintainable solution**.
