# 🌀 Sprint 3 Retrospective

## Overview

Sprint 3 focused on advancing the game flow beyond voting and starting rounds to include **player elimination**, **end game determination**, and improved **user experience**. Additionally, the team integrated WebSocket events more deeply to provide real-time feedback to players during gameplay.

The key goals for this sprint were:

1. Implement **elimination logic** triggered once all votes are cast.
2. Correctly determine if the **undercover player is eliminated** and end the game accordingly.
3. Notify players of eliminations and **redirect eliminated players** to a dedicated screen.
4. Handle **end game notifications** and redirect winners/losers to their respective pages.
5. Continue refining real-time communication using WebSockets.

---

## ✅ What Was Completed

### 1. **Elimination Logic**

- Successfully implemented backend elimination logic which identifies the player with the highest votes and marks them as eliminated.
- Incorporated role checking to determine whether the eliminated player was the undercover, triggering game end or starting the next round accordingly.

### 2. **Real-Time Notifications**

- WebSocket events were integrated to broadcast elimination and game end events in real-time.
- Players receive immediate feedback when they are eliminated, including redirection to the elimination screen.

### 3. **Game End Handling**

- Implemented logic to distinguish the winning side ("undercover" or "civilian") and broadcast game end events.
- Clients redirect winners and losers to appropriate pages with consistent styling and messaging.

### 4. **UI/UX Improvements**

- Eliminated players are redirected to a dedicated page that informs them of their status.
- Round transitions trigger alerts and page reloads with updated words and information.

---

## ⚠️ What We Fell Short Of

- **Player Log Display**: We did not complete the feature to display a detailed player activity log at the end of the game, which would enhance user experience and game analysis.
- **Robustness**: Some edge cases related to WebSocket reconnections and simultaneous events caused occasional inconsistent state or duplicated messages.
- **Testing**: Unit and integration tests around elimination and end-game logic remain insufficient or absent, risking future regressions.
- **Pull Requests**: Pull request practices were not consistently followed. Many code changes were made collaboratively in-person, bypassing proper pull request review. This diverges from industry standard development workflows.
- **Vote Elimination Functionality**: The introduction of login and signup features has compromised vote elimination functionality. One of the high priorities going forward is ensuring this core gameplay feature is fully restored and stable.

---

## ✅ Positives

- Most planned core gameplay features for elimination and game end were delivered.
- Real-time updates and feedback using WebSockets significantly improved player engagement and game fluidity.
- Clear communication within the team enabled rapid iteration and debugging of complex backend logic.

---

## 🔻 Negatives

- Lack of testing coverage means some bugs persist unnoticed until manual playtesting.
- Occasional UI inconsistencies, such as delayed redirection for eliminated players.
- Admin and game start controls are still not fully intuitive or secure, leading to potential confusion during gameplay.
- Inconsistent or missing pull requests led to a lack of code review and version tracking in GitHub.

---

## 🔧 Areas for Improvement

### 1. **Testing**

- Implement thorough **unit tests** and **integration tests** for all new backend features, especially around elimination and game state transitions.
- Add **end-to-end (E2E) tests** to simulate full game flow, including voting, elimination, and game completion.

### 2. **WebSocket Management**

- Improve WebSocket event handling to prevent duplicated event listeners or multiple emits.
- Handle reconnections and ensure the game state syncs properly on client reconnects.

### 3. **UX Enhancements**

- Finalize the **player activity log** for game summary and replay.
- Enhance start game controls, potentially restricting start privileges to the game creator/admin.

### 4. **Performance and Scalability**

- Optimize SQL queries and database indexing to handle increased load as player count and concurrent games grow.
- Consider adding caching layers or message queues for large-scale WebSocket broadcasting.

### 5. **Pull Request Workflow**

- Establish a standard for meaningful and consistent pull requests.
- Ensure all code contributions go through a proper review process on GitHub.
- Moving forward, the team commits to using pull requests for all new features, bug fixes, and refactors, even if development occurs collaboratively in person.

### 6. **Restore Vote Elimination**

- Prioritize debugging and restoring vote elimination functionality affected by the new login/signup integration.
- Ensure core gameplay mechanics work flawlessly before adding additional features.

---

## ✅ Conclusion

Sprint 3 marked a major milestone in delivering a smooth, real-time game experience for the **Incognito Game** by adding elimination mechanics and clear game ending processes. Although some features like player logs, comprehensive testing, proper pull request habits, and vote elimination stability were not fully achieved, the core gameplay loop now functions with real-time player feedback, enabling competitive and engaging rounds.

Going forward, the team will focus on polishing edge cases, implementing robust test suites, enhancing the user interface, adopting consistent GitHub workflows, and restoring critical gameplay functionality to ensure a reliable and maintainable codebase.
