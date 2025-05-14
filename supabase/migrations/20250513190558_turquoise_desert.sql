/*
  # Initial schema for EduBiblio

  1. New Tables
    - `documents` - Stores PDF documents information
      - `id` (uuid, primary key)
      - `titre` (text, document title)
      - `matiere` (text, subject area)
      - `niveau` (text, education level)
      - `description` (text, document description)
      - `pages` (integer, number of pages)
      - `thumbnail_url` (text, URL to thumbnail image)
      - `preview_url` (text, URL to preview image)
      - `file_url` (text, URL to the PDF file)
      - `created_at` (timestamptz, creation date)
    - `user_downloads` - Tracks user download history
      - `id` (uuid, primary key)
      - `user_id` (uuid, reference to auth.users)
      - `document_id` (uuid, reference to documents)
      - `downloaded_at` (timestamptz, download timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  matiere text NOT NULL,
  niveau text NOT NULL,
  description text NOT NULL,
  pages integer NOT NULL,
  thumbnail_url text,
  preview_url text,
  file_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_downloads table
CREATE TABLE IF NOT EXISTS user_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  document_id uuid REFERENCES documents NOT NULL,
  downloaded_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downloads ENABLE ROW LEVEL SECURITY;

-- Create security policies for documents table
CREATE POLICY "Documents are viewable by authenticated users"
  ON documents
  FOR SELECT
  TO authenticated
  USING (true);

-- Create security policies for user_downloads table
CREATE POLICY "Users can insert their own downloads"
  ON user_downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own downloads"
  ON user_downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);