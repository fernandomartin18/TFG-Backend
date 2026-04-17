-- Crear extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: projects
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  is_expanded BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- =====================================================
-- TABLA: chats
-- =====================================================
CREATE TABLE IF NOT EXISTS chats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(255) DEFAULT 'Nuevo Chat',
  pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_pinned ON chats(pinned);

-- =====================================================
-- TABLA: messages
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  is_error BOOLEAN DEFAULT FALSE,
  is_collapsible BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- =====================================================
-- TABLA: message_images
-- =====================================================
CREATE TABLE IF NOT EXISTS message_images (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  image_data TEXT,
  mime_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  image_order INTEGER NOT NULL CHECK (image_order BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_message_images_message_id ON message_images(message_id);


-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLA: templates
-- =====================================================
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS POR DEFECTO (SEMILLAS)
-- =====================================================
INSERT INTO templates (user_id, title, prompt) VALUES
(NULL, 'Código Híbrido desde Imagen', 'Analiza el diagrama de clases de la imagen adjunta y genera los códigos en Python y Qiskit necesarios para implementarlo. Indica antes de enviar cada código el paquete al que pertenece en texto si es que hay paquetes. Ten en cuenta que es un sistema híbrido que contiene tanto clases clásicas como componentes cuánticos. Por favor, sé riguroso y profesional, aplicando buenas prácticas de ingeniería de software y tipado.'),
(NULL, 'Código Clásico desde Imagen', 'Analiza el diagrama de clases de la imagen adjunta y extrae la estructura mostrada para generar los códigos necesarios en [INDICAR LENGUAJE]. Implementa correctamente las clases, métodos, y las relaciones orientadas a objetos (herencia, composición, etc.) que se aprecien visualmente y, antes de enviar cada código, indica en texto el paquete al que pertenece si es que los hay.'),
(NULL, 'Código Cuántico (Qiskit)', E'Diseña un circuito cuántico utilizando Qiskit en Python para resolver:\n\n[DESCRIBE EL PROBLEMA O ALGORITMO QUANTUM AQUÍ]\n\nPor favor, incluye comentarios explicando cada compuerta (gates), el proceso de medición, y cómo ejecutarlo usando un simulador de Aer.'),
(NULL, 'Código a partir de PlantUML', E'A partir del siguiente diseño en formato PlantUML, genera los códigos equivalentes en [INDICAR LENGUAJE]. Asegúrate de incluir la definición completa de las clases, atributos, métodos y la correcta implementación de las relaciones orientadas a objetos (herencia, composición, agregación, etc.). Antes de enviar cada código, asegúrate de indicar el paquete al que pertenece en texto si es que hay paquetes:\n\n[PEGA TU PLANTUML AQUÍ]'),
(NULL, 'Optimización de Código', E'Analiza el siguiente código y sugiere optimizaciones de rendimiento y mejoras siguiendo principios SOLID y de buenas prácticas de código limpio:\n\n[PEGA TU CÓDIGO AQUÍ]');
