Database Schema Design Cheat Sheet

A practical guide for designing scalable database schemas before writing SQL.

Database Design Workflow
Product Idea
      │
      ▼
Gather Requirements
      │
      ▼
Identify Entities
      │
      ▼
Design Tables
      │
      ▼
Choose Primary Keys
      │
      ▼
Add Common Columns
      │
      ▼
Define Relationships
      │
      ▼
Add Foreign Keys
      │
      ▼
Review & Optimize
      │
      ▼
Generate SQL Migration
Step 1 — Understand the Product

Never begin by creating tables.

First understand:

What problem does the product solve?
Who are the users?
What can users do?
What data needs to be stored?
Template
Product
Project Name:
Goal
One paragraph describing the product.
Features
✓ User Signup

✓ Login

✓ Profile

✓ Posts

✓ Comments

✓ Likes

✓ Payments

✓ Notifications

Example

Twitter Clone

Users can

- Register
- Login
- Create Tweets
- Upload Images
- Follow Users
- Like Tweets
- Comment
- Buy Premium

Do not think about tables yet.

Only think about business requirements.

Step 2 — Identify Entities

Now extract all nouns.

Example

User
Tweet
Comment
Like
Media
Subscription
Notification

Each major noun usually becomes a table.

Example

Feature	Entity
User Login	Users
Tweet	Tweets
Like Tweet	Likes
Comment	Comments
Upload Image	Media
Premium	Subscriptions
Step 3 — Design Each Table

For every entity answer

What information belongs here?
What should never be stored here?
What uniquely identifies a row?

Template

Table Name

Purpose

Columns

Primary Key

Unique Fields

Indexes

Relationships

Example

Users

Column	Type
id	UUID
username	String
email	String
bio	Text
Step 4 — Add Primary Keys

Every table must have one.

Recommended

id UUID PRIMARY KEY

Avoid

email

username

phone

Those are business fields.

Business rules change.

IDs never should.

Checklist

✓ Every table has id

✓ UUID preferred

✓ Never use email

✓ Never use username

✓ Never use phone number

Step 5 — Add Standard Columns

Every table should usually contain

id

created_at

updated_at

deleted_at (optional)

Optional

created_by

updated_by

version

status

Why?

Almost every production system eventually needs

audit history
sorting
debugging
soft delete
analytics

The transcript strongly recommends always including created_at from the beginning.

Step 6 — Define Relationships

Ask

How are these tables connected?

There are only three common relationship types.

One to One
User
    │
    │
Subscription

Example

One user

↓

One subscription

One to Many
User
 │
 ├── Tweet
 ├── Tweet
 ├── Tweet

Example

One user

↓

Many posts

Many to Many
Students

↕

Courses

Needs a junction table

student_courses

Never connect many-to-many directly.

Always use a bridge table.

The transcript uses the follows table to model a many-to-many relationship between users.

Step 7 — Add Foreign Keys

Foreign keys connect tables.

Example

Tweets

id

user_id

content

created_at

Here

user_id

references

users.id

Naming Convention

user_id

tweet_id

comment_id

order_id

product_id

Never use

uid

usr

owner

creator

Consistency matters.

Step 8 — Build the ER Diagram

Create the Entity Relationship Diagram.

It should answer

Which tables exist?
How are they connected?
Which side owns the relationship?
Which fields are foreign keys?

Recommended tools

dbdiagram.io
Draw.io
Eraser
Lucidchart
Mermaid ER Diagrams

Teams treat the ERD as a living document and keep it synchronized with the schema.

Step 9 — Validate the Schema

Before writing SQL ask

Red Flags

❌ Duplicate information

❌ Missing primary keys

❌ Missing foreign keys

❌ Circular relationships

❌ Huge tables

❌ Business logic inside IDs

❌ Nullable columns that should not be nullable

❌ Missing timestamps

Step 10 — Performance Review

Before development starts

Review

Indexes
email

username

user_id

created_at
Constraints
UNIQUE

NOT NULL

CHECK

DEFAULT
Cascades
ON DELETE CASCADE

ON DELETE SET NULL

ON UPDATE CASCADE
Naming Standards

Tables

users

posts

comments

likes

Columns

first_name

created_at

updated_at

profile_image

Foreign Keys

user_id

post_id

order_id

Primary Key

id

Indexes

idx_users_email

idx_posts_created_at

Consistent naming conventions make schemas easier to maintain and onboard new engineers.

Design Checklist

Before implementation verify

Requirements
 Product understood
 Features listed
Entities
 Tables identified
 No duplicates
Columns
 Data types selected
 Required fields marked
Keys
 Primary key exists
 Foreign keys added
Relationships
 One-to-one checked
 One-to-many checked
 Many-to-many uses bridge table
Constraints
 Unique constraints
 NOT NULL
 Defaults
Metadata
 created_at
 updated_at
 deleted_at (if needed)
Performance
 Indexes identified
Documentation
 ER Diagram complete
 Data dictionary complete
 Assumptions documented
 Future changes noted
Final Deliverables

Before any backend implementation begins, the team should have:

Product Requirements
Feature List
Entity List
ER Diagram
Table Definitions
Relationship Definitions
Data Dictionary
Constraints & Validation Rules
Index Strategy
Migration Plan