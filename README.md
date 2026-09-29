# Streaming Platform Database Architecture

A document-oriented database schema modeling a commercial video-streaming service, structured across seven distinct collections[cite: 1]. This project demonstrates advanced NoSQL data modeling techniques, focusing on performance, scalability, and document size management.

## Tech Stack
* **Database:** MongoDB
* **Concepts:** NoSQL Data Modeling, Aggregation Pipelines, Schema Validation

## Architectural Highlights
* **Optimized Document Sizing:** Engineered one-to-many connections for infinite data streams (like payment histories) to prevent exceeding MongoDB's strict 16MB document limit.
* **Security Isolation:** Designed strict one-to-one relationships to isolate secure authentication credentials from public user profiles.
* **Polymorphic Relationships:** Implemented polymorphic reference fields to seamlessly link a user's watch history to either standalone film documents or deeply embedded television episodes.

## Repository Contents
* `data/` - Sample JSON data used to seed the 7 core collections (Accounts, Users, paymentHistory, watchHistory, Actors, Films, Series)[cite: 1].
* `aggregations.js` - Complex aggregation pipelines used for analytics, content filtering, and data retrieval.