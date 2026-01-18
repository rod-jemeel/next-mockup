-- Migration: Department & Role Hierarchy System
-- Date: 2026-01-19
-- Description: Adds departments for granular notification targeting

-- Create departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT 'gray',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT NOT NULL REFERENCES "user"(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, name)
);

-- Create department_members junction table
CREATE TABLE department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  is_manager BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by TEXT NOT NULL REFERENCES "user"(id),
  UNIQUE (department_id, user_id)
);

-- Add department targeting to email_forwarding_rules
ALTER TABLE email_forwarding_rules
ADD COLUMN IF NOT EXISTS notify_department_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notify_department_member_ids UUID[] DEFAULT '{}';

-- Indexes for performance
CREATE INDEX idx_departments_org_id ON departments(org_id);
CREATE INDEX idx_departments_org_active ON departments(org_id, is_active);
CREATE INDEX idx_department_members_department_id ON department_members(department_id);
CREATE INDEX idx_department_members_user_id ON department_members(user_id);

-- Comments for documentation
COMMENT ON TABLE departments IS 'Organization departments for notification targeting';
COMMENT ON COLUMN departments.color IS 'Display color for the department badge (gray, blue, green, yellow, red, purple)';
COMMENT ON COLUMN departments.is_active IS 'Soft delete flag - inactive departments are hidden but preserved';
COMMENT ON TABLE department_members IS 'Many-to-many relationship between departments and users';
COMMENT ON COLUMN department_members.is_manager IS 'Whether this user can manage the department membership';
COMMENT ON COLUMN department_members.is_primary IS 'Whether this is the users primary department (for display purposes)';
COMMENT ON COLUMN email_forwarding_rules.notify_department_ids IS 'Array of department IDs - all members of these departments will be notified';
COMMENT ON COLUMN email_forwarding_rules.notify_department_member_ids IS 'Array of department_member IDs - specific members within departments';
