
-- 1. Ajouter colonne game_type sur plaintes
ALTER TABLE plaintes ADD COLUMN IF NOT EXISTS game_type TEXT;

-- 2. Migrer l'info jeu dans game_type pour les dossiers existants
UPDATE plaintes p
SET game_type = c.name
FROM categories c
WHERE p.category_id = c.id
  AND c.name IN ('GTA RP', 'ONESTATE RP', 'Autres jeux', 'Autres jeux RP');

-- 3. Réassigner les dossiers "Corruption" → "Triche / Favoritisme" (fusion)
UPDATE plaintes
SET category_id = '9bb5ce83-44a0-4ae8-a5fe-bab3cbb281aa'
WHERE category_id = '2c464c25-48b0-4ccd-92b2-1ba7bfc7f8e3';

-- 4. Réassigner les dossiers des catégories jeux → NULL category (game_type déjà migré)
UPDATE plaintes
SET category_id = NULL
WHERE category_id IN (
  '29f9fb9b-78f4-4cca-95cd-bc8c3251dc0f',  -- GTA RP
  '5e626dd2-574f-4395-b4cf-70427019fcda',  -- ONESTATE RP
  '5904cf3d-c8fe-4d87-8b8c-8f64baab33ff',  -- Autres jeux
  '34aebc18-faf5-4fe1-8cf5-b08d88bb6801',  -- Autres jeux RP
  '2ff2a4c0-4735-40f6-a637-491d5275dc54'   -- Autre
);

-- 5. Supprimer les catégories parasites
DELETE FROM categories WHERE id IN (
  '29f9fb9b-78f4-4cca-95cd-bc8c3251dc0f',  -- GTA RP
  '5e626dd2-574f-4395-b4cf-70427019fcda',  -- ONESTATE RP
  '5904cf3d-c8fe-4d87-8b8c-8f64baab33ff',  -- Autres jeux
  '34aebc18-faf5-4fe1-8cf5-b08d88bb6801',  -- Autres jeux RP
  '2ff2a4c0-4735-40f6-a637-491d5275dc54',  -- Autre
  '2c464c25-48b0-4ccd-92b2-1ba7bfc7f8e3'   -- Corruption (fusionné dans Triche/Favoritisme)
);

-- 6. Renommer les catégories restantes pour coller aux 5 groupes
UPDATE categories SET name = 'Non-respect du règlement' WHERE id = '8efd7d2c-6aaf-4faf-a8d9-71b0d5c6270c';
UPDATE categories SET name = 'Triche / Favoritisme'     WHERE id = '9bb5ce83-44a0-4ae8-a5fe-bab3cbb281aa';
