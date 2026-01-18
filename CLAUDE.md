# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static landing page for a psychology practice (Luana Maia - Humanistic Psychologist). It's a single-page website targeting Brazilian Portuguese speakers, designed for lead capture and WhatsApp booking.

**Stack:** Vanilla HTML5, CSS3, JavaScript (ES6+) - no build process required.

## Running Locally

No build step needed. Simply open `index.html` in a browser or use any local server:
```bash
python -m http.server 8000
npx http-server
```

## Architecture

### File Structure
- `index.html` - Single-page layout with 9 sections, Schema.org structured data
- `script.js` - Modular JavaScript wrapped in IIFE with 15+ functional modules
- `styles.css` - CSS custom properties design system with cinematic animations

### JavaScript Modules (in script.js)
The codebase uses a modular pattern with these key modules:
- `CONFIG` - Global settings (WhatsApp number, tracking flags)
- `Tracking` - GTM/GA4/Google Ads integration, UTM parameter handling
- `LeadForm` - Form validation with Brazilian phone mask, WhatsApp redirect
- `Animations` - Intersection Observer-based reveal animations
- `MobileMenu` - Mobile navigation toggle with ESC/click-outside closing
- `FAQ` - Accordion functionality (single item open at a time)

### CSS Design System
Custom properties define:
- Color palette: Primary blue (#6B8FAD), secondary tan (#C4A77D)
- Typography: Cormorant Garabald (display), Mulish (body)
- Animation easing: 4 custom cubic-beziers (expo, quint, circ, spring)
- Responsive breakpoints: 1024px (tablet), 768px (mobile), 480px (small mobile)

## Key Configuration

WhatsApp integration is configured in script.js `CONFIG` object:
```javascript
whatsappNumber: '5519989276280'
whatsappMessage: 'Olá, vim pelo site e gostaria de agendar uma consulta.'
```

## Analytics

The site tracks:
- UTM parameters (stored in sessionStorage)
- Scroll depth milestones (25%, 50%, 75%, 90%, 100%)
- Section view events via Intersection Observer
- Form submission with UTM data
- Click events on `[data-track]` elements

## Form Behavior

The lead form does NOT submit to a backend. It validates input (Brazilian phone format, email regex) and redirects to WhatsApp with pre-filled message including form data and UTM parameters.

## Accessibility

The site uses semantic HTML with ARIA labels, roles, and supports `prefers-reduced-motion` for animations.
