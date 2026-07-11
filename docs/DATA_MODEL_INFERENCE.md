# Data Model Inference

## Entity Diagram

Status: Recommended for rebuild

```mermaid
erDiagram
  USER ||--o{ LINK : owns
  USER ||--o{ BIO_PAGE : owns
  LINK ||--o{ LINK_ACTION : requires
  LINK ||--o{ ANALYTICS_EVENT : records
  LINK ||--o{ EMAIL_SUBSCRIBER : collects
  BIO_PAGE ||--o{ BIO_ITEM : contains
  VISITOR ||--o{ ANALYTICS_EVENT : triggers
  VISITOR ||--o{ LINK_COMPLETION : completes
  LINK ||--o{ LINK_COMPLETION : unlocks

  USER {
    bigint id
    string email
    string display_name
  }
  LINK {
    bigint id
    bigint user_id
    string title
    string slug
    string destination_url
    string type
    string status
  }
  LINK_ACTION {
    bigint id
    bigint link_id
    string platform
    string action_type
    string target_url
    int sort_order
  }
  BIO_PAGE {
    bigint id
    bigint user_id
    string slug
    string title
    string bio
  }
  BIO_ITEM {
    bigint id
    bigint bio_page_id
    string title
    string url
    bool enabled
  }
  ANALYTICS_EVENT {
    bigint id
    bigint link_id
    string event_type
    string visitor_hash
    datetime created_at
  }
```

## Proposed Entities

Status: Recommended

- User: creator account.
- Link: gated/direct/email-capture link.
- LinkAction: ordered social actions.
- LinkVisitor: anonymized visitor identity.
- LinkCompletion: visitor completion/unlock record.
- EmailSubscriber: captured email for a link.
- BioPage and BioItem: link-in-bio profile and links.
- AnalyticsEvent: view, action, unlock, click.

## Reference Certainty

Status: Inferred

The public UI implies links, actions, visitors/completions, analytics events, and email subscribers. The real database schema is unknown.
