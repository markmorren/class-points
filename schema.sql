PRAGMA journal_mode = WAL;

CREATE TABLE teachers (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at   INTEGER NOT NULL
);

CREATE TABLE classes (
  id                TEXT PRIMARY KEY,
  owner_teacher_id  TEXT NOT NULL REFERENCES teachers(id),
  name              TEXT NOT NULL,
  class_code        TEXT NOT NULL UNIQUE,
  created_at        INTEGER NOT NULL,
  archived_at       INTEGER
);
CREATE INDEX idx_classes_owner ON classes(owner_teacher_id);
CREATE INDEX idx_classes_code  ON classes(class_code);

CREATE TABLE class_teachers (
  class_id    TEXT NOT NULL REFERENCES classes(id),
  teacher_id  TEXT NOT NULL REFERENCES teachers(id),
  role        TEXT NOT NULL DEFAULT 'member',
  PRIMARY KEY (class_id, teacher_id)
);
CREATE INDEX idx_class_teachers_teacher ON class_teachers(teacher_id);

CREATE TABLE students (
  id           TEXT PRIMARY KEY,
  class_id     TEXT NOT NULL REFERENCES classes(id),
  display_name TEXT NOT NULL,
  avatar_seed  TEXT,
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL
);
CREATE INDEX idx_students_class ON students(class_id);

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  class_id    TEXT NOT NULL REFERENCES classes(id),
  label       TEXT NOT NULL,
  points      INTEGER NOT NULL DEFAULT 1,
  is_positive INTEGER NOT NULL DEFAULT 1 CHECK (is_positive IN (0, 1)),
  icon        TEXT,
  sound       TEXT
);
CREATE INDEX idx_categories_class ON categories(class_id);

CREATE TABLE group_events (
  id                    TEXT PRIMARY KEY,
  class_id              TEXT NOT NULL REFERENCES classes(id),
  category_id           TEXT NOT NULL REFERENCES categories(id),
  awarded_by_teacher_id TEXT NOT NULL REFERENCES teachers(id),
  created_at            INTEGER NOT NULL
);
CREATE INDEX idx_group_events_class ON group_events(class_id);

CREATE TABLE point_events (
  id                      TEXT PRIMARY KEY,
  class_id                TEXT NOT NULL REFERENCES classes(id),
  student_id              TEXT NOT NULL REFERENCES students(id),
  category_id             TEXT NOT NULL REFERENCES categories(id),
  awarded_by_teacher_id   TEXT NOT NULL REFERENCES teachers(id),
  points                  INTEGER NOT NULL,
  created_at              INTEGER NOT NULL,
  group_event_id          TEXT REFERENCES group_events(id)
);
CREATE INDEX idx_point_events_student ON point_events(student_id);
CREATE INDEX idx_point_events_class   ON point_events(class_id);
CREATE INDEX idx_point_events_group   ON point_events(group_event_id)
  WHERE group_event_id IS NOT NULL;

CREATE TABLE invites (
  token               TEXT PRIMARY KEY,
  class_id            TEXT NOT NULL REFERENCES classes(id),
  role                TEXT NOT NULL DEFAULT 'member',
  expires_at          INTEGER NOT NULL,
  used_by_teacher_id  TEXT REFERENCES teachers(id)
);

CREATE TABLE magic_links (
  token      TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX idx_magic_links_email ON magic_links(email);

CREATE TABLE sessions (
  id             TEXT PRIMARY KEY,
  teacher_id     TEXT NOT NULL REFERENCES teachers(id),
  expires_at     INTEGER NOT NULL,
  created_at     INTEGER NOT NULL,
  last_active_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
