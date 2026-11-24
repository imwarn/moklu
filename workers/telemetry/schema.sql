CREATE TABLE IF NOT EXISTS funnel_daily (
  day TEXT NOT NULL,
  event TEXT NOT NULL,
  tool TEXT NOT NULL,
  slug TEXT NOT NULL,
  locale TEXT NOT NULL,
  format TEXT NOT NULL,
  ext TEXT NOT NULL,
  country TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  metric_sum REAL NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (day, event, tool, slug, locale, format, ext, country)
);

CREATE INDEX IF NOT EXISTS idx_funnel_daily_day_event
  ON funnel_daily (day, event);
