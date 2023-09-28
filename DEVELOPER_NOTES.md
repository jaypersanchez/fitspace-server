# Postgresql scripts

## User Schema

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) CHECK (role IN ('admin', 'user')) DEFAULT 'user',
  exercises INTEGER[],
  comments INTEGER[],
  likes INTEGER[],
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  age VARCHAR(255),
  gender VARCHAR(255) CHECK (gender IN ('male', 'female')),
  height VARCHAR(255),
  weight VARCHAR(255),
  steps INTEGER,
  level VARCHAR(255) CHECK (level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  workout_regularity VARCHAR(255) CHECK (workout_regularity IN ('currently', 'months', 'years')),
  gym_goal VARCHAR(255) DEFAULT 'other',
  gym_type VARCHAR(255) CHECK (gym_type IN ('home', 'commercial', 'small', 'crossfit')) DEFAULT 'home',
  frequency INTEGER,
  calories_burned INTEGER[],
  customer_id VARCHAR(255) DEFAULT NULL,
  payment_schedule VARCHAR(255) CHECK (payment_schedule IN ('month', 'year', 'trial')) DEFAULT 'month',
  payment_active BOOLEAN DEFAULT FALSE,
  workout_plans INTEGER[]
);

## Exercises Schema

CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) CHECK (category IN ('pull', 'push', 'legs', 'core', 'kids')) NOT NULL,
  muscle_group VARCHAR(255)[] NOT NULL,
  level VARCHAR(255) NOT NULL,
  equipment VARCHAR(255),
  mets NUMERIC NOT NULL,
  starting_weight JSONB[] NOT NULL,
  video_url VARCHAR(255) NOT NULL
);