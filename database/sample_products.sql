-- Productos de ejemplo para el catálogo (opcional; el seed también los inserta si la tabla está vacía)
\connect feature_tech

INSERT INTO Producto (nombre, descripcion, categoria, marca, precio, stock, stock_minimo, imagen_url) VALUES
('Laptop Nova X15', 'Intel Core i7 13ª gen, 16 GB RAM, SSD 1 TB, pantalla 15.6" 144 Hz.', 'Laptops', 'Nova', 4899000, 12, 5, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800'),
('Smartphone Pulse 12 Pro', 'Pantalla AMOLED 6.7", 256 GB, cámara triple 108 MP, 5G.', 'Smartphones', 'Pulse', 3299000, 3, 5, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800'),
('Audífonos Quantum ANC', 'Cancelación activa de ruido, 40 h de batería, Bluetooth 5.3.', 'Audio', 'Quantum', 689000, 40, 10, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'),
('Smartwatch Orbit S', 'Monitor cardiaco, GPS, resistente al agua 5 ATM.', 'Wearables', 'Orbit', 899000, 0, 5, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'),
('Monitor Neon 27" 4K', 'Panel IPS 4K UHD, HDR400, 144 Hz, USB-C 90 W.', 'Monitores', 'Neon', 1799000, 8, 4, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'),
('Teclado Mecánico Vortex RGB', 'Switches rojos, RGB por tecla, layout español.', 'Accesorios', 'Vortex', 349000, 25, 8, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800'),
('Tablet Lumen 11', 'Pantalla 11" 120 Hz, 128 GB, lápiz incluido.', 'Tablets', 'Lumen', 2199000, 4, 5, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800'),
('Consola Hyper One', '1 TB SSD, 4K 120 FPS, control inalámbrico.', 'Gaming', 'Hyper', 2799000, 15, 5, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800');
