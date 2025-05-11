# Sprint 2 Retrospective

## Overview

Sprint 2 focused on building upon the foundation established in Sprint 1. The goal was to implement additional core features for the **Incognito Game** and continue refining the game logic for a more polished experience. Key features were:

1. **Role and Word Assignment**: Assigning unique roles and words to players upon game creation.
2. **Player Lobby**: Allowing players to view the game lobby. 
3. **Start Game**: Enabling the game to begin once a minimum number of players (3) are present in the lobby.
4. **Persistent Storage with SQL**: Transitioning from in-memory state management to a fully integrated SQL database for data persistence and querying.

As a result, Sprint 2 was a step closer to delivering a **Minimum Viable Product (MVP)** for the game.

---

## What Was Completed

### 1. **Role and Word Assignment**
   - The **Role and Word Assignment** feature was successfully implemented. Each player receives a unique role and a corresponding word, which is stored in the SQL database.
   - The roles are shuffled and distributed randomly, with each player receiving their word based on their role.

### 2. **Player Lobby**
   - The **Player Lobby** functionality was completed, allowing players to view the list of participants in the game.
   - A **Start Game** button appears once there are 3 or more players, signaling that the game can begin.

### 3. **Start Game**
   - The **Start Game** functionality was successfully implemented. Players can start the game once the minimum number of participants is reached, and they are redirected to individual game pages where they can view their word.

### 4. **SQL Integration**
   - The transition to using a **SQL database** for persistent game state was successfully completed.
   - The database is fully integrated with game logic, providing persistence across restarts.

---

## Reasons for Success

Several factors contributed to the successful delivery of features in Sprint 2:

1. **Clear Focus on MVP**:
   - The team stayed focused on delivering core features for the **Incognito Game**. The decision to implement a **minimum viable product (MVP)** allowed for quick iteration and testing of the most important game mechanics.

2. **Team Collaboration**:
   - The collaboration within the team was effective, with clear communication and a shared understanding of priorities. This allowed the team to complete the sprint goals despite the complexity of some tasks.

3. **Jest Tests**:
   - Unit tests were created for core functionalities, including game creation, player joining, role and word assignment, and the start game logic.
   - These tests provide confidence that the features work as expected and helped ensure that the code remains stable as new features are added.

---

## Areas for Improvement

Despite the progress, there are still areas where we can improve for future sprints:

### 1. **Task Estimation and Scope**
   - The scope of the sprint was manageable, but better task estimation could have led to even more precise planning. Some tasks took longer than anticipated, and future sprints will benefit from clearer breakdowns of complex tasks.

### 2. **E2E and Integration Testing**
   - Although unit tests were written, **end-to-end (E2E)** testing is still pending. We aim to implement E2E tests to simulate the full user journey, from creating and joining games to starting the game and interacting with players.
   - We also need to integrate **integration tests** to ensure different components (frontend, backend, database) work together seamlessly.

### 3. **SQL Optimization**
   - With the introduction of SQL, the team should focus on optimizing database queries as the number of players and concurrent games increases.
   - Future sprints will require proper indexing and query optimization for better performance, especially for more complex game data.

### 4. **Time Management**
   - While tasks were completed on time, the team can improve time management by incorporating more frequent check-ins during the sprint. This will help identify and address blockers earlier.

## Conclusion

Sprint 2 was a significant step forward in developing the **Incognito Game**, with key features like **role and word assignment**, **player lobby management**, and **start game logic** successfully implemented. The **SQL integration** provides persistence, scalability, and robustness to the game.

Moving forward, we will continue to improve our testing coverage with **E2E and integration tests**. We will also focus on optimizing the **SQL database** and improve our **time management** and **task estimation** for even more efficient sprint execution.
