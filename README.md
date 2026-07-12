# Distributed Rate Limiter (Token Bucket Algorithm)

A production-grade, distributed API Rate Limiter built with **Node.js**, **Express**, and **Redis**. This project implements the **Token Bucket algorithm** using a high-efficiency lazy-refill strategy, designed to protect backend systems from traffic bursts and DDoS attempts in a distributed infrastructure.

## 🚀 System Architecture & Key Features

*   **Distributed State Management:** By replacing in-memory local storage with **Redis**, rate-limiting state is shared globally across multiple server instances running behind a load balancer.
*   **Lazy Refill Logic:** Avoids expensive background timers. Token regeneration is calculated dynamically on-the-fly when a request arrives, significantly saving CPU cycles.
*   **Fail-Open Fault Tolerance:** Implements a resilient `try/catch` architecture. If the Redis cache encounters a network drop or crashes, the system fails open—ensuring user traffic isn't blocked by database dependencies.
*   **High Performance:** Leverages Redis string serialization for fast read/write operations under $O(1)$ time complexity.

## 🛠️ Tech Stack

*   **Backend:** Node.js, Express
*   **Database/Cache:** Redis (Key-Value Store)
*   **Testing Tools:** cURL

## ⚙️ How It Works (Token Bucket Math)

The middleware evaluates incoming traffic based on two main parameters:
*   `CAPACITY`: Max burst request capacity allowed instantly (Set to 5).
*   `REFILL_RATE`: Tokens regenerated per second (Set to 1/sec).

When a request arrives, elapsed time is computed:

$$\text{Tokens Generated} = \text{Elapsed Time (seconds)} \times \text{Refill Rate}$$

The new balance is securely capped using $\min(\text{Capacity}, \text{Current Tokens} + \text{Tokens Generated})$ and updated back to the Redis cluster.
