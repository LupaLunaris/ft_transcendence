# Team Organization

> Temporary team structure for **ft_transcendence**.
> This document will be updated when the full team is confirmed.

---

## Overview

| Area 					 | Current owner 	 | Status 					  |
| ---  					 | --- 				 | --- 						  |
| Product direction 	 | Jennifer + Martin | Shared 					  |
| Technical architecture | Jennifer + Martin | Temporary shared ownership |
| Backend foundation 	 | Jennifer 		 | Active 					  |
| Gameplay conception 	 | Martin 			 | Active 					  |
| Real-time systems 	 | Future member 	 | To assign 				  |
| UI system 			 | Future member 	 | To assign 				  |

The current objective is to prepare a stable foundation without locking decisions
that should be validated by the complete team.

---

## Current Team Members

### Jennifer

**Current focus**

- Backend structure
- User management foundation
- Security-oriented architecture
- Project coherence support

**Main responsibilities**

- Authentication logic
- User accounts
- Profile system
- Avatar upload
- Friendship system
- Backend validation
- Secure API foundations
- Prisma models linked to users

**Main linked modules**

| Module 		  | Link with the role 							|
| --- 			  | --- 										|
| User Management | Standard user management and authentication |
| Web 			  | ORM with Prisma 							|
| Security 		  | Transversal backend concerns 				|

**Secondary participation**

- Architecture discussions
- Module validation
- Technical coherence of the README

---

### Martin

**Current focus**

- Gameplay conception
- Core game logic
- Visual game direction

**Main responsibilities**

- Labyrinth gameplay logic
- Card mechanics
- Game rules
- Progression logic
- Game interaction design
- Visual gameplay structure

**Main linked modules**

| Module | Link with the role 		  |
| --- 	 | --- 						  |
| Gaming | Complete web-based game    |
| Gaming | Game customization options |

**Secondary participation**

- Game balancing
- Visual coherence of game interactions

---

## Future Team Members

### Member 3 - To Be Defined

**Expected role:** real-time systems and synchronization.

**Likely responsibilities**

- WebSocket layer
- Live synchronization
- Online presence
- Reconnection logic
- Live notifications backend

**Likely linked modules**

| Module | Expected contribution |
| --- 	 | --- 					 |
| Web 	 | Real-time features 	 |
| Gaming | Remote players 		 |

---

### Member 4 - To Be Defined

**Expected role:** frontend integration and interface system.

**Likely responsibilities**

- Reusable UI components
- Design system
- Multilingual integration
- Notifications UI
- Responsive pages

**Likely linked modules**

| Module 		| Expected contribution  				   |
| --- 	 		| --- 					  				   |
| Web 	        | Custom-made design system 			   |
| Accessibility | Multiple languages 					   |
| Web 			| Notification system frontend integration |

---

## Temporary Organization Rule

Until the team is complete, the project should follow these rules:

- Avoid irreversible architecture decisions made alone.
- Prepare only stable technical foundations.
- Document decisions clearly.
- Keep technical choices open for discussion.

---

## Work Method

### Current Phase

Focus on:

- Module clarification
- MVP definition
- Architecture preparation
- Technical documentation

Avoid:

- Deep implementation that depends on future team decisions
- Final ownership decisions before all members have joined
- Technical choices that cannot be easily adjusted later

---

## Immediate Priorities

### Jennifer

- Draft the user and authentication architecture.
- Propose the backend structure.
- Prepare the first Prisma model draft.

### Martin

- Define the gameplay loop.
- Define the core game MVP.
- Prepare the first game interaction model.

---

## To Complete Later

When members 3 and 4 join, the team should:

- Redistribute responsibilities according to individual strengths.
- Validate module ownership again.
- Update the README roles officially.
- Recheck whether the current architecture still fits the full team.

---

## Internal Rule

Each module must remain understandable by every team member.

The subject requires everyone to be able to explain:

- The architecture
- The work distribution
- Their own contributions
- The main technical choices

