-- Deletes students who have NO semester assigned (The source of your bug)
DELETE FROM students WHERE semester_id IS NULL;
