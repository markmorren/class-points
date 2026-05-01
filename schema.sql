CREATE TABLE IF NOT EXISTS classes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS students (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id     INTEGER NOT NULL REFERENCES classes(id),
  display_name TEXT NOT NULL,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id    INTEGER NOT NULL REFERENCES classes(id),
  label       TEXT NOT NULL,
  points      INTEGER NOT NULL DEFAULT 1,
  is_positive INTEGER NOT NULL DEFAULT 1,
  icon        TEXT
);

CREATE TABLE IF NOT EXISTS group_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id   INTEGER NOT NULL REFERENCES classes(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS point_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id       INTEGER NOT NULL REFERENCES classes(id),
  student_id     INTEGER NOT NULL REFERENCES students(id),
  category_id    INTEGER NOT NULL REFERENCES categories(id),
  points         INTEGER NOT NULL,
  created_at     INTEGER NOT NULL,
  group_event_id INTEGER REFERENCES group_events(id)
);
