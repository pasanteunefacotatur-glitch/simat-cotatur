-- ==============================================================================
-- PROYECTO: SIMAT-COTATUR (Sistema Integrado de Medición y Analítica Turística)
-- ENTIDAD: Corporación Tachirense de Turismo (COTATUR)
-- FECHA: Noviembre 2026
-- ARCHIVO: 02_catalogos_autocompletado.sql
-- DESCRIPCIÓN: Tablas de catálogos geográficos (29 Municipios del Táchira con sus
--              capitales y Países de procedencia) ordenados por frecuencia de uso.
--              Incluye actualización automática de popularidad según encuestas.
--              Cumple con la regla de modularidad (< 500 líneas).
-- ==============================================================================

-- 1. TABLA: CATÁLOGO DE LOS 29 MUNICIPIOS DEL ESTADO TÁCHIRA Y SUS CAPITALES
CREATE TABLE IF NOT EXISTS public.catalogo_municipios_tachira (
    codigo VARCHAR(40) PRIMARY KEY,
    municipio VARCHAR(80) NOT NULL,
    capital VARCHAR(80) NOT NULL,
    referencias_busqueda TEXT NOT NULL,             -- Pueblos o atractivos clave para el buscador
    frecuencia_uso INTEGER DEFAULT 10 NOT NULL,     -- Contador dinámico de los más utilizados
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- 2. TABLA: CATÁLOGO DE PAÍSES DE PROCEDENCIA
CREATE TABLE IF NOT EXISTS public.catalogo_paises (
    codigo VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL,
    referencias_busqueda TEXT,
    frecuencia_uso INTEGER DEFAULT 10 NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL
);

-- 3. ÍNDICES DE ORDENAMIENTO RÁPIDO POR USO FRECUENTE
CREATE INDEX IF NOT EXISTS idx_municipios_frecuencia
ON public.catalogo_municipios_tachira (frecuencia_uso DESC, municipio ASC);

CREATE INDEX IF NOT EXISTS idx_paises_frecuencia
ON public.catalogo_paises (frecuencia_uso DESC, nombre ASC);

-- 4. POLÍTICAS RLS (LECTURA PÚBLICA PARA AUTOCOMPLETADO ULTRARRÁPIDO)
ALTER TABLE public.catalogo_municipios_tachira ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalogo_paises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica de municipios" ON public.catalogo_municipios_tachira;
CREATE POLICY "Lectura publica de municipios"
ON public.catalogo_municipios_tachira FOR SELECT USING (activo = TRUE);

DROP POLICY IF EXISTS "Lectura publica de paises" ON public.catalogo_paises;
CREATE POLICY "Lectura publica de paises"
ON public.catalogo_paises FOR SELECT USING (activo = TRUE);

-- 5. DATOS SEMILLA: LOS 29 MUNICIPIOS DEL TÁCHIRA ORDENADOS POR FLUJO INICIAL
INSERT INTO public.catalogo_municipios_tachira (codigo, municipio, capital, referencias_busqueda, frecuencia_uso) VALUES
('SAN_CRISTOBAL', 'San Cristóbal', 'San Cristóbal', 'Capital, FISS, Pueblo Nuevo, Chorro El Indio, Barrio Obrero', 1000),
('CARDENAS', 'Cárdenas', 'Táriba', 'Basílica Consolación, Vega de Táriba, Cordero, Las Margaritas', 850),
('CAPACHO_NUEVO', 'Capacho Nuevo', 'Independencia', 'Peribeca, Cerro El Cristo, Mercado de Capacho', 800),
('JAUREGUI', 'Jáuregui', 'La Grita', 'Santo Cristo de La Grita, Páramo El Rosal, Llano Largo', 750),
('BOLIVAR', 'Bolívar', 'San Antonio del Táchira', 'Frontera, Aduana, Puente Simón Bolívar, Peracal', 700),
('PEDRO_MARIA_URENA', 'Pedro María Ureña', 'Ureña', 'Aguas Termales, Puente Atanasio Girardot, Tienditas', 650),
('JUNIN', 'Junín', 'Rubio', 'Ciudad Pontálida, Bramón, Ruta del Café', 600),
('GUASIMOS', 'Guásimos', 'Palmira', 'Agroturismo, Cestería, La Laguna, Copa de Oro', 550),
('ANDRES_BELLO', 'Andrés Bello', 'Cordero', 'Ruta de la Montaña, Monte Carmelo, Las Porqueras', 500),
('JOSE_MARIA_VARGAS', 'José María Vargas', 'El Cobre', 'Páramo El Zumbador, Angostura, Mesa de Aura', 480),
('LOBATERA', 'Lobatera', 'Lobatera', 'San Pedro del Río, Borotá, Minas de Carbón', 460),
('AYACUCHO', 'Ayacucho', 'San Juan de Colón', 'Colón, San Pedro del Río, El Vallado', 440),
('MICHELENA', 'Michelena', 'Michelena', 'Boca de Monte, Páramo, Clima de montaña', 420),
('CAPACHO_VIEJO', 'Capacho Viejo', 'Libertad', 'Lomas Bajas, Cipriano Castro, El Hato', 400),
('GARCIA_DE_HEVIA', 'García de Hevia', 'La Fría', 'Aeropuerto Internacional, Boca de Grita, Orope', 380),
('FERNANDEZ_FEO', 'Fernández Feo', 'San Rafael del Piñal', 'El Piñal, Naranjales, Río Doradas, Santo Domingo', 360),
('LIBERTADOR', 'Libertador', 'Abejales', 'La Pedrera, San Joaquín de Navay, El Milagro', 340),
('URIBANTE', 'Uribante', 'Pregonero', 'Represa Uribante Caparo, La Trampa, Laguna de García', 320),
('CORDOBA', 'Córdoba', 'Santa Ana del Táchira', 'Santa Ana, Río Negro, Café', 300),
('TORBES', 'Torbes', 'San Josecito', 'Río Torbes, Vega de Aza, El Corozo', 280),
('SUCRE', 'Sucre', 'Queniquea', 'Páramo El Batallón, Mesa del Tigre, San Pablo', 260),
('FRANCISCO_DE_MIRANDA', 'Francisco de Miranda', 'San José de Bolívar', 'Río Bobo, Laguna de Río Bobo, Páramo', 240),
('SEBORUCO', 'Seboruco', 'Seboruco', 'Santa Filomena, Mirador', 220),
('RAFAEL_URDANETA', 'Rafael Urdaneta', 'Delicias', 'Páramo El Tamá, Betania, Villa Páez', 200),
('PANAMERICANO', 'Panamericano', 'Coloncito', 'La Palmita, Troncal 1', 180),
('SAMUEL_DARIO_MALDONADO', 'Samuel Darío Maldonado', 'La Tendida', 'Boconó, Hernández', 160),
('ANTONIO_ROMULO_COSTA', 'Antonio Rómulo Costa', 'Las Mesas', 'Piedra Gorda', 140),
('SAN_JUDAS_TADEO', 'San Judas Tadeo', 'Umuquena', 'Las Talas, La Hojita', 120),
('SIMON_RODRIGUEZ', 'Simón Rodríguez', 'San Simón', 'Páramo, Pueblo Hondo', 100)
ON CONFLICT (codigo) DO UPDATE SET
    municipio = EXCLUDED.municipio,
    capital = EXCLUDED.capital,
    referencias_busqueda = EXCLUDED.referencias_busqueda;

-- 6. DATOS SEMILLA: PAÍSES ORDENADOS POR FRECUENCIA DE VISITA AL TÁCHIRA
INSERT INTO public.catalogo_paises (codigo, nombre, referencias_busqueda, frecuencia_uso) VALUES
('CO', 'Colombia', 'Cúcuta, Norte de Santander, Bogotá, Bucaramanga, Medellín, Cali', 1000),
('US', 'Estados Unidos', 'USA, Miami, Florida, Nueva York, Texas', 500),
('ES', 'España', 'Madrid, Barcelona, Canarias, Tenerife', 450),
('EC', 'Ecuador', 'Quito, Guayaquil, Cuenca', 400),
('PE', 'Perú', 'Lima, Arequipa, Trujillo', 380),
('CL', 'Chile', 'Santiago, Valparaíso', 360),
('PA', 'Panamá', 'Ciudad de Panamá', 340),
('MX', 'México', 'CDMX, Monterrey, Guadalajara', 320),
('AR', 'Argentina', 'Buenos Aires, Córdoba', 300),
('BR', 'Brasil', 'São Paulo, Manaos, Boa Vista, Río', 280),
('IT', 'Italia', 'Roma, Milán, Nápoles', 260),
('PT', 'Portugal', 'Lisboa, Madeira, Oporto', 240),
('CA', 'Canadá', 'Toronto, Montreal, Vancouver', 220),
('DE', 'Alemania', 'Berlín, Múnich, Frankfurt', 200),
('FR', 'Francia', 'París, Lyon', 180),
('DO', 'República Dominicana', 'Santo Domingo, Punta Cana', 160),
('CR', 'Costa Rica', 'San José', 150),
('UY', 'Uruguay', 'Montevideo', 140),
('BO', 'Bolivia', 'La Paz, Santa Cruz', 130),
('PY', 'Paraguay', 'Asunción', 120),
('GB', 'Reino Unido', 'Londres, Inglaterra', 110),
('CH', 'Suiza', 'Zúrich, Ginebra', 100),
('CN', 'China', 'Pekín, Shanghái', 90),
('OT', 'Otro país', 'Resto del mundo', 50)
ON CONFLICT (codigo) DO NOTHING;

-- 7. DISPARADOR PARA INCREMENTAR AUTOMÁTICAMENTE LOS MÁS UTILIZADOS
CREATE OR REPLACE FUNCTION public.fn_actualizar_frecuencia_catalogos()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementa el contador del municipio seleccionado
    UPDATE public.catalogo_municipios_tachira
    SET frecuencia_uso = frecuencia_uso + 1
    WHERE municipio = NEW.municipio_destino
       OR (municipio || ' (Cap. ' || capital || ')') = NEW.municipio_destino;

    -- Si es visita internacional, incrementa el contador del país seleccionado
    IF NEW.procedencia_tipo = 'INTERNACIONAL' AND NEW.pais_origen IS NOT NULL THEN
        UPDATE public.catalogo_paises
        SET frecuencia_uso = frecuencia_uso + 1
        WHERE LOWER(nombre) = LOWER(NEW.pais_origen);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_incrementar_frecuencia_catalogos ON public.encuestas_turisticas;
CREATE TRIGGER trg_incrementar_frecuencia_catalogos
AFTER INSERT ON public.encuestas_turisticas
FOR EACH ROW
EXECUTE FUNCTION public.fn_actualizar_frecuencia_catalogos();
