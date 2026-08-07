CREATE POLICY "Users can delete messages in their conversations" ON public.messages
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can delete their conversations" ON public.conversations
FOR DELETE USING (
  auth.uid() = user1_id OR auth.uid() = user2_id
);