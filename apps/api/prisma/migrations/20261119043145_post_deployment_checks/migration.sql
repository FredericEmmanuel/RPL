ALTER TABLE "StudySession"
  ADD CONSTRAINT "StudySession_capacity_check"
  CHECK ("capacity" >= 2 AND "capacity" <= 100);
