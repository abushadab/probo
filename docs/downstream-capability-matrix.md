# Downstream capability matrix

Use this matrix to turn market research and customer needs into independently
specified Probo features. Add links only to public source material.

| Capability | User outcome | References | Priority | Reuse policy | Probo surfaces | Status | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Continuous control monitoring | Detect control drift before an audit | Vanta, OpenLane, Comp AI | High | Clean-room implementation | API, console, MCP, CLI, workers | Discovery | TBD |
| Automated evidence collection | Collect timestamped evidence from connected systems | Vanta, OpenLane, Comp AI | High | Clean-room implementation | connectors, evidence, measures | Discovery | TBD |
| Integration health | Explain connector failures and stale synchronization | OpenLane, Vanta | High | Clean-room; review Apache code before any reuse | connectors, console, telemetry | Discovery | TBD |
| Questionnaire automation | Reuse approved answers and supporting evidence | Vanta, Comp AI | Medium | Clean-room implementation | vendors, documents, agent tools | Discovery | TBD |
| Compliance readiness dashboard | Show gaps, ownership, and remediation progress | Vanta, OpenLane, Comp AI | Medium | Clean-room implementation | console, reports, API | Discovery | TBD |

## Feature readiness checklist

Before implementation, each capability needs:

- a customer problem and measurable outcome;
- independently written workflows and acceptance criteria;
- a Probo-native data model and authorization review;
- impact analysis for GraphQL, MCP, CLI, n8n, and the web applications;
- additive migration and rollback considerations;
- unit, integration, and end-to-end test coverage;
- a licensing decision recorded in the pull request.
