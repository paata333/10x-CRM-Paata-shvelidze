# Research Note — 10X CRM

This document outlines key sources, references, and research conducted during the development of 10X CRM.

---

## Primary Research Source

### DummyJSON API — Free JSON REST API for Testing & Mocking

**Reference:** https://dummyjson.com/

**Why Used:** 
10X CRM required a free, no-authentication-required data source to populate the initial client list during development and testing. DummyJSON provides a realistic user dataset with names, emails, companies, and profile images—perfect for a sales CRM prototype.

**What We Used:**
- **GET `/users?limit=30`** — Fetches 30 sample users
- **POST `/users/add`** — Mocked user creation (returns response but doesn't persist on server)
- **DELETE `/users/{id}`** — Mocked user deletion

**Data Mapping:**
The API's `/users` endpoint returns objects with `firstName`, `lastName`, `email`, `company`, and `image` fields. We transformed these into our Client schema:
```javascript
{
  id: user.id,
  name: `${user.firstName} ${user.lastName}`,
  email: user.email,
  phone: user.phone,
  company: user.company.name,
  image: user.image,
  status: "Lead",
  dealValue: Math.random() * (10000 - 500) + 500,
  notes: [],
  createdAt: new Date().toISOString()
}
```

**Advantages:**
- ✅ No API key required
- ✅ CORS-enabled (works from any domain)
- ✅ Realistic sample data (30 diverse user profiles)
- ✅ Supports GET, POST, DELETE (ideal for CRUD testing)
- ✅ Fast response times
- ✅ Widely used for prototyping (trusted by thousands)

**Limitations:**
- ❌ POST/DELETE responses don't persist (mocked only)
- ❌ No authentication/authorization
- ❌ Limited to 30 users
- ❌ No filtering or querying beyond pagination

**How This Informed Design:**
Because DummyJSON's POST/DELETE are mocked, we designed 10X CRM to persist all changes in **localStorage** on the client side. This meant building a data layer (`js/data.js`) that:
1. Checks localStorage first for cached clients
2. Falls back to API fetch if cache is empty
3. Transforms API data to our schema
4. Persists all local changes (adds, deletes, edits) to localStorage

This architecture also makes 10X CRM **fully functional offline**—a valuable feature for sales teams in low-connectivity environments.

---

## Secondary References

### Browser APIs & Standards

- **MDN Web Docs** (https://developer.mozilla.org/) — Reference for `localStorage`, Fetch API, DOM methods, `setTimeout`, and event handling
- **ECMAScript 2020+ Specification** — Arrow functions, `async/await`, destructuring, template literals

### Design & UX Inspiration

- **Stripe Dashboard** (https://stripe.com/) — Modern gradient headers, minimal card design, clear typography hierarchy
- **Linear** (https://linear.app/) — Sidebar navigation, dark theme implementation, keyboard shortcuts

### Code Quality & Patterns

- Functional programming patterns for immutability (`.slice()`, spread operator `[...]`)
- Event delegation for performance (single handler on parent vs. many on children)
- Component-based CSS (BEM naming convention concepts, though adapted for simplicity)

---

## Key Learning Outcomes

### What This Research Taught Us

1. **Mock APIs are production-ready.** DummyJSON showed that realistic sample data doesn't require a real backend during development.

2. **Client-side persistence is flexible.** localStorage gives us the ability to work offline and sync on reconnect—a key feature for mobile sales reps.

3. **Modern browser APIs are mature.** `async/await` with Fetch API eliminates callback hell and makes async code readable.

4. **Design should follow user mental models.** Dashboard layouts from Stripe and Linear informed our stats card grid and sidebar structure—users expect this pattern.

---

## Future Research Directions

For a production version of 10X CRM, the following research would be valuable:

- **Real-time sync** (Firebase, Supabase) — Replace localStorage with a backend that syncs across devices
- **Export capabilities** — CSV/PDF export of client lists and pipeline reports
- **Analytics & forecasting** — Machine learning models to predict deal close rates
- **Mobile app** — React Native implementation for iOS/Android with offline-first sync
- **Integrations** — Zapier, Slack, calendar sync, email logging

---

## Conclusion

DummyJSON proved to be an ideal starting point for prototyping a CRM. The project demonstrates that a fully functional sales tool can be built with modern browser APIs, minimal dependencies, and thoughtful architecture—without requiring a complex backend from day one.

The client-side data layer we built is flexible enough to migrate to a real backend simply by swapping out the API calls, while keeping the rest of the app unchanged.

---

**Research conducted:** July 22–23, 2026  
**Sources consulted:** 3 primary (DummyJSON, MDN, ECMAScript spec) + 2 design references  
**Total research time:** ~2 hours (research alongside development)
