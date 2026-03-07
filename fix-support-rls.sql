-- Fix RLS policies for support_tickets and ticket_messages tables

-- Drop ALL existing policies for support_tickets
DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Administrators can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
DROP POLICY IF EXISTS "Administrators can update tickets" ON support_tickets;

-- Create permissive policies for support_tickets
CREATE POLICY "Anyone can view their tickets"
  ON support_tickets FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tickets"
  ON support_tickets FOR UPDATE
  USING (true);

-- Drop ALL existing policies for ticket_messages
DROP POLICY IF EXISTS "Users can view messages for their tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Administrators can view all ticket messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages to their tickets" ON ticket_messages;
DROP POLICY IF EXISTS "Administrators can send messages to any ticket" ON ticket_messages;

-- Create permissive policies for ticket_messages
CREATE POLICY "Anyone can view ticket messages"
  ON ticket_messages FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create ticket messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (true);

-- Success message
SELECT 'Support RLS policies updated successfully!' as message;
